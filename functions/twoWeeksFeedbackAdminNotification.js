const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { sendTwoWeeksAdminSms } = require("./twoWeeksAdminSms");
const { getTwoWeeksFeedbacks } = require("./twoWeeksFeedbackPrivateStore");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";
const NOTIFICATION_LOCK_STALE_MS = 2 * 60 * 1000;
const MAX_NOTIFICATION_ATTEMPTS = 3;

const DISCOMFORT_LABELS = {
  rude_behavior: "무례한 언행",
  profile_mismatch: "프로필 정보 차이",
  excessive_alcohol_smoking: "과도한 음주·흡연",
  safety_concern: "안전상 불편",
  other: "기타",
};

function getParticipantIds(match = {}) {
  return [match.maleApplicationId, match.femaleApplicationId].filter(Boolean);
}

function getContinueIntent(feedback = {}) {
  return String(feedback?.continueMeetingIntent || feedback?.meetAgainIntent || "");
}

function hasContactConsent(feedback = {}) {
  if (feedback?.meetingResult !== "met") return false;
  const intent = getContinueIntent(feedback);
  if (typeof feedback?.contactShareConsent === "boolean") return intent === "yes" && feedback.contactShareConsent;
  return intent === "yes";
}

function getName(application = {}) {
  return String(application?.basic?.name || application?.basic?.nickname || application?.id || "신청자").trim();
}

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getPhone(application = {}) {
  return onlyDigits(
    application?.basic?.phoneNormalized ||
      application?.basic?.phone ||
      application?.phoneIdentityVerification?.phone ||
      application?.phone ||
      ""
  );
}

function getSiteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVICE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://charmingsoup.com"
  ).replace(/\/$/, "");
}

function getDashboardUrl(application = {}) {
  const storedUrl = String(application?.dashboardAccess?.url || "").trim();
  if (storedUrl) return storedUrl;
  const storedPath = String(application?.dashboardAccess?.path || "").trim();
  if (storedPath.startsWith("/")) return `${getSiteOrigin()}${storedPath}`;
  const applicationId = String(application?.id || "").trim();
  const token = String(
    application?.dashboardAccess?.token ||
      application?.access?.dashboardToken ||
      application?.dashboardToken ||
      application?.accessToken ||
      ""
  ).trim();
  const query = new URLSearchParams();
  if (applicationId) query.set("aid", applicationId);
  if (token) query.set("token", token);
  const suffix = query.toString();
  return `${getSiteOrigin()}/2weeks/proposal/dashboard${suffix ? `?${suffix}` : ""}`;
}

