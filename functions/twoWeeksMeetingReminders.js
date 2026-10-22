const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { sendTwoWeeksAdminSms } = require("./twoWeeksAdminSms");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { getTwoWeeksFeedbackPrivateData } = require("./twoWeeksFeedbackPrivateStore");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MEETING_DURATION_MS = 60 * 60 * 1000;
const FEEDBACK_REQUEST_AFTER_START_MS = MEETING_DURATION_MS;
const MEETING_START_REMINDER_BEFORE_MS = 5 * 60 * 1000;
const MEETING_START_REMINDER_GRACE_MS = 10 * 60 * 1000;
const FEEDBACK_REPAIR_WINDOW_MS = 48 * 60 * 60 * 1000;
const FEEDBACK_SUBMISSION_WINDOW_MS = 48 * 60 * 60 * 1000;
const NOTIFICATION_LOCK_STALE_MS = 2 * 60 * 1000;
const MAX_NOTIFICATION_ATTEMPTS = 3;

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getBasic(application = {}) {
  return application.basic || {};
}

function getApplicationPhone(application = {}) {
  const basic = getBasic(application);
  return onlyDigits(basic.phoneNormalized || basic.phone || application.phone || "");
}

function getApplicationName(application = {}) {
  const basic = getBasic(application);
  return basic.name || basic.nickname || "신청자";
}

function getStoredDashboardToken(application = {}) {
  return String(
    application?.dashboardAccess?.token ||
      application?.access?.dashboardToken ||
      application?.dashboardToken ||
      application?.accessToken ||
      application?.proposalAccessToken ||
      ""
  ).trim();
}

