const admin = require("firebase-admin");
const crypto = require("crypto");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const { sendTwoWeeksAdminSms } = require("./twoWeeksAdminSms");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { getTwoWeeksFeedbackPrivateData } = require("./twoWeeksFeedbackPrivateStore");

if (!admin.apps.length) admin.initializeApp();

const REGION = "asia-northeast3";
const SITE_URL = String(process.env.NEXT_PUBLIC_SITE_URL || "https://charmingsoup.com").replace(/\/$/, "");
const SUCCESS_INVITE_AFTER_MS = 21 * 24 * 60 * 60 * 1000;
const SUCCESS_INVITE_MAX_MS = 35 * 24 * 60 * 60 * 1000;
const REVIEW_TAGS = new Set([
  "easy_meeting",
  "sixty_minutes",
  "trusted_profile",
  "curated_match",
  "comfortable_process",
  "would_recommend",
]);
const SUCCESS_STATUSES = new Set(["getting_to_know", "dating", "relationship", "not_continuing"]);
const ADMIN_UID = "9OqbfNZW6lgq5NLB0lAigkYQxME2";

function safeString(value = "", max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function hashToken(token = "") {
  return crypto.createHash("sha256").update(safeString(token, 300)).digest("hex");
}

function secureTokenEquals(left = "", right = "") {
  const leftBuffer = Buffer.from(safeString(left, 300));
  const rightBuffer = Buffer.from(safeString(right, 300));
  if (!leftBuffer.length || leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function parseMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getName(application = {}) {
  return safeString(application?.basic?.name || application?.name || "회원", 50) || "회원";
}

function getPhone(application = {}) {
  return onlyDigits(application?.basic?.phoneNormalized || application?.basic?.phone || application?.phone || "");
}

function getStoredDashboardToken(application = {}) {
  return safeString(
    application?.dashboardAccess?.token ||
      application?.access?.dashboardToken ||
      application?.dashboardToken ||
      "",
    300
  );
}

function getDashboardPath(application = {}) {
  const storedPath = safeString(application?.dashboardAccess?.path, 600);
  if (storedPath.startsWith("/")) return storedPath;
  const applicationId = safeString(application?.id, 200);
  const token = getStoredDashboardToken(application);
  const basePath = "/2weeks/proposal/dashboard";
  if (!token) return basePath;
  const query = new URLSearchParams();
  if (applicationId) query.set("aid", applicationId);
  query.set("token", token);
  return `${basePath}?${query.toString()}`;
}

function maskName(name = "") {
  const clean = safeString(name, 30).replace(/\s+/g, "");
  if (!clean) return "익명회원";
  if (clean.length === 1) return `${clean}ㅇ`;
  return `${clean[0]}${"ㅇ".repeat(Math.min(2, clean.length - 1))}`;
}

function getDisplayCategory(application = {}, privateApplication = {}) {
  const identity = application?.identity || {};
  const adminMeta = privateApplication?.adminMatchingMeta || {};
  if (identity.jobCategory === "회사원") {
    return safeString(adminMeta.companyScaleVerified || identity.companyScale || "직장인", 30) || "직장인";
  }
  return safeString(identity.jobCategory || "투윅스 회원", 30) || "투윅스 회원";
}

function buildAnonymousLabel(application = {}, privateApplication = {}) {
  return `${getDisplayCategory(application, privateApplication)} · ${maskName(getName(application))}`;
}

function getAcquisitionSource(application = {}) {
  return safeString(
    application?.acquisitionSource ||
      application?.marketingSource ||
      application?.source ||
      application?.utm?.source ||
      "direct",
    80
  );
}

async function isAdminUid(uid = "") {
  if (!uid) return false;
  if (uid === ADMIN_UID) return true;
  const snap = await admin.firestore().collection("adminConfig").doc("access").get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  return (Array.isArray(data.allowedUids) && data.allowedUids.includes(uid)) ||
    (Array.isArray(data.superAdmins) && data.superAdmins.includes(uid));
}

async function requireAdmin(request) {
  const uid = request.auth?.uid || "";
  if (!uid || !(await isAdminUid(uid))) throw new HttpsError("permission-denied", "관리자 권한이 필요합니다.");
  return uid;
}

async function loadParticipantContext({ matchId, applicationId }) {
  const db = admin.firestore();
  const [matchSnap, applicationSnap, privateSnap, adminMetaSnap] = await Promise.all([
    db.collection("twoweeksMatches").doc(matchId).get(),
    db.collection("twoweeksApplications").doc(applicationId).get(),
    db.collection("twoweeksApplicationPrivate").doc(applicationId).get(),
    db.collection("twoweeksApplicationAdminMeta").doc(applicationId).get(),
  ]);
  if (!matchSnap.exists || !applicationSnap.exists) {
    throw new HttpsError("not-found", "이용 정보를 찾지 못했습니다.");
  }
  const match = { id: matchSnap.id, ...matchSnap.data() };
  const participantIds = [match.maleApplicationId, match.femaleApplicationId].filter(Boolean);
  if (!participantIds.includes(applicationId)) throw new HttpsError("permission-denied", "해당 만남의 참여자가 아닙니다.");

  const legacyPrivate = privateSnap.exists ? privateSnap.data() || {} : {};
  const adminMeta = adminMetaSnap.exists ? adminMetaSnap.data() || {} : {};
  const privateFeedback = await getTwoWeeksFeedbackPrivateData(db, matchId, match);

  return {
    match: {
      ...match,
      feedbacks: privateFeedback.feedbacks,
      feedbackTokens: privateFeedback.feedbackTokens,
    },
    application: { id: applicationSnap.id, ...applicationSnap.data() },
    privateApplication: {
      ...legacyPrivate,
      adminMatchingMeta:
        adminMeta.adminMatchingMeta ||
        (legacyPrivate?.adminMatchingMeta?.reviewedByUid ? legacyPrivate.adminMatchingMeta : {}),
    },
  };
}

async function sendLms({ to, subject, message }) {
  const phone = onlyDigits(to);
  if (!phone) return { status: "skipped", reason: "NO_PHONE" };
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");
  if (!serviceId || !accessKey || !secretKey || !from) return { status: "failed", reason: "MISSING_NCP_ENV" };

  const method = "POST";
  const urlPath = `/sms/v2/services/${serviceId}/messages`;
  const url = `https://sens.apigw.ntruss.com${urlPath}`;
  const timestamp = Date.now().toString();
  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(method);
  hmac.update(" ");
  hmac.update(urlPath);
  hmac.update("\n");
  hmac.update(timestamp);
  hmac.update("\n");
  hmac.update(accessKey);
  const signature = hmac.finalize().toString(CryptoJS.enc.Base64);

  try {
    const response = await axios.post(
      url,
      {
        type: "LMS",
        contentType: "COMM",
        countryCode: "82",
        from,
        subject: safeString(subject || "투윅스 안내", 40),
        content: message,
        messages: [{ to: phone }],
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "x-ncp-iam-access-key": accessKey,
          "x-ncp-apigw-timestamp": timestamp,
          "x-ncp-apigw-signature-v2": signature,
        },
      }
    );
    return {
      status: "sent",
      sentAtClient: new Date().toISOString(),
      providerRequestId: String(response?.data?.requestId || ""),
    };
  } catch (error) {
    logger.error("[TwoWeeksMarketingStories] SMS failed", error?.response?.data || error?.message || error);
    return { status: "failed", failedAtClient: new Date().toISOString(), errorMessage: error?.response?.data || error?.message || String(error) };
  }
}

exports.ensureTwoWeeksReviewAccess = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

    const db = admin.firestore();
    const feedbackToken = safeString(request.data?.feedbackToken, 300);
    let matchId = "";
    let applicationId = "";

    const usesFeedbackToken = feedbackToken.length >= 20;
    if (usesFeedbackToken) {
      const feedbackAccessSnap = await db.collection("twoweeksFeedbackAccess").doc(hashToken(feedbackToken)).get();
      if (!feedbackAccessSnap.exists) throw new HttpsError("not-found", "만남 정보를 찾지 못했습니다.");
      const feedbackAccess = feedbackAccessSnap.data() || {};
      matchId = safeString(feedbackAccess.matchId, 200);
      applicationId = safeString(feedbackAccess.applicationId, 200);
    } else {
      matchId = safeString(request.data?.matchId, 200);
      applicationId = safeString(request.data?.viewerApplicationId, 200);
      if (!matchId || !applicationId) {
        throw new HttpsError("invalid-argument", "후기 작성 정보를 확인할 수 없습니다.");
      }

    }

    await assertApplicationOwner(request, applicationId, { allowAdmin: false });

    const { match } = await loadParticipantContext({ matchId, applicationId });
    if (usesFeedbackToken) {
      const storedFeedbackToken = safeString(match.feedbackTokens?.[applicationId]?.token, 300);
      if (!secureTokenEquals(storedFeedbackToken, feedbackToken)) {
        throw new HttpsError("permission-denied", "만료되었거나 올바르지 않은 피드백 링크입니다.");
      }
    }
    const feedback = match.feedbacks?.[applicationId] || {};
    if (feedback.meetingResult !== "met") {
      throw new HttpsError("failed-precondition", "실제 만남이 완료된 회원만 이용 후기를 남길 수 있습니다.");
    }

    const reviewId = `${matchId}_${applicationId}`;
    const existing = await db.collection("twoweeksReviews").doc(reviewId).get();
    if (existing.exists) return { ok: true, alreadySubmitted: true, reviewId };

    const token = createToken();
    await db.collection("twoweeksMarketingAccess").doc(hashToken(token)).set({
      type: "review",
      reviewId,
      matchId,
      applicationId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtClient: new Date().toISOString(),
    });
    return { ok: true, token, path: `/2weeks/review?token=${encodeURIComponent(token)}` };
  }
);

