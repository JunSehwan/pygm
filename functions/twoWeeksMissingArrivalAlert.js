const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { sendTwoWeeksAdminSms } = require("./twoWeeksAdminSms");

if (!admin.apps.length) {
  admin.initializeApp();
}

const ALERT_DELAY_MS = 5 * 60 * 1000;
const ALERT_WINDOW_MS = 6 * 60 * 60 * 1000;
const NOTIFICATION_LOCK_STALE_MS = 2 * 60 * 1000;

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getPhone(application = {}) {
  return onlyDigits(
    application?.basic?.phoneNormalized ||
      application?.basic?.phone ||
      application?.phoneIdentityVerification?.phone ||
      application?.phone
  );
}

function appendTab(url = "", tab = "schedule") {
  const fallback = "https://charmingsoup.com/2weeks/proposal/dashboard";
  const raw = String(url || fallback).trim() || fallback;

  try {
    const parsed = new URL(raw, "https://charmingsoup.com");
    parsed.searchParams.set("tab", tab);
    return parsed.toString();
  } catch {
    return `${fallback}?tab=${encodeURIComponent(tab)}`;
  }
}

function getDashboardUrl(application = {}) {
  const base =
    application?.dashboardAccess?.url ||
    (application?.dashboardAccess?.path
      ? `https://charmingsoup.com${application.dashboardAccess.path}`
      : "https://charmingsoup.com/2weeks/proposal/dashboard");

  return appendTab(base, "schedule");
}

function getMeetingStartAtClient(match = {}) {
  const candidates = [
    match?.finalMeeting?.startAtClient,
    match?.finalMeeting?.finalTimeChoice?.startAtClient,
    match?.finalMeeting?.timeChoice?.startAtClient,
    match?.schedule?.finalMeeting?.startAtClient,
    match?.schedule?.finalMeeting?.finalTimeChoice?.startAtClient,
    match?.schedule?.finalTimeChoice?.startAtClient,
    match?.schedule?.finalChoice?.timeChoice?.startAtClient,
    match?.schedule?.selectedChoice?.timeChoice?.startAtClient,
  ];

  return candidates.find(Boolean) || "";
}