function secureTokenEquals(left = "", right = "") {
  const leftBuffer = Buffer.from(String(left || "").trim());
  const rightBuffer = Buffer.from(String(right || "").trim());
  if (!leftBuffer.length || leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getDashboardPath(application = {}) {
  const storedPath = String(application?.dashboardAccess?.path || "").trim();
  if (storedPath.startsWith("/")) return storedPath;

  const applicationId = String(application?.id || "").trim();
  const token = getStoredDashboardToken(application);
  const basePath = "/2weeks/proposal/dashboard";
  if (!token) return basePath;

  const query = new URLSearchParams();
  if (applicationId) query.set("aid", applicationId);
  query.set("token", token);
  return `${basePath}?${query.toString()}`;
}

function getDashboardUrl(application = {}) {
  if (application?.dashboardAccess?.url) return application.dashboardAccess.url;
  return `${getSiteOrigin()}${getDashboardPath(application)}`;
}

function getSiteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVICE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://charmingsoup.com"
  ).replace(/\/$/, "");
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

function hashFeedbackToken(token = "") {
  return crypto.createHash("sha256").update(String(token || "").trim()).digest("hex");
}

function getFeedbackPath(token = "") {
  return `/2weeks/feedback?token=${encodeURIComponent(String(token || "").trim())}`;
}

function getFeedbackUrl(token = "") {
  return `${getSiteOrigin()}${getFeedbackPath(token)}`;
}

function writeFeedbackAccessLookup(batch, db, { token, matchId, applicationId, counterpartApplicationId, createdAtClient }) {
  const cleanToken = String(token || "").trim();
  if (!cleanToken || !matchId || !applicationId) return;

  const tokenHash = hashFeedbackToken(cleanToken);
  batch.set(
    db.collection("twoweeksFeedbackAccess").doc(tokenHash),
    {
      tokenHash,
      matchId,
      applicationId,
      counterpartApplicationId: counterpartApplicationId || "",
      status: "active",
      createdAtClient: createdAtClient || new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAtClient: new Date().toISOString(),
    },
    { merge: true }
  );
}

function getFinalMeeting(match = {}) {
  return match.finalMeeting || match.schedule?.finalMeeting || {};
}

function getMeetingStartMs(finalMeeting = {}) {
  const value =
    finalMeeting.startAtClient ||
    finalMeeting.finalTimeChoice?.startAtClient ||
    finalMeeting.timeChoice?.startAtClient ||
    finalMeeting.selectedChoice?.startAtClient ||
    "";

  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

function getPostMeetingFeedbackMs(finalMeeting = {}) {
  const meetingMs = getMeetingStartMs(finalMeeting);
  return meetingMs ? meetingMs + FEEDBACK_REQUEST_AFTER_START_MS : 0;
}

function formatMeetingEndTime(finalMeeting = {}) {
  const meetingMs = getMeetingStartMs(finalMeeting);
  if (!meetingMs) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(meetingMs + MEETING_DURATION_MS));
}

function isFeedbackRequestAlreadyHandled(match = {}) {
  const reminders = match.reminders || {};
  const deliveryResults = match.feedbackRequestSms?.results || {};
  const allDeliveriesSent =
    String(deliveryResults?.male?.status || "") === "sent" &&
    String(deliveryResults?.female?.status || "") === "sent";
  const retryExhausted = Number(match.feedbackRequestSms?.attemptCount || 0) >= 3;

  // feedbackStatus="waiting"만으로는 실제 피드백 안내가 발송됐다고 보면 안 됩니다.
  // 상태만 waiting으로 남고 토큰/문자가 생성되지 않은 이전 건도 자동 복구할 수 있어야 합니다.
  // 발송 시각만 저장되고 실제 양쪽 문자가 실패한 경우도 처리 완료로 보지 않습니다.
  return Boolean(
    (reminders.feedbackRequestSentAtClient && allDeliveriesSent) ||
      allDeliveriesSent ||
      retryExhausted ||
      match.feedbackStatus === "partial" ||
      match.feedbackStatus === "completed" ||
      match.feedbackStatus === "issue_reported" ||
      match.feedbackStatus === "reviewed" ||
      match.feedbackStatus === "timeout_processed"
  );
}

function formatTime(finalMeeting = {}) {
  const time =
    finalMeeting.finalTimeChoice ||
    finalMeeting.timeChoice ||
    finalMeeting.selectedChoice ||
    finalMeeting ||
    {};

  return [time.dateLabel, time.timeLabel].filter(Boolean).join(" ") || "-";
}

function formatPlace(finalMeeting = {}) {
  const place =
    finalMeeting.finalPlaceChoice ||
    finalMeeting.placeChoice ||
    finalMeeting.selectedChoice ||
    finalMeeting ||
    {};

  return [place.area, finalMeeting.placeName || place.cafeName || place.placeName]
    .filter(Boolean)
    .join(" / ") || "-";
}

function toKstDateKey(ms) {
  const date = new Date(ms + KST_OFFSET_MS);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getKstHour(ms) {
  return new Date(ms + KST_OFFSET_MS).getUTCHours();
}

function truncateText(value = "", max = 80) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function buildCounterpartNoteLine(note = "") {
  const preview = truncateText(note, 80);
  return preview ? `상대 한마디: ${preview}` : "상대 한마디는 아직 없습니다.";
}

function buildReminderMessage({ application, finalMeeting, type, counterpartNote }) {
  const dashboardUrl = getDashboardUrl(application);
  const title =
    type === "dayBefore"
      ? "내일 만남 안내"
      : type === "meetingStart"
      ? "곧 만남이 시작됩니다"
      : "만남 2시간 전 안내";

  const guideLines =
    type === "dayBefore"
      ? ["내일 약속 시간에 맞춰 방문해주세요."]
      : type === "meetingStart"
      ? [
          "카페에 도착하면 신청현황의 일정조율에서 현장사진을 올리고 도착 확인을 완료해주세요.",
          "현장사진은 서로의 자리를 찾는 데 활용됩니다.",
          "아직 '만남 전 한마디'를 남기지 않았다면 복장이나 기다리는 위치를 짧게 남겨주세요.",
        ]
      : ["약속 2시간 전입니다. 여유 있게 이동해주세요."];

  return [
    `[투윅스] ${title}`,
    "",
    `일시: ${formatTime(finalMeeting)}`,
    `장소: ${formatPlace(finalMeeting)}`,
    finalMeeting.mapUrl || finalMeeting.cafeMapUrl ? `지도: ${finalMeeting.mapUrl || finalMeeting.cafeMapUrl}` : "",
    "",
    buildCounterpartNoteLine(counterpartNote),
    ...guideLines,
    "",
    "신청현황:",
    dashboardUrl,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildFeedbackMessage({ application, finalMeeting, feedbackUrl }) {
  const endTime = formatMeetingEndTime(finalMeeting);

  return [
    "[투윅스] 만남 마무리 안내",
    "",
    endTime ? `${endTime}, 투윅스에서 안내드린 1시간 만남이 마무리될 시간입니다.` : "투윅스에서 안내드린 1시간 만남이 마무리될 시간입니다.",
    "만남이 잘 이어지고 있다면 조금 더 대화하셔도 괜찮아요 🙂",
    "",
    "만남이 끝났다면 짧은 피드백을 남겨주세요.",
    "피드백은 안내 후 48시간 이내 작성해주세요.",
    "기한 내 미응답 시 이번 만남의 연락처 공개 의사가 없는 것으로 처리되어 연락처가 공개되지 않습니다.",
    "반복적인 미응답은 추후 매칭에 영향을 줄 수 있습니다.",
    "",
    "피드백 남기기:",
    feedbackUrl,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendFeedbackRequestToPair({ match }) {
  const db = admin.firestore();
  const finalMeeting = getFinalMeeting(match);
  const maleSnap = await db.collection("twoweeksApplications").doc(match.maleApplicationId).get();
  const femaleSnap = await db.collection("twoweeksApplications").doc(match.femaleApplicationId).get();

  if (!maleSnap.exists || !femaleSnap.exists) {
    return {
      status: "skipped",
      reason: "APPLICATION_NOT_FOUND",
    };
  }

  const male = { id: maleSnap.id, ...maleSnap.data() };
  const female = { id: femaleSnap.id, ...femaleSnap.data() };
  const privateFeedback = await getTwoWeeksFeedbackPrivateData(db, match.id, match);
  const existingTokens = privateFeedback.feedbackTokens || {};
  const nowClient = new Date().toISOString();
  const meetingMs = getMeetingStartMs(finalMeeting);
  const estimatedEndAtClient = meetingMs ? new Date(meetingMs + MEETING_DURATION_MS).toISOString() : "";
  const feedbackDueAtClient = meetingMs ? new Date(meetingMs + FEEDBACK_REQUEST_AFTER_START_MS).toISOString() : "";
  const feedbackDeadlineAtClient = new Date(Date.parse(nowClient) + FEEDBACK_SUBMISSION_WINDOW_MS).toISOString();

  const maleToken = existingTokens?.[male.id]?.token || makeToken();
  const femaleToken = existingTokens?.[female.id]?.token || makeToken();

  const feedbackTokens = {
    [male.id]: {
      ...(existingTokens?.[male.id] || {}),
      token: maleToken,
      applicationId: male.id,
      counterpartApplicationId: female.id,
      matchId: match.id,
      createdAtClient: existingTokens?.[male.id]?.createdAtClient || nowClient,
      requestSentAtClient: nowClient,
    },
    [female.id]: {
      ...(existingTokens?.[female.id] || {}),
      token: femaleToken,
      applicationId: female.id,
      counterpartApplicationId: male.id,
      matchId: match.id,
      createdAtClient: existingTokens?.[female.id]?.createdAtClient || nowClient,
      requestSentAtClient: nowClient,
    },
  };

  const previousResults = match.feedbackRequestSms?.results || {};
  const sendUnlessAlreadySent = async (side, options) => {
    if (String(previousResults?.[side]?.status || "") === "sent") {
      return previousResults[side];
    }
    return sendLmsDirect(options);
  };

  const results = {
    male: await sendUnlessAlreadySent("male", {
      to: getApplicationPhone(male),
      subject: "투윅스 만남 마무리 안내",
      message: buildFeedbackMessage({
        application: male,
        finalMeeting,
        feedbackUrl: getFeedbackUrl(maleToken),
      }),
    }),
    female: await sendUnlessAlreadySent("female", {
      to: getApplicationPhone(female),
      subject: "투윅스 만남 마무리 안내",
      message: buildFeedbackMessage({
        application: female,
        finalMeeting,
        feedbackUrl: getFeedbackUrl(femaleToken),
      }),
    }),
  };

  const batch = db.batch();
  const matchRef = db.collection("twoweeksMatches").doc(match.id);
  const feedbackPrivateRef = db.collection("twoweeksFeedbackPrivate").doc(match.id);

  writeFeedbackAccessLookup(batch, db, {
    token: maleToken,
    matchId: match.id,
    applicationId: male.id,
    counterpartApplicationId: female.id,
    createdAtClient: feedbackTokens[male.id]?.createdAtClient || nowClient,
  });
  writeFeedbackAccessLookup(batch, db, {
    token: femaleToken,
    matchId: match.id,
    applicationId: female.id,
    counterpartApplicationId: male.id,
    createdAtClient: feedbackTokens[female.id]?.createdAtClient || nowClient,
  });

  batch.set(
    feedbackPrivateRef,
    {
      matchId: match.id,
      participantApplicationIds: [male.id, female.id],
      feedbackTokens,
      feedbacks: privateFeedback.feedbacks || {},
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAtClient: nowClient,
    },
    { merge: true }
  );

  batch.set(
    matchRef,
    {
      status: "completed",
      meetingStatus: "feedback_requested",
      meetingLifecycleStatus: "feedback_requested",
      feedbackTokens: admin.firestore.FieldValue.delete(),
      feedbackStatus: match.feedbackStatus || "waiting",
      feedbackRequestSms: {
        results,
        sentAtClient: nowClient,
      },
      postMeeting: {
        estimatedEndAtClient,
        feedbackDueAtClient,
        feedbackDeadlineAtClient,
        feedbackRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
        feedbackRequestedAtClient: nowClient,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  [male, female].forEach((application) => {
    batch.set(
      db.collection("twoweeksApplications").doc(application.id),
      {
        matchingStatus: "completed",
        meetingStatus: "feedback_requested",
        lastCompletedMatchId: match.id,
        lastCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastCompletedAtClient: nowClient,
        "schedule.status": "completed",
        "schedule.feedbackStatus": "waiting",
        "schedule.feedbackRequestedAt": admin.firestore.FieldValue.serverTimestamp(),
        "schedule.feedbackRequestedAtClient": nowClient,
        "schedule.feedbackDeadlineAtClient": feedbackDeadlineAtClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();

  const failedDeliveries = Object.entries(results).filter(([, result]) => String(result?.status || "") !== "sent");
  if (failedDeliveries.length) {
    const adminResult = await sendTwoWeeksAdminSms({
      subject: "투윅스 피드백 안내 확인 필요",
      message: [
        "[투윅스] 만남 종료 후 피드백 안내 발송 확인 필요",
        `대상: ${getApplicationName(male)} ↔ ${getApplicationName(female)}`,
        `발송 실패/누락: ${failedDeliveries.map(([side, result]) => `${side}:${result?.reason || result?.status || "unknown"}`).join(" / ")}`,
        "고객 신청현황에서는 피드백 버튼을 사용할 수 있습니다.",
        "필요 시 관리자 화면에서 고객 상태를 확인해주세요.",
        `매칭ID: ${match.id}`,
      ].join("\n"),
    });

    await matchRef.set(
      {
        adminFeedbackDeliveryNotification: {
          ...adminResult,
          failedSides: failedDeliveries.map(([side]) => side),
          createdAtClient: new Date().toISOString(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return {
    results,
    attemptCount: Number(match.feedbackRequestSms?.attemptCount || 0) + 1,
    attemptedAtClient: nowClient,
    sentAtClient: nowClient,
    estimatedEndAtClient,
    feedbackDueAtClient,
    feedbackDeadlineAtClient,
  };
}

async function markPastMeetingWithoutFeedbackRequest({ match }) {
  const db = admin.firestore();
  const nowClient = new Date().toISOString();
  const finalMeeting = getFinalMeeting(match);
  const meetingMs = getMeetingStartMs(finalMeeting);
  const estimatedEndAtClient = meetingMs ? new Date(meetingMs + MEETING_DURATION_MS).toISOString() : "";
  const feedbackDueAtClient = meetingMs ? new Date(meetingMs + FEEDBACK_REQUEST_AFTER_START_MS).toISOString() : "";

  const batch = db.batch();
  const matchRef = db.collection("twoweeksMatches").doc(match.id);

  batch.set(
    matchRef,
    {
      status: "completed",
      meetingStatus: "feedback_requested",
      meetingLifecycleStatus: "feedback_requested",
      feedbackStatus: match.feedbackStatus || "waiting",
      postMeeting: {
        estimatedEndAtClient,
        feedbackDueAtClient,
        feedbackMarkedAt: admin.firestore.FieldValue.serverTimestamp(),
        feedbackMarkedAtClient: nowClient,
        note: "Marked completed because feedback request had already been handled.",
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  [match.maleApplicationId, match.femaleApplicationId].filter(Boolean).forEach((applicationId) => {
    batch.set(
      db.collection("twoweeksApplications").doc(applicationId),
      {
        matchingStatus: "completed",
        meetingStatus: "feedback_requested",
        lastCompletedMatchId: match.id,
        lastCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastCompletedAtClient: nowClient,
        "schedule.status": "completed",
        "schedule.feedbackStatus": match.feedbackStatus || "waiting",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();

  return {
    status: "marked_completed",
    matchId: match.id,
    markedAtClient: nowClient,
  };
}

async function sendLmsDirect({ to, message, subject = "투윅스 안내" }) {
  const phone = onlyDigits(to);

  if (!phone) {
    return {
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");

  if (!serviceId || !accessKey || !secretKey || !from) {
    return {
      status: "failed",
      reason: "MISSING_NCP_ENV",
    };
  }

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

  // NCP SENS는 이모지 같은 4바이트 문자가 포함된 LMS를 거절할 수 있습니다.
  const cleanMessage = String(message || "").replace(/[\u{10000}-\u{10FFFF}]/gu, "");
  const body = {
    type: "LMS",
    contentType: "COMM",
    countryCode: "82",
    from,
    subject: String(subject || "투윅스 안내").slice(0, 40),
    content: cleanMessage,
    messages: [{ to: phone }],
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-ncp-iam-access-key": accessKey,
        "x-ncp-apigw-timestamp": timestamp,
        "x-ncp-apigw-signature-v2": signature,
      },
    });

    return {
      status: "sent",
      phoneLast4: phone.slice(-4),
      providerRequestId: String(response?.data?.requestId || ""),
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("[TwoWeeksReminder] LMS failed", error.response?.data || error.message);

    const responseError = error.response?.data;
    const reason =
      responseError?.error?.message ||
      responseError?.message ||
      responseError?.statusName ||
      error.code ||
      "NCP_SEND_FAILED";

    return {
      status: "failed",
      reason: String(reason),
      phone,
      errorMessage: responseError || error.message,
      failedAtClient: new Date().toISOString(),
    };
  }
}

async function claimScheduledNotification({ db, matchId, event }) {
  const lockRef = db
    .collection("twoweeksNotificationLocks")
    .doc(`${event}_${matchId}`);
  const nowClient = new Date().toISOString();
  const retryBefore = Date.now() - NOTIFICATION_LOCK_STALE_MS;

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(lockRef);
    const current = snap.exists ? snap.data() || {} : {};
    const currentAttemptCount = Number(current.attemptCount || 0);

    if (current.status === "sent") {
      return {
        shouldRun: false,
        status: "already_sent",
        lockRef,
        attemptCount: currentAttemptCount,
        previousResults: current.results || {},
        completedAtClient: current.completedAtClient || current.updatedAtClient || "",
      };
    }

    const attemptMs = Date.parse(current.attemptAtClient || "");
    if (
      current.status === "sending" &&
      Number.isFinite(attemptMs) &&
      attemptMs > retryBefore
    ) {
      return {
        shouldRun: false,
        status: "sending",
        lockRef,
        attemptCount: currentAttemptCount,
        previousResults: current.results || {},
      };
    }

    if (currentAttemptCount >= MAX_NOTIFICATION_ATTEMPTS) {
      return {
        shouldRun: false,
        status: "exhausted",
        lockRef,
        attemptCount: currentAttemptCount,
        previousResults: current.results || {},
      };
    }

    const attemptCount = currentAttemptCount + 1;
    transaction.set(
      lockRef,
      {
        matchId,
        event,
        status: "sending",
        attemptCount,
        attemptAt: admin.firestore.FieldValue.serverTimestamp(),
        attemptAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtClient: nowClient,
      },
      { merge: true }
    );

    return {
      shouldRun: true,
      status: "claimed",
      lockRef,
      attemptCount,
      previousResults: current.results || {},
    };
  });
}

async function completeScheduledNotification({ claim, results, sent }) {
  if (!claim?.lockRef) return;
  const nowClient = new Date().toISOString();
  await claim.lockRef.set(
    {
      status: sent ? "sent" : "partial",
      results: results || {},
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAtClient: nowClient,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAtClient: nowClient,
    },
    { merge: true }
  );
}

function isPairDeliveryComplete(results = {}) {
  return (
    String(results?.male?.status || "") === "sent" &&
    String(results?.female?.status || "") === "sent"
  );
}

async function sendReminderToPair({ match, type, previousResults = {} }) {
  const db = admin.firestore();
  const finalMeeting = getFinalMeeting(match);
  const maleSnap = await db.collection("twoweeksApplications").doc(match.maleApplicationId).get();
  const femaleSnap = await db.collection("twoweeksApplications").doc(match.femaleApplicationId).get();

  if (!maleSnap.exists || !femaleSnap.exists) {
    return {
      status: "skipped",
      reason: "APPLICATION_NOT_FOUND",
    };
  }

  const male = { id: maleSnap.id, ...maleSnap.data() };
  const female = { id: femaleSnap.id, ...femaleSnap.data() };
  const notes = match.preMeetingNotes || {};
  const subject =
    type === "dayBefore"
      ? "투윅스 내일 만남 안내"
      : type === "meetingStart"
      ? "투윅스 곧 만남 시작"
      : "투윅스 만남 2시간 전 안내";

  const results = {
    male:
      String(previousResults?.male?.status || "") === "sent"
        ? previousResults.male
        : await sendLmsDirect({
            to: getApplicationPhone(male),
            subject,
            message: buildReminderMessage({
              application: male,
              finalMeeting,
              type,
              counterpartNote: notes?.[female.id]?.note || "",
            }),
          }),
    female:
      String(previousResults?.female?.status || "") === "sent"
        ? previousResults.female
        : await sendLmsDirect({
            to: getApplicationPhone(female),
            subject,
            message: buildReminderMessage({
              application: female,
              finalMeeting,
              type,
              counterpartNote: notes?.[male.id]?.note || "",
            }),
          }),
  };

  return results;
}

async function runPairReminderJob({ db, match, type, reminderKey }) {
  const claim = await claimScheduledNotification({
    db,
    matchId: match.id,
    event: `meetingReminder_${type}`,
  });
  const matchRef = db.collection("twoweeksMatches").doc(match.id);

  if (!claim.shouldRun) {
    // 문자 발송 직후 프로세스가 종료되어 매칭 문서의 표시만 빠진 경우를 복구합니다.
    if (claim.status === "already_sent") {
      const sentAtClient = claim.completedAtClient || new Date().toISOString();
      await matchRef.set(
        {
          reminders: {
            [`${reminderKey}SentAt`]: admin.firestore.FieldValue.serverTimestamp(),
            [`${reminderKey}SentAtClient`]: sentAtClient,
            [`${reminderKey}Result`]: claim.previousResults || {},
            [`${reminderKey}AttemptCount`]: claim.attemptCount || 1,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return {
      status: claim.status,
      attemptCount: claim.attemptCount || 0,
    };
  }

  let results = claim.previousResults || {};
  let sent = false;

  try {
    results = await sendReminderToPair({
      match,
      type,
      previousResults: claim.previousResults || {},
    });
    sent = isPairDeliveryComplete(results);
    await completeScheduledNotification({ claim, results, sent });
  } catch (error) {
    results = {
      ...(claim.previousResults || {}),
      status: "failed",
      reason: error?.code || "REMINDER_SEND_FAILED",
      errorMessage: String(error?.message || error),
      failedAtClient: new Date().toISOString(),
    };
    await completeScheduledNotification({ claim, results, sent: false });
    logger.error("[TwoWeeksReminder] pair reminder failed", {
      matchId: match.id,
      type,
      error: error?.message || String(error),
    });
  }

  const nowClient = new Date().toISOString();
  await matchRef.set(
    {
      reminders: {
        [`${reminderKey}Result`]: results,
        [`${reminderKey}AttemptCount`]: claim.attemptCount,
        [`${reminderKey}LastAttemptAt`]: admin.firestore.FieldValue.serverTimestamp(),
        [`${reminderKey}LastAttemptAtClient`]: nowClient,
        ...(sent
          ? {
              [`${reminderKey}SentAt`]: admin.firestore.FieldValue.serverTimestamp(),
              [`${reminderKey}SentAtClient`]: nowClient,
            }
          : {}),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    status: sent ? "sent" : "partial",
    attemptCount: claim.attemptCount,
    results,
  };
}

async function runFeedbackRequestJob({ db, match }) {
  const claim = await claimScheduledNotification({
    db,
    matchId: match.id,
    event: "meetingFeedbackRequest",
  });

  if (!claim.shouldRun) {
    return {
      status: claim.status,
      attemptCount: claim.attemptCount || 0,
    };
  }

  const matchRef = db.collection("twoweeksMatches").doc(match.id);

  try {
    const result = await sendFeedbackRequestToPair({ match });
    const results = result?.results || {};
    const sent = isPairDeliveryComplete(results);

    await completeScheduledNotification({ claim, results, sent });

    const nowClient = new Date().toISOString();
    await matchRef.set(
      {
        feedbackRequestSms: {
          ...result,
          attemptCount: claim.attemptCount,
        },
        reminders: {
          feedbackRequestResult: results,
          feedbackRequestAttemptCount: claim.attemptCount,
          feedbackRequestLastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
          feedbackRequestLastAttemptAtClient: nowClient,
          ...(sent
            ? {
                feedbackRequestSentAt: admin.firestore.FieldValue.serverTimestamp(),
                feedbackRequestSentAtClient: nowClient,
              }
            : {}),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      status: sent ? "sent" : "partial",
      attemptCount: claim.attemptCount,
      results,
    };
  } catch (error) {
    const results = {
      ...(claim.previousResults || {}),
      status: "failed",
      reason: error?.code || "FEEDBACK_REQUEST_FAILED",
      errorMessage: String(error?.message || error),
      failedAtClient: new Date().toISOString(),
    };
    await completeScheduledNotification({ claim, results, sent: false });
    await matchRef.set(
      {
        feedbackRequestSms: {
          results,
          attemptCount: claim.attemptCount,
          attemptedAtClient: new Date().toISOString(),
        },
        reminders: {
          feedbackRequestResult: results,
          feedbackRequestAttemptCount: claim.attemptCount,
          feedbackRequestLastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
          feedbackRequestLastAttemptAtClient: new Date().toISOString(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    logger.error("[TwoWeeksReminder] feedback request failed", {
      matchId: match.id,
      error: error?.message || String(error),
    });

    return {
      status: "failed",
      attemptCount: claim.attemptCount,
      results,
    };
  }
}


const ensureTwoWeeksFeedbackAccess = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

    const data = request.data || {};
    const viewerApplicationId = String(data.viewerApplicationId || "").trim();
    const matchId = String(data.matchId || "").trim();
    if (!viewerApplicationId || !matchId) {
      throw new HttpsError("invalid-argument", "피드백 확인 정보가 필요합니다.");
    }

    await assertApplicationOwner(request, viewerApplicationId, { allowAdmin: false });

    const db = admin.firestore();
    const [viewerSnap, matchSnap] = await Promise.all([
      db.collection("twoweeksApplications").doc(viewerApplicationId).get(),
      db.collection("twoweeksMatches").doc(matchId).get(),
    ]);

    if (!viewerSnap.exists || !matchSnap.exists) {
      throw new HttpsError("not-found", "만남 정보를 찾을 수 없습니다.");
    }

    const viewer = { id: viewerSnap.id, ...viewerSnap.data() };
    const match = { id: matchSnap.id, ...matchSnap.data() };

    const participantIds = [match.maleApplicationId, match.femaleApplicationId].filter(Boolean);
    if (participantIds.length !== 2 || !participantIds.includes(viewerApplicationId)) {
      throw new HttpsError("permission-denied", "해당 만남의 참여자가 아닙니다.");
    }

    const finalMeeting = getFinalMeeting(match);
    const meetingMs = getMeetingStartMs(finalMeeting);
    const feedbackDueMs = getPostMeetingFeedbackMs(finalMeeting);

    if (!meetingMs || !feedbackDueMs) {
      throw new HttpsError("failed-precondition", "확정된 만남 시간을 확인할 수 없습니다.");
    }

    if (Date.now() < feedbackDueMs) {
      throw new HttpsError("failed-precondition", "피드백은 안내된 60분 만남이 지난 뒤 작성할 수 있습니다.");
    }

    const nowClient = new Date().toISOString();
    const privateFeedback = await getTwoWeeksFeedbackPrivateData(db, matchId, match);
    const existingTokens = privateFeedback.feedbackTokens || {};
    const feedbackTokens = {};

    participantIds.forEach((applicationId) => {
      const current = existingTokens?.[applicationId] || {};
      feedbackTokens[applicationId] = {
        ...current,
        token: current.token || makeToken(),
        applicationId,
        counterpartApplicationId: participantIds.find((id) => id !== applicationId) || "",
        matchId,
        createdAtClient: current.createdAtClient || nowClient,
      };
    });

    const batch = db.batch();
    participantIds.forEach((applicationId) => {
      const entry = feedbackTokens[applicationId] || {};
      writeFeedbackAccessLookup(batch, db, {
        token: entry.token,
        matchId,
        applicationId,
        counterpartApplicationId: entry.counterpartApplicationId || "",
        createdAtClient: entry.createdAtClient || nowClient,
      });
    });

    const estimatedEndAtClient = new Date(meetingMs + MEETING_DURATION_MS).toISOString();
    const feedbackDueAtClient = new Date(feedbackDueMs).toISOString();
    const feedbackRequestedAtClient = match.postMeeting?.feedbackRequestedAtClient || nowClient;
    const feedbackDeadlineAtClient =
      match.postMeeting?.feedbackDeadlineAtClient ||
      new Date(Date.parse(feedbackRequestedAtClient) + FEEDBACK_SUBMISSION_WINDOW_MS).toISOString();

    batch.set(
      db.collection("twoweeksFeedbackPrivate").doc(matchId),
      {
        matchId,
        participantApplicationIds: participantIds,
        feedbackTokens,
        feedbacks: privateFeedback.feedbacks || {},
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtClient: nowClient,
      },
      { merge: true }
    );

    batch.set(
      matchSnap.ref,
      {
        status: "completed",
        meetingStatus: "feedback_requested",
        meetingLifecycleStatus: "feedback_requested",
        feedbackTokens: admin.firestore.FieldValue.delete(),
        feedbackStatus: match.feedbackStatus || "waiting",
        postMeeting: {
          ...(match.postMeeting || {}),
          estimatedEndAtClient,
          feedbackDueAtClient,
          feedbackRequestedAt:
            match.postMeeting?.feedbackRequestedAt || admin.firestore.FieldValue.serverTimestamp(),
          feedbackRequestedAtClient,
          feedbackDeadlineAtClient,
          dashboardFallbackOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
          dashboardFallbackOpenedAtClient: nowClient,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    participantIds.forEach((applicationId) => {
      batch.set(
        db.collection("twoweeksApplications").doc(applicationId),
        {
          matchingStatus: "completed",
          meetingStatus: "feedback_requested",
          lastCompletedMatchId: matchId,
          "schedule.status": "completed",
          "schedule.feedbackStatus": match.feedbackStatus || "waiting",
          "schedule.feedbackRequestedAtClient": feedbackRequestedAtClient,
          "schedule.feedbackDeadlineAtClient": feedbackDeadlineAtClient,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();

    const viewerToken = feedbackTokens?.[viewerApplicationId]?.token || "";
    if (!viewerToken) {
      throw new HttpsError("internal", "피드백 링크를 만들지 못했습니다.");
    }

    return {
      ok: true,
      // 브라우저에서는 상대경로를 우선 사용해 localhost/preview origin을 유지한다.
      feedbackPath: getFeedbackPath(viewerToken),
      // SMS/외부 공유처럼 절대주소가 필요한 경우에만 운영 origin을 사용한다.
      feedbackUrl: getFeedbackUrl(viewerToken),
      feedbackDueAtClient,
      feedbackDeadlineAtClient,
      status: "ready",
    };
  }
);

const resolveTwoWeeksFeedbackAccess = onCall(
  { region: REGION },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "피드백 링크 확인을 위해 인증이 필요합니다.");
    }

    const token = String(request.data?.token || "").trim();
    if (token.length < 20 || token.length > 200) {
      throw new HttpsError("invalid-argument", "피드백 링크가 올바르지 않습니다.");
    }

    const db = admin.firestore();
    const tokenHash = hashFeedbackToken(token);
    const accessRef = db.collection("twoweeksFeedbackAccess").doc(tokenHash);
    let accessSnap = await accessRef.get();
    let access = accessSnap.exists ? accessSnap.data() : null;

    // 배포 이전에 이미 발급된 링크를 살리기 위한 1회성 호환 탐색.
    // 찾으면 lookup 컬렉션으로 즉시 이관되어 이후에는 단건 조회만 사용한다.
    if (!access?.matchId || !access?.applicationId) {
      const legacySnap = await db
        .collection("twoweeksMatches")
        .where("status", "in", ["confirmed", "completed"])
        .limit(200)
        .get();

      for (const docSnap of legacySnap.docs) {
        const match = { id: docSnap.id, ...docSnap.data() };
        const privateData = await getTwoWeeksFeedbackPrivateData(db, match.id, match);
        const tokens = privateData.feedbackTokens || {};
        const found = Object.entries(tokens).find(([, entry]) =>
          secureTokenEquals(String(entry?.token || ""), token)
        );

        if (!found) continue;
        const [applicationId, entry] = found;
        access = {
          tokenHash,
          matchId: match.id,
          applicationId,
          counterpartApplicationId:
            entry?.counterpartApplicationId ||
            [match.maleApplicationId, match.femaleApplicationId].find((id) => id && id !== applicationId) ||
            "",
          status: "active",
          createdAtClient: entry?.createdAtClient || new Date().toISOString(),
        };
        await accessRef.set(
          {
            ...access,
            migratedFromLegacyUrl: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAtClient: new Date().toISOString(),
          },
          { merge: true }
        );
        break;
      }
    }

    if (!access?.matchId || !access?.applicationId) {
      throw new HttpsError("not-found", "만료되었거나 올바르지 않은 피드백 링크입니다.");
    }

    await assertApplicationOwner(request, access.applicationId, { allowAdmin: false });

    const [matchSnap, applicationSnap, privateSnap] = await Promise.all([
      db.collection("twoweeksMatches").doc(access.matchId).get(),
      db.collection("twoweeksApplications").doc(access.applicationId).get(),
      db.collection("twoweeksFeedbackPrivate").doc(access.matchId).get(),
    ]);
    if (!matchSnap.exists) {
      throw new HttpsError("not-found", "피드백 대상 만남을 찾지 못했습니다.");
    }

    const match = matchSnap.data() || {};
    const privateData = privateSnap.exists ? privateSnap.data() || {} : {};
    const application = applicationSnap.exists
      ? { id: applicationSnap.id, ...applicationSnap.data() }
      : { id: access.applicationId };
    const tokenEntry = privateData.feedbackTokens?.[access.applicationId] || match.feedbackTokens?.[access.applicationId] || {};
    if (!secureTokenEquals(String(tokenEntry.token || ""), token)) {
      throw new HttpsError("permission-denied", "만료되었거나 올바르지 않은 피드백 링크입니다.");
    }

    // 피드백 링크 자체를 서버에서 검증했으므로 별도 커스텀 토큰을 발급하지 않습니다.
    // 화면에는 해당 신청자의 피드백과 일정 등 필요한 최소 정보만 전달합니다.
    const feedbackView = {
      id: access.matchId,
      maleApplicationId: match.maleApplicationId || "",
      femaleApplicationId: match.femaleApplicationId || "",
      finalMeeting: match.finalMeeting || null,
      schedule: match.finalMeeting ? null : { finalMeeting: match.schedule?.finalMeeting || null },
      postMeeting: {
        feedbackRequestedAtClient: match.postMeeting?.feedbackRequestedAtClient || "",
        feedbackDueAtClient: match.postMeeting?.feedbackDueAtClient || "",
        feedbackDeadlineAtClient: match.postMeeting?.feedbackDeadlineAtClient || "",
      },
      feedbackRequestSms: {
        sentAtClient: match.feedbackRequestSms?.sentAtClient || "",
      },
      feedbackTokens: {
        [access.applicationId]: {
          token,
          applicationId: access.applicationId,
          counterpartApplicationId:
            access.counterpartApplicationId || tokenEntry.counterpartApplicationId || "",
          requestSentAtClient: tokenEntry.requestSentAtClient || "",
        },
      },
      feedbacks: (privateData.feedbacks || match.feedbacks || {})?.[access.applicationId]
        ? { [access.applicationId]: (privateData.feedbacks || match.feedbacks || {})[access.applicationId] }
        : {},
    };

    return {
      ok: true,
      matchId: access.matchId,
      applicationId: access.applicationId,
      counterpartApplicationId:
        access.counterpartApplicationId || tokenEntry.counterpartApplicationId || "",
      feedbackView,
      dashboardPath: getDashboardPath(application),
      feedbackDeadlineAtClient:
        match.postMeeting?.feedbackDeadlineAtClient ||
        (match.postMeeting?.feedbackRequestedAtClient
          ? new Date(Date.parse(match.postMeeting.feedbackRequestedAtClient) + FEEDBACK_SUBMISSION_WINDOW_MS).toISOString()
          : ""),
    };
  }
);

exports.resolveTwoWeeksFeedbackAccess = resolveTwoWeeksFeedbackAccess;
exports.ensureTwoWeeksFeedbackAccess = ensureTwoWeeksFeedbackAccess;

exports.sendTwoWeeksMeetingReminders = onSchedule(
  {
    region: REGION,
    schedule: "every 5 minutes",
    timeZone: "Asia/Seoul",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    const db = admin.firestore();
    const nowMs = Date.now();
    const nowKstKey = toKstDateKey(nowMs);
    const nowKstHour = getKstHour(nowMs);

    const snap = await db
      .collection("twoweeksMatches")
      .where("status", "in", ["confirmed", "completed"])
      .limit(200)
      .get();

    const jobs = [];

    snap.forEach((doc) => {
      const match = { id: doc.id, ...doc.data() };
      const finalMeeting = getFinalMeeting(match);
      const meetingMs = getMeetingStartMs(finalMeeting);
      if (!meetingMs) return;

      const meetingKstKey = toKstDateKey(meetingMs);
      const dayBeforeKstKey = toKstDateKey(meetingMs - 24 * 60 * 60 * 1000);
      const reminders = match.reminders || {};

      // 일정이 확정되면 참석확인 여부와 무관하게 리마인드를 보낸다.
      const shouldSendDayBefore =
        !reminders.dayBeforeSentAtClient &&
        Number(reminders.dayBeforeAttemptCount || 0) < MAX_NOTIFICATION_ATTEMPTS &&
        nowKstKey === dayBeforeKstKey &&
        nowKstHour >= 19;

      const shouldSendTwoHoursBefore =
        !reminders.twoHoursBeforeSentAtClient &&
        Number(reminders.twoHoursBeforeAttemptCount || 0) < MAX_NOTIFICATION_ATTEMPTS &&
        nowKstKey === meetingKstKey &&
        nowMs >= meetingMs - 2 * 60 * 60 * 1000 &&
        nowMs < meetingMs;

      // 약속 5분 전부터 약속 시작 10분 후까지 한 번만 현장 도착 안내를 발송합니다.
      // 5분 주기 스케줄러가 한 번 지연되더라도 안내가 빠지지 않도록 짧은 유예 구간을 둡니다.
      const shouldSendMeetingStart =
        !reminders.meetingStartSentAtClient &&
        Number(reminders.meetingStartAttemptCount || 0) < MAX_NOTIFICATION_ATTEMPTS &&
        nowKstKey === meetingKstKey &&
        nowMs >= meetingMs - MEETING_START_REMINDER_BEFORE_MS &&
        nowMs <= meetingMs + MEETING_START_REMINDER_GRACE_MS;

      // 기본 만남 60분 종료 시점에 마무리 안내와 피드백 요청을 함께 발송
      // 피드백 요청은 참석확인 여부와 무관하게 발송합니다.
      // 그래야 한쪽이 참석확인을 누르지 않았거나 실제 노쇼였던 경우도 피드백/신고를 받을 수 있습니다.
      const feedbackDueMs = getPostMeetingFeedbackMs(finalMeeting);
      const feedbackAlreadyHandled = isFeedbackRequestAlreadyHandled(match);
      const shouldSendFeedbackRequest =
        !feedbackAlreadyHandled &&
        feedbackDueMs &&
        nowMs >= feedbackDueMs &&
        nowMs <= feedbackDueMs + FEEDBACK_REPAIR_WINDOW_MS;

      const shouldMarkPastMeetingCompleted =
        feedbackAlreadyHandled &&
        nowMs >= feedbackDueMs &&
        match.meetingLifecycleStatus !== "feedback_requested" &&
        match.meetingStatus !== "feedback_requested";

      if (shouldSendDayBefore) {
        jobs.push(runPairReminderJob({ db, match, type: "dayBefore", reminderKey: "dayBefore" }));
      }

      if (shouldSendTwoHoursBefore) {
        jobs.push(
          runPairReminderJob({
            db,
            match,
            type: "twoHoursBefore",
            reminderKey: "twoHoursBefore",
          })
        );
      }

      if (shouldSendMeetingStart) {
        jobs.push(
          runPairReminderJob({
            db,
            match,
            type: "meetingStart",
            reminderKey: "meetingStart",
          })
        );
      }

      if (shouldSendFeedbackRequest) {
        jobs.push(runFeedbackRequestJob({ db, match }));
      } else if (shouldMarkPastMeetingCompleted) {
        jobs.push(markPastMeetingWithoutFeedbackRequest({ match }));
      }
    });

    await Promise.allSettled(jobs);

    logger.info("[TwoWeeksReminder] finished", {
      checked: snap.size,
      jobs: jobs.length,
      nowKstKey,
      nowKstHour,
    });
  }
);