exports.resolveTwoWeeksMarketingAccess = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const token = safeString(request.data?.token, 300);
    const expectedType = safeString(request.data?.type, 30);
    if (token.length < 20 || !["review", "success_story"].includes(expectedType)) {
      throw new HttpsError("invalid-argument", "링크가 올바르지 않습니다.");
    }
    const db = admin.firestore();
    const accessSnap = await db.collection("twoweeksMarketingAccess").doc(hashToken(token)).get();
    if (!accessSnap.exists) throw new HttpsError("not-found", "만료되었거나 올바르지 않은 링크입니다.");
    const access = accessSnap.data() || {};
    if (access.type !== expectedType) throw new HttpsError("permission-denied", "링크 종류가 올바르지 않습니다.");
    await assertApplicationOwner(request, access.applicationId, { allowAdmin: false });
    const { application, privateApplication } = await loadParticipantContext({
      matchId: access.matchId,
      applicationId: access.applicationId,
    });
    const collectionName = expectedType === "review" ? "twoweeksReviews" : "twoweeksSuccessStories";
    const contentId = expectedType === "review" ? access.reviewId : access.storyId;
    const contentSnap = contentId ? await db.collection(collectionName).doc(contentId).get() : null;
    return {
      ok: true,
      type: expectedType,
      submitted: Boolean(contentSnap?.exists),
      displayLabel: buildAnonymousLabel(application, privateApplication),
      dashboardPath: getDashboardPath(application),
    };
  }
);