function getMeetingStartMs(match = {}) {
  const value = getMeetingStartAtClient(match);
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isFreshSendingLock(lock = {}, nowMs = Date.now()) {
  if (String(lock?.status || "") !== "sending") return false;
  const attemptMs = Date.parse(
    lock?.attemptAtClient || lock?.requestedAtClient || ""
  );
  return (
    Number.isFinite(attemptMs) &&
    attemptMs > nowMs - NOTIFICATION_LOCK_STALE_MS
  );
}

function buildMessage(application = {}) {
  return [
    "[투윅스] 상대방이 기다리고 있습니다",
    "",
    "상대방이 현재 약속 장소에서 기다리고 있습니다.",
    "늦고 계신다면 가능한 빨리 약속 장소로 이동해주세요.",
    "이미 도착하셨다면 신청현황에서 현장사진을 업로드해 도착 확인을 완료해주세요.",
    "참석이 어려운 경우 투윅스에 알려주세요.",
    "",
    "신청현황 확인:",
    getDashboardUrl(application),
  ].join("\n");
}

function buildArrivalConfirmationMessage(application = {}) {
  return [
    "[투윅스] 상대방이 도착했어요",
    "",
    "상대방이 현장사진과 함께 도착 확인을 완료했습니다.",
    "신청현황에서 상대 현장사진과 만남 전 한마디를 확인해 서로를 찾아주세요.",
    "",
    "신청현황 확인:",
    getDashboardUrl(application),
  ].join("\n");
}

async function sendNcpMessage(to, message) {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM);
  const recipient = onlyDigits(to);

  if (!serviceId || !accessKey || !secretKey || !from || !recipient) {
    throw new Error("NCP SMS 환경변수 또는 수신번호가 없습니다.");
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

  const cleanMessage = String(message || "").replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, "");
  const type = Buffer.byteLength(cleanMessage, "utf8") > 90 ? "LMS" : "SMS";

  const response = await axios.post(
    url,
    {
      type,
      countryCode: "82",
      from,
      content: cleanMessage,
      messages: [{ to: recipient }],
      ...(type === "LMS" ? { subject: "투윅스 도착 확인" } : {}),
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

  return response?.data || {};
}

const sendTwoWeeksMissingArrivalAlert = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const matchId = String(request.data?.matchId || "").trim();
    const reporterApplicationId = String(request.data?.reporterApplicationId || "").trim();

    if (!matchId || !reporterApplicationId) {
      throw new HttpsError("invalid-argument", "매칭 정보가 필요합니다.");
    }

    const db = admin.firestore();
    const matchRef = db.collection("twoweeksMatches").doc(matchId);
    const matchSnap = await matchRef.get();

    if (!matchSnap.exists) {
      throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");
    }

    const match = matchSnap.data() || {};
    const maleApplicationId = String(match.maleApplicationId || "");
    const femaleApplicationId = String(match.femaleApplicationId || "");
    const participantIds = [maleApplicationId, femaleApplicationId].filter(Boolean);

    if (participantIds.length !== 2 || !participantIds.includes(reporterApplicationId)) {
      throw new HttpsError("permission-denied", "해당 매칭의 참여자가 아닙니다.");
    }

    await assertApplicationOwner(request, reporterApplicationId);

    const counterpartApplicationId =
      reporterApplicationId === maleApplicationId ? femaleApplicationId : maleApplicationId;

    const reporterArrival = match?.meetingArrival?.[reporterApplicationId];
    const counterpartArrival = match?.meetingArrival?.[counterpartApplicationId];

    if (reporterArrival?.status !== "arrived") {
      throw new HttpsError("failed-precondition", "먼저 현장사진을 업로드해 도착 확인을 완료해주세요.");
    }

    if (counterpartArrival?.status === "arrived") {
      throw new HttpsError("failed-precondition", "상대방도 이미 도착 확인을 완료했습니다.");
    }

    const meetingStartMs = getMeetingStartMs(match);
    if (!meetingStartMs) {
      throw new HttpsError("failed-precondition", "확정된 약속시간을 확인할 수 없습니다.");
    }

    const nowMs = Date.now();
    const availableAtMs = meetingStartMs + ALERT_DELAY_MS;

    if (nowMs < availableAtMs) {
      throw new HttpsError(
        "failed-precondition",
        "아직 상대방에게 도착 확인을 요청할 수 없습니다. 잠시 후 다시 확인해주세요.",
        { availableAtClient: new Date(availableAtMs).toISOString() }
      );
    }

    if (nowMs > meetingStartMs + ALERT_WINDOW_MS) {
      throw new HttpsError("failed-precondition", "도착 확인을 요청할 수 있는 시간이 지났습니다.");
    }

    const startedAtClient = new Date().toISOString();
    const lockResult = await db.runTransaction(async (transaction) => {
      const freshSnap = await transaction.get(matchRef);
      if (!freshSnap.exists) {
        throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");
      }

      const freshMatch = freshSnap.data() || {};
      const freshReporterArrival = freshMatch?.meetingArrival?.[reporterApplicationId];
      const freshCounterpartArrival = freshMatch?.meetingArrival?.[counterpartApplicationId];
      const freshExistingAlert = freshMatch?.missingArrivalAlerts?.[reporterApplicationId];
      const freshMeetingStartMs = getMeetingStartMs(freshMatch);
      const freshNowMs = Date.now();

      if (freshReporterArrival?.status !== "arrived") {
        throw new HttpsError("failed-precondition", "먼저 현장사진을 업로드해 도착 확인을 완료해주세요.");
      }

      if (freshCounterpartArrival?.status === "arrived") {
        throw new HttpsError("failed-precondition", "상대방도 이미 도착 확인을 완료했습니다.");
      }

      if (!freshMeetingStartMs || freshNowMs < freshMeetingStartMs + ALERT_DELAY_MS) {
        throw new HttpsError("failed-precondition", "아직 상대방에게 도착 확인을 요청할 수 없습니다. 잠시 후 다시 확인해주세요.");
      }

      if (freshNowMs > freshMeetingStartMs + ALERT_WINDOW_MS) {
        throw new HttpsError("failed-precondition", "도착 확인을 요청할 수 있는 시간이 지났습니다.");
      }

      if (freshExistingAlert?.status === "sent") {
        return {
          status: "already_sent",
          sent: true,
          sentAtClient: freshExistingAlert.sentAtClient || "",
        };
      }

      if (isFreshSendingLock(freshExistingAlert, freshNowMs)) {
        return { status: "processing", sent: false };
      }

      transaction.set(
        matchRef,
        {
          missingArrivalAlerts: {
            [reporterApplicationId]: {
              status: "sending",
              reporterApplicationId,
              counterpartApplicationId,
              attemptCount: Number(freshExistingAlert?.attemptCount || 0) + 1,
              attemptAt: admin.firestore.FieldValue.serverTimestamp(),
              attemptAtClient: startedAtClient,
              requestedAt: admin.firestore.FieldValue.serverTimestamp(),
              requestedAtClient: startedAtClient,
              meetingStartAtClient: getMeetingStartAtClient(freshMatch),
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { status: "locked", sent: false };
    });

    if (lockResult.status !== "locked") {
      return lockResult;
    }

    const counterpartSnap = await db
      .collection("twoweeksApplications")
      .doc(counterpartApplicationId)
      .get();

    if (!counterpartSnap.exists) {
      await matchRef.set(
        {
          missingArrivalAlerts: {
            [reporterApplicationId]: {
              status: "failed",
              errorMessage: "상대방 신청 정보를 찾을 수 없습니다.",
              failedAtClient: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
      throw new HttpsError("not-found", "상대방 신청 정보를 찾을 수 없습니다.");
    }

    const counterpartApplication = { id: counterpartSnap.id, ...counterpartSnap.data() };
    const counterpartPhone = getPhone(counterpartApplication);

    if (!counterpartPhone) {
      await matchRef.set(
        {
          missingArrivalAlerts: {
            [reporterApplicationId]: {
              status: "failed",
              errorMessage: "상대방 연락처를 확인할 수 없습니다.",
              failedAtClient: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
      throw new HttpsError("failed-precondition", "상대방 연락처를 확인할 수 없습니다.");
    }

    try {
      const providerResult = await sendNcpMessage(
        counterpartPhone,
        buildMessage(counterpartApplication)
      );
      const sentAtClient = new Date().toISOString();

      await matchRef.set(
        {
          missingArrivalAlerts: {
            [reporterApplicationId]: {
              status: "sent",
              reporterApplicationId,
              counterpartApplicationId,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              sentAtClient,
              meetingStartAtClient: getMeetingStartAtClient(match),
              providerRequestId: providerResult?.requestId || "",
              phoneLast4: counterpartPhone.slice(-4),
            },
          },
          missingArrivalAlertStatus: "sent",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const adminSms = await sendTwoWeeksAdminSms({
        subject: "투윅스 상대 미도착 확인",
        message: [
          "[투윅스 운영] 약속시간 +5분 상대 미도착 알림",
          `매칭: ${match.maleName || maleApplicationId} ↔ ${match.femaleName || femaleApplicationId}`,
          `도착 확인 회원: ${reporterApplicationId}`,
          `미도착 회원: ${counterpartApplicationId}`,
          `매칭 ID: ${matchId}`,
          "관리자 페이지에서 도착 상태를 확인해주세요.",
        ].join("\n"),
      });

      await matchRef.set(
        {
          missingArrivalAlerts: {
            [reporterApplicationId]: {
              adminNotification: adminSms,
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { status: "sent", sent: true, sentAtClient };
    } catch (error) {
      console.error(
        "[sendTwoWeeksMissingArrivalAlert] sms failed:",
        error?.response?.data || error?.message || error
      );

      await matchRef.set(
        {
          missingArrivalAlerts: {
            [reporterApplicationId]: {
              status: "failed",
              reporterApplicationId,
              counterpartApplicationId,
              errorMessage: error?.message || String(error),
              failedAtClient: new Date().toISOString(),
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      throw new HttpsError("internal", "문자 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  }
);


const sendTwoWeeksArrivalConfirmation = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const matchId = String(request.data?.matchId || "").trim();
    const reporterApplicationId = String(request.data?.reporterApplicationId || "").trim();

    if (!matchId || !reporterApplicationId) {
      throw new HttpsError("invalid-argument", "매칭 정보가 필요합니다.");
    }

    const db = admin.firestore();
    const matchRef = db.collection("twoweeksMatches").doc(matchId);
    const matchSnap = await matchRef.get();

    if (!matchSnap.exists) {
      throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");
    }

    const match = matchSnap.data() || {};
    const maleApplicationId = String(match.maleApplicationId || "");
    const femaleApplicationId = String(match.femaleApplicationId || "");
    const participantIds = [maleApplicationId, femaleApplicationId].filter(Boolean);

    if (participantIds.length !== 2 || !participantIds.includes(reporterApplicationId)) {
      throw new HttpsError("permission-denied", "해당 매칭의 참여자가 아닙니다.");
    }

    await assertApplicationOwner(request, reporterApplicationId);

    const counterpartApplicationId =
      reporterApplicationId === maleApplicationId ? femaleApplicationId : maleApplicationId;

    const reporterArrival = match?.meetingArrival?.[reporterApplicationId];
    const reporterProof = match?.meetingProofs?.[reporterApplicationId];

    if (reporterArrival?.status !== "arrived" || !reporterProof?.photo?.url) {
      throw new HttpsError(
        "failed-precondition",
        "현장사진 업로드와 도착 확인이 완료된 뒤 상대방에게 안내할 수 있습니다."
      );
    }

    const existingNotification = match?.arrivalNotificationSms?.[reporterApplicationId];
    if (existingNotification?.status === "sent") {
      return {
        status: "already_sent",
        sent: true,
        sentAtClient: existingNotification.sentAtClient || "",
      };
    }

    const lockAtClient = new Date().toISOString();
    const lockResult = await db.runTransaction(async (transaction) => {
      const freshSnap = await transaction.get(matchRef);
      if (!freshSnap.exists) {
        throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");
      }

      const freshMatch = freshSnap.data() || {};
      const freshArrival = freshMatch?.meetingArrival?.[reporterApplicationId];
      const freshProof = freshMatch?.meetingProofs?.[reporterApplicationId];
      const freshNotification = freshMatch?.arrivalNotificationSms?.[reporterApplicationId];

      if (freshArrival?.status !== "arrived" || !freshProof?.photo?.url) {
        throw new HttpsError(
          "failed-precondition",
          "현장사진 업로드와 도착 확인이 완료된 뒤 상대방에게 안내할 수 있습니다."
        );
      }

      if (freshNotification?.status === "sent") {
        return {
          status: "already_sent",
          sent: true,
          sentAtClient: freshNotification.sentAtClient || "",
        };
      }

      if (isFreshSendingLock(freshNotification)) {
        return { status: "processing", sent: false };
      }

      transaction.set(
        matchRef,
        {
          arrivalNotificationSms: {
            [reporterApplicationId]: {
              status: "sending",
              reporterApplicationId,
              counterpartApplicationId,
              attemptCount: Number(freshNotification?.attemptCount || 0) + 1,
              attemptAt: admin.firestore.FieldValue.serverTimestamp(),
              attemptAtClient: lockAtClient,
              requestedAt: admin.firestore.FieldValue.serverTimestamp(),
              requestedAtClient: lockAtClient,
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { status: "locked", sent: false };
    });

    if (lockResult.status !== "locked") {
      return lockResult;
    }

    const counterpartSnap = await db
      .collection("twoweeksApplications")
      .doc(counterpartApplicationId)
      .get();

    if (!counterpartSnap.exists) {
      await matchRef.set(
        {
          arrivalNotificationSms: {
            [reporterApplicationId]: {
              status: "failed",
              errorMessage: "상대방 신청 정보를 찾을 수 없습니다.",
              failedAtClient: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
      throw new HttpsError("not-found", "상대방 신청 정보를 찾을 수 없습니다.");
    }

    const counterpartApplication = { id: counterpartSnap.id, ...counterpartSnap.data() };
    const counterpartPhone = getPhone(counterpartApplication);

    if (!counterpartPhone) {
      await matchRef.set(
        {
          arrivalNotificationSms: {
            [reporterApplicationId]: {
              status: "failed",
              errorMessage: "상대방 연락처를 확인할 수 없습니다.",
              failedAtClient: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
      throw new HttpsError("failed-precondition", "상대방 연락처를 확인할 수 없습니다.");
    }

    try {
      const providerResult = await sendNcpMessage(
        counterpartPhone,
        buildArrivalConfirmationMessage(counterpartApplication)
      );
      const sentAtClient = new Date().toISOString();

      await matchRef.set(
        {
          arrivalNotificationSms: {
            [reporterApplicationId]: {
              status: "sent",
              reporterApplicationId,
              counterpartApplicationId,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              sentAtClient,
              providerRequestId: providerResult?.requestId || "",
              phoneLast4: counterpartPhone.slice(-4),
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { status: "sent", sent: true, sentAtClient };
    } catch (error) {
      console.error(
        "[sendTwoWeeksArrivalConfirmation] sms failed:",
        error?.response?.data || error?.message || error
      );

      await matchRef.set(
        {
          arrivalNotificationSms: {
            [reporterApplicationId]: {
              status: "failed",
              reporterApplicationId,
              counterpartApplicationId,
              errorMessage: error?.message || String(error),
              failedAtClient: new Date().toISOString(),
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      throw new HttpsError("internal", "도착 안내 문자 발송 중 오류가 발생했습니다.");
    }
  }
);

module.exports = {
  sendTwoWeeksMissingArrivalAlert,
  sendTwoWeeksArrivalConfirmation,
};