async function sendCustomerLms({ application, message, subject = "투윅스 매칭 결과" }) {
  const phone = getPhone(application);
  if (!phone) return { status: "skipped", reason: "NO_PHONE" };
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");
  if (!serviceId || !accessKey || !secretKey || !from) {
    return { status: "failed", reason: "MISSING_NCP_ENV" };
  }
  const method = "POST";
  const urlPath = `/sms/v2/services/${serviceId}/messages`;
  const timestamp = Date.now().toString();
  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(`${method} ${urlPath}\n${timestamp}\n${accessKey}`);
  const signature = hmac.finalize().toString(CryptoJS.enc.Base64);
  const cleanMessage = String(message || "").replace(/[\u{10000}-\u{10FFFF}]/gu, "");
  try {
    const response = await axios.post(
      `https://sens.apigw.ntruss.com${urlPath}`,
      {
        type: "LMS",
        contentType: "COMM",
        countryCode: "82",
        from,
        subject: String(subject || "투윅스 매칭 결과").slice(0, 40),
        content: cleanMessage,
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
    logger.error("[TwoWeeksFeedbackResult] customer LMS failed", error?.response?.data || error?.message || error);
    return {
      status: "failed",
      failedAtClient: new Date().toISOString(),
      errorMessage: error?.response?.data || error?.message || String(error),
    };
  }
}

function getDiscomfortReasons(feedback = {}) {
  return Array.isArray(feedback?.discomfortReasons) ? feedback.discomfortReasons.filter(Boolean) : [];
}

function formatDiscomfort(feedback = {}) {
  const reasons = getDiscomfortReasons(feedback);
  if (!reasons.length) return "없음";
  const labels = reasons.map((value) => DISCOMFORT_LABELS[value] || value);
  if (feedback.discomfortOtherText) labels.push(`기타의견: ${String(feedback.discomfortOtherText).slice(0, 100)}`);
  return labels.join(", ");
}

function isHighAttentionDiscomfort(feedback = {}) {
  if (feedback?.meetingResult !== "met" || feedback?.meetingMood !== "uncomfortable") return false;
  const reasons = new Set(getDiscomfortReasons(feedback));
  return reasons.has("safety_concern") || reasons.has("profile_mismatch");
}

async function loadApplications(db, participantIds = []) {
  const snaps = await Promise.all(participantIds.map((id) => db.collection("twoweeksApplications").doc(id).get()));
  return Object.fromEntries(
    snaps.filter((snap) => snap.exists).map((snap) => [snap.id, { id: snap.id, ...snap.data() }])
  );
}

function isFreshSendingLock(current = {}) {
  if (String(current?.status || "") !== "sending") return false;
  const startedMs = Date.parse(String(current?.startedAtClient || ""));
  return Number.isFinite(startedMs) && Date.now() - startedMs < NOTIFICATION_LOCK_STALE_MS;
}

async function claimNotification(matchRef, fieldPath, applicationId = "") {
  const db = admin.firestore();
  let claimed = false;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(matchRef);
    if (!snap.exists) return;
    const match = snap.data() || {};
    const current = applicationId
      ? match?.[fieldPath]?.[applicationId]
      : match?.[fieldPath];
    const currentAttemptCount = Number(current?.attemptCount || 0);

    if (
      String(current?.status || "") === "sent" ||
      isFreshSendingLock(current) ||
      currentAttemptCount >= MAX_NOTIFICATION_ATTEMPTS
    ) {
      return;
    }

    const attemptCount = currentAttemptCount + 1;

    if (applicationId) {
      tx.set(
        matchRef,
        {
          [fieldPath]: {
            ...(match?.[fieldPath] || {}),
            [applicationId]: {
              ...(current || {}),
              status: "sending",
              attemptCount,
              startedAt: admin.firestore.FieldValue.serverTimestamp(),
              startedAtClient: new Date().toISOString(),
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      tx.set(
        matchRef,
        {
          [fieldPath]: {
            ...(current || {}),
            status: "sending",
            attemptCount,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            startedAtClient: new Date().toISOString(),
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    claimed = true;
  });

  return claimed;
}

async function saveNotificationResult(matchRef, fieldPath, result, applicationId = "") {
  const payload = {
    ...result,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAtClient: new Date().toISOString(),
  };

  if (applicationId) {
    await matchRef.set(
      {
        [fieldPath]: {
          [applicationId]: payload,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  await matchRef.set(
    {
      [fieldPath]: payload,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function claimCustomerResultNotification(matchRef, applicationId = "") {
  if (!applicationId) return 0;
  const db = admin.firestore();
  let attemptCount = 0;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(matchRef);
    if (!snap.exists) return;
    const current = snap.data()?.customerFeedbackResultNotifications?.[applicationId] || {};
    const currentAttemptCount = Number(current.attemptCount || 0);
    if (
      String(current.status || "") === "sent" ||
      isFreshSendingLock(current) ||
      currentAttemptCount >= MAX_NOTIFICATION_ATTEMPTS
    ) {
      return;
    }
    attemptCount = currentAttemptCount + 1;
    tx.set(
      matchRef,
      {
        customerFeedbackResultNotifications: {
          [applicationId]: {
            ...current,
            status: "sending",
            attemptCount,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            startedAtClient: new Date().toISOString(),
          },
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
  return attemptCount;
}

async function sendCompletedResultToParticipant({ matchRef, application }) {
  const attemptCount = await claimCustomerResultNotification(matchRef, application?.id || "");
  if (!attemptCount) return null;
  const result = await sendCustomerLms({
    application,
    message: [
      "[투윅스] 매칭 결과가 도착했습니다.",
      `${getName(application)}님, 두 분의 피드백 확인이 완료되었습니다.`,
      "신청현황의 결과보기에서 확인해주세요.",
      "",
      getDashboardUrl(application),
    ].join("\n"),
  });
  await matchRef.set(
    {
      customerFeedbackResultNotifications: {
        [application.id]: {
          ...result,
          attemptCount,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAtClient: new Date().toISOString(),
        },
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return result;
}

exports.notifyTwoWeeksFeedbackAdmin = onDocumentUpdated(
  {
    region: REGION,
    document: "twoweeksMatches/{matchId}",
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async (event) => {
    const after = event.data?.after?.data() || {};
    const matchId = event.params.matchId;
    const matchRef = event.data.after.ref;
    const db = admin.firestore();
    const participantIds = getParticipantIds(after);
    if (participantIds.length !== 2) return null;

    const feedbacks = await getTwoWeeksFeedbacks(db, matchId, after);
    const applications = await loadApplications(db, participantIds);

    // 안전상 불편 또는 프로필 정보 차이는 다른 피드백을 기다리지 않고 즉시 운영자가 인지합니다.
    for (const applicationId of participantIds) {
      const feedback = feedbacks[applicationId];
      if (!feedback || !isHighAttentionDiscomfort(feedback)) continue;

      // 문서가 다시 갱신될 때마다 잠금을 확인해 실패·중단된 발송을 최대 3회 복구한다.
      // 이미 성공한 알림은 claimNotification이 즉시 차단하므로 중복 발송되지 않는다.
      const claimed = await claimNotification(matchRef, "adminFeedbackAttentionNotifications", applicationId);
      if (!claimed) continue;

      const reporter = applications[applicationId] || { id: applicationId };
      const counterpartId = participantIds.find((id) => id !== applicationId) || "";
      const counterpart = applications[counterpartId] || { id: counterpartId };
      const sms = await sendTwoWeeksAdminSms({
        subject: "투윅스 중요 피드백",
        message: [
          "[투윅스] 운영 확인이 필요한 불편 피드백",
          `제출자: ${getName(reporter)}`,
          `상대: ${getName(counterpart)}`,
          `사유: ${formatDiscomfort(feedback)}`,
          feedback.memo ? `메모: ${String(feedback.memo).slice(0, 120)}` : "",
          `매칭ID: ${matchId}`,
          "관리자 > 결과관리에서 확인해주세요.",
        ].filter(Boolean).join("\n"),
      });
      await saveNotificationResult(matchRef, "adminFeedbackAttentionNotifications", sms, applicationId);
    }

    // 정상 만남 피드백 2/2가 모두 끝나고 후속 상태까지 자동 처리된 시점에 관리자에게 한 번만 요약합니다.
    const bothSubmitted = participantIds.every((id) => Boolean(feedbacks[id]));
    const bothMet = bothSubmitted && participantIds.every((id) => feedbacks[id]?.meetingResult === "met");
    const lifecycleProcessed = String(after.nextRoundLifecycleStatus || "") === "processed";
    if (!bothMet || !lifecycleProcessed) return null;

    // 두 번째 피드백까지 처리되면 양쪽 고객에게 결과 도착을 즉시 안내합니다.
    await Promise.all(
      participantIds.map((applicationId) =>
        sendCompletedResultToParticipant({
          matchRef,
          application: applications[applicationId] || { id: applicationId },
        })
      )
    );

    const completionClaimed = await claimNotification(matchRef, "adminFeedbackCompletionNotification");
    if (!completionClaimed) return null;

    const mutualContact = participantIds.every((id) => hasContactConsent(feedbacks[id]));
    const names = participantIds.map((id) => getName(applications[id] || { id }));
    const discomfortLines = participantIds
      .filter((id) => feedbacks[id]?.meetingMood === "uncomfortable")
      .map((id) => `${getName(applications[id] || { id })}: ${formatDiscomfort(feedbacks[id])}`);

    const sms = await sendTwoWeeksAdminSms({
      subject: "투윅스 피드백 완료",
      message: [
        "[투윅스] 만남 피드백 2/2 완료",
        `대상: ${names.join(" ↔ ")}`,
        `연락처 공개: ${mutualContact ? "상호 동의 완료" : "미성립"}`,
        `자동 후속: ${mutualContact ? "연락처 공개 + 새 매칭 일시정지" : "양쪽 다음 매칭 대기"}`,
        discomfortLines.length ? `불편 피드백: ${discomfortLines.join(" / ")}` : "불편 피드백: 없음",
        "관리자 조치: 별도 이슈가 없으면 추가 조치 없음",
        `매칭ID: ${matchId}`,
      ].join("\n"),
    });

    await saveNotificationResult(matchRef, "adminFeedbackCompletionNotification", sms);
    return null;
  }
);