exports.submitTwoWeeksReview = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const token = safeString(request.data?.token, 300);
    const rating = Number(request.data?.rating);
    const tags = Array.isArray(request.data?.tags) ? request.data.tags.map((v) => safeString(v, 40)).filter((v) => REVIEW_TAGS.has(v)) : [];
    const content = safeString(request.data?.content, 700);
    const publishConsent = request.data?.publishConsent === true;
    if (token.length < 20) throw new HttpsError("invalid-argument", "후기 링크가 올바르지 않습니다.");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpsError("invalid-argument", "만족도를 선택해주세요.");
    if (content.length < 20) throw new HttpsError("invalid-argument", "후기를 20자 이상 작성해주세요.");

    const db = admin.firestore();
    const accessSnap = await db.collection("twoweeksMarketingAccess").doc(hashToken(token)).get();
    if (!accessSnap.exists || accessSnap.data()?.type !== "review") throw new HttpsError("not-found", "만료되었거나 올바르지 않은 후기 링크입니다.");
    const access = accessSnap.data() || {};
    await assertApplicationOwner(request, access.applicationId, { allowAdmin: false });
    const { match, application, privateApplication } = await loadParticipantContext({ matchId: access.matchId, applicationId: access.applicationId });
    if (match.feedbacks?.[access.applicationId]?.meetingResult !== "met") throw new HttpsError("failed-precondition", "실제 만남 완료 후 후기를 작성할 수 있습니다.");
    const reviewId = safeString(access.reviewId, 500) || `${access.matchId}_${access.applicationId}`;
    const reviewRef = db.collection("twoweeksReviews").doc(reviewId);
    if ((await reviewRef.get()).exists) throw new HttpsError("already-exists", "이미 후기를 작성했습니다.");
    const nowClient = new Date().toISOString();
    await reviewRef.set({
      type: "review",
      matchId: access.matchId,
      applicationId: access.applicationId,
      verifiedMeeting: true,
      rating,
      tags,
      content,
      publishConsent,
      displayLabel: buildAnonymousLabel(application, privateApplication),
      acquisitionSource: getAcquisitionSource(application),
      status: publishConsent ? "pending" : "private_only",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtClient: nowClient,
      publicDocId: "",
    });

    if (publishConsent) {
      await sendTwoWeeksAdminSms({
        subject: "투윅스 후기 검토",
        message: `[투윅스] 공개 동의 이용후기 1건이 등록되었습니다.\n${buildAnonymousLabel(application, privateApplication)} · ${rating}점\n관리자 > 후기/성공사례에서 검토해주세요.`,
      });
    }
    return { ok: true, submitted: true };
  }
);

exports.submitTwoWeeksSuccessStory = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const token = safeString(request.data?.token, 300);
    const relationshipStatus = safeString(request.data?.relationshipStatus, 40);
    const content = safeString(request.data?.content, 1400);
    const publishConsent = request.data?.publishConsent === true;
    if (token.length < 20 || !SUCCESS_STATUSES.has(relationshipStatus)) throw new HttpsError("invalid-argument", "현재 관계 상태를 선택해주세요.");
    if (relationshipStatus !== "not_continuing" && content.length < 30) throw new HttpsError("invalid-argument", "이야기를 30자 이상 작성해주세요.");

    const db = admin.firestore();
    const accessSnap = await db.collection("twoweeksMarketingAccess").doc(hashToken(token)).get();
    if (!accessSnap.exists || accessSnap.data()?.type !== "success_story") throw new HttpsError("not-found", "만료되었거나 올바르지 않은 링크입니다.");
    const access = accessSnap.data() || {};
    await assertApplicationOwner(request, access.applicationId, { allowAdmin: false });
    const { match, application, privateApplication } = await loadParticipantContext({ matchId: access.matchId, applicationId: access.applicationId });
    if (match.contactOpenStatus !== "mutual_open" && !match.contactOpenedAtClient) {
      throw new HttpsError("failed-precondition", "연락처가 연결된 만남만 이후 이야기를 남길 수 있습니다.");
    }
    const storyId = safeString(access.storyId, 500) || `${access.matchId}_${access.applicationId}`;
    const storyRef = db.collection("twoweeksSuccessStories").doc(storyId);
    if ((await storyRef.get()).exists) throw new HttpsError("already-exists", "이미 이야기를 남겼습니다.");
    const canPublish = relationshipStatus !== "not_continuing" && publishConsent;
    const nowClient = new Date().toISOString();
    await storyRef.set({
      type: "success_story",
      matchId: access.matchId,
      applicationId: access.applicationId,
      verifiedMeeting: true,
      verifiedMutualContact: true,
      relationshipStatus,
      content,
      publishConsent: canPublish,
      displayLabel: buildAnonymousLabel(application, privateApplication),
      acquisitionSource: getAcquisitionSource(application),
      status: canPublish ? "pending" : relationshipStatus === "not_continuing" ? "not_continuing" : "private_only",
      contactOpenedAtClient: match.contactOpenedAtClient || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtClient: nowClient,
      publicDocId: "",
    });
    if (canPublish) {
      await sendTwoWeeksAdminSms({
        subject: "투윅스 성공사례 검토",
        message: `[투윅스] 공개 동의 성공스토리 1건이 등록되었습니다.\n${buildAnonymousLabel(application, privateApplication)}\n관리자 > 후기/성공사례에서 검토해주세요.`,
      });
    }
    return { ok: true, submitted: true };
  }
);

exports.moderateTwoWeeksMarketingContent = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    const adminUid = await requireAdmin(request);
    const type = safeString(request.data?.type, 30);
    const contentId = safeString(request.data?.contentId, 500);
    const action = safeString(request.data?.action, 30);
    const requestedPublicContent = safeString(request.data?.publicContent, 1400);
    if (!contentId || !["review", "success_story"].includes(type) || !["publish", "hide"].includes(action)) {
      throw new HttpsError("invalid-argument", "후기 관리 요청이 올바르지 않습니다.");
    }
    const db = admin.firestore();
    const privateCollection = type === "review" ? "twoweeksReviews" : "twoweeksSuccessStories";
    const publicCollection = type === "review" ? "twoweeksPublicReviews" : "twoweeksPublicSuccessStories";
    const ref = db.collection(privateCollection).doc(contentId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "후기를 찾지 못했습니다.");
    const data = snap.data() || {};

    if (action === "publish") {
      if (data.publishConsent !== true) throw new HttpsError("failed-precondition", "공개 활용에 동의하지 않은 후기입니다.");
      const publicDocId = safeString(data.publicDocId, 200) || crypto.randomUUID();
      const publicContent = requestedPublicContent || safeString(data.publicContent || data.content, type === "review" ? 700 : 1400);
      if (publicContent.length < 10) throw new HttpsError("invalid-argument", "공개용 문구를 확인해주세요.");
      const publicData = type === "review"
        ? {
            type: "review",
            verified: true,
            displayLabel: safeString(data.displayLabel, 80),
            rating: Number(data.rating || 0),
            tags: Array.isArray(data.tags) ? data.tags.slice(0, 8) : [],
            content: safeString(publicContent, 700),
            publishedAtClient: new Date().toISOString(),
          }
        : {
            type: "success_story",
            verified: true,
            displayLabel: safeString(data.displayLabel, 80),
            relationshipStatus: safeString(data.relationshipStatus, 40),
            content: safeString(publicContent, 1400),
            publishedAtClient: new Date().toISOString(),
          };
      const batch = db.batch();
      batch.set(db.collection(publicCollection).doc(publicDocId), publicData, { merge: false });
      batch.set(ref, {
        status: "published",
        publicDocId,
        publicContent,
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAtClient: new Date().toISOString(),
        moderatedBy: adminUid,
      }, { merge: true });
      await batch.commit();
      return { ok: true, status: "published", publicDocId };
    }

    const publicDocId = safeString(data.publicDocId, 200);
    const batch = db.batch();
    if (publicDocId) batch.delete(db.collection(publicCollection).doc(publicDocId));
    batch.set(ref, {
      status: "hidden",
      hiddenAt: admin.firestore.FieldValue.serverTimestamp(),
      hiddenAtClient: new Date().toISOString(),
      moderatedBy: adminUid,
    }, { merge: true });
    await batch.commit();
    return { ok: true, status: "hidden" };
  }
);

exports.sendTwoWeeksSuccessStoryInvitations = onSchedule(
  { region: REGION, schedule: "0 14 * * *", timeZone: "Asia/Seoul", timeoutSeconds: 300, memory: "512MiB" },
  async () => {
    const db = admin.firestore();
    const snapshot = await db.collection("twoweeksMatches").where("contactOpenStatus", "==", "mutual_open").get();
    const nowMs = Date.now();
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const docSnap of snapshot.docs) {
      const match = { id: docSnap.id, ...docSnap.data() };
      const openedMs = parseMs(match.contactOpenedAtClient || match.contactOpenedAt);
      const ageMs = openedMs ? nowMs - openedMs : 0;
      if (!openedMs || ageMs < SUCCESS_INVITE_AFTER_MS || ageMs > SUCCESS_INVITE_MAX_MS) continue;
      const participantIds = [match.maleApplicationId, match.femaleApplicationId].filter(Boolean);
      for (const applicationId of participantIds) {
        const existingInvitation = match.successStoryInvitations?.[applicationId] || {};
        if (["sent", "skipped_marketing_consent"].includes(existingInvitation.status)) {
          skipped += 1;
          continue;
        }
        if (Number(existingInvitation.attemptCount || 0) >= 3) {
          skipped += 1;
          continue;
        }
        const storyId = `${match.id}_${applicationId}`;
        if ((await db.collection("twoweeksSuccessStories").doc(storyId).get()).exists) {
          skipped += 1;
          continue;
        }
        const applicationSnap = await db.collection("twoweeksApplications").doc(applicationId).get();
        if (!applicationSnap.exists) {
          skipped += 1;
          continue;
        }
        const application = { id: applicationSnap.id, ...applicationSnap.data() };
        if (application?.consents?.marketing !== true) {
          await docSnap.ref.set({
            successStoryInvitations: {
              [applicationId]: {
                status: "skipped_marketing_consent",
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                sentAtClient: new Date().toISOString(),
                reason: "MARKETING_CONSENT_REQUIRED",
                attemptCount: Number(existingInvitation.attemptCount || 0),
              },
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          skipped += 1;
          continue;
        }
        const token = createToken();
        await db.collection("twoweeksMarketingAccess").doc(hashToken(token)).set({
          type: "success_story",
          storyId,
          matchId: match.id,
          applicationId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAtClient: new Date().toISOString(),
        });
        const url = `${SITE_URL}/2weeks/success-story?token=${encodeURIComponent(token)}`;
        const result = await sendLms({
          to: getPhone(application),
          subject: "투윅스, 그 후의 이야기",
          message: [
            "[투윅스] 그날의 만남 이후, 좋은 인연을 이어가고 계신가요?",
            `${getName(application)}님의 이야기를 들려주세요.`,
            "실제 경험이 쌓일수록 투윅스에 더 좋은 회원이 모이고, 다음 만남의 선택지도 더 좋아질 수 있습니다.",
            "약 2분 · 공개 여부는 직접 선택 · 공개 시 익명 처리",
            "",
            url,
          ].join("\n"),
        });
        await docSnap.ref.set({
          successStoryInvitations: {
            [applicationId]: {
              status: result.status,
              attemptCount: Number(existingInvitation.attemptCount || 0) + 1,
              lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
              lastAttemptAtClient: new Date().toISOString(),
              ...(result.status === "sent" ? { sentAt: admin.firestore.FieldValue.serverTimestamp(), sentAtClient: new Date().toISOString() } : {}),
              reason: result.reason || "",
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        if (result.status === "sent") sent += 1;
        else if (result.status === "failed") failed += 1;
        else skipped += 1;
      }
    }
    logger.info("[TwoWeeksMarketingStories] success story invitations", { sent, failed, skipped });
    return null;
  }
);
