const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { buildScheduleOpeningPatch, assertLiveMatch } = require("./twoWeeksScheduleSubmission");
const { notifyTwoWeeksAdminLifecycle } = require("./twoWeeksAdminLifecycleNotification");
const { getProposalResponseDueMs, toMillis } = require("./twoWeeksSchedulePolicy");

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

function getDashboardUrl(application = {}, tab = "schedule") {
  const base =
    application?.dashboardAccess?.url ||
    (application?.dashboardAccess?.path
      ? `https://charmingsoup.com${application.dashboardAccess.path}`
      : "https://charmingsoup.com/2weeks/proposal/dashboard");

  return appendTab(base, tab);
}

function getDisplayName(application = {}) {
  return application?.basic?.name || application?.basic?.nickname || "신청자";
}

function buildMessage(application = {}) {
  return [
    "[투윅스] 일정조율이 시작되었습니다",
    "",
    `${getDisplayName(application)}님, 서로 만남 진행 의사가 확인되었습니다.`,
    "24시간 내 일정조율 탭에서 일시와 장소 후보를 선택해주세요.",
    "먼저 작성하는 사람은 일시 3개와 장소 3개를 제안합니다.",
    "",
    "일정조율 바로가기:",
    getDashboardUrl(application, "schedule"),
  ].join("\n");
}

async function sendNcpLms(to, message, subject = "투윅스 일정조율") {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");

  if (!serviceId || !accessKey || !secretKey || !from) {
    throw new Error("NCP SMS 환경변수가 설정되지 않았습니다.");
  }

  const method = "POST";
  const urlPath = `/sms/v2/services/${serviceId}/messages`;
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

  const response = await axios.post(
    `https://sens.apigw.ntruss.com${urlPath}`,
    {
      type: "LMS",
      countryCode: "82",
      from,
      subject,
      content: String(message || "").replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, ""),
      messages: [{ to }],
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

  return response.data;
}

async function getProposalResponse(db, viewerApplicationId, candidateApplicationId) {
  const snap = await db
    .collection("twoweeksProposalResponses")
    .doc(`${viewerApplicationId}_${candidateApplicationId}`)
    .get();

  return snap.exists ? snap.data() || {} : null;
}

async function claimNotificationLock({ db, matchId, applicationId }) {
  const lockRef = db
    .collection("twoweeksNotificationLocks")
    .doc(`mutualAccepted_${matchId}_${applicationId}`);
  const nowClient = new Date().toISOString();
  const retryBefore = Date.now() - NOTIFICATION_LOCK_STALE_MS;

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(lockRef);
    const current = snap.exists ? snap.data() || {} : {};

    if (current.status === "sent") {
      return { shouldSend: false, status: "already_sent", lockRef };
    }

    const attemptMs = Date.parse(current.attemptAtClient || "");
    if (
      current.status === "sending" &&
      Number.isFinite(attemptMs) &&
      attemptMs > retryBefore
    ) {
      return { shouldSend: false, status: "sending", lockRef };
    }

    transaction.set(
      lockRef,
      {
        matchId,
        applicationId,
        event: "mutual_accepted_schedule",
        status: "sending",
        attemptCount: Number(current.attemptCount || 0) + 1,
        attemptAt: admin.firestore.FieldValue.serverTimestamp(),
        attemptAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtClient: nowClient,
      },
      { merge: true }
    );

    return { shouldSend: true, status: "claimed", lockRef };
  });
}

async function sendOnce({ db, matchId, application }) {
  const applicationId = application.id;
  const phone = getPhone(application);
  const claim = await claimNotificationLock({ db, matchId, applicationId });

  if (!claim.shouldSend) {
    return { applicationId, status: claim.status };
  }

  if (!phone) {
    await claim.lockRef.set(
      {
        status: "skipped",
        reason: "NO_PHONE",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtClient: new Date().toISOString(),
      },
      { merge: true }
    );
    return { applicationId, status: "skipped", reason: "NO_PHONE" };
  }

  try {
    const response = await sendNcpLms(phone, buildMessage(application));

    await claim.lockRef.set(
      {
        status: "sent",
        phoneLast4: phone.slice(-4),
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentAtClient: new Date().toISOString(),
        providerRequestId: response?.requestId || "",
      },
      { merge: true }
    );

    return { applicationId, status: "sent" };
  } catch (error) {
    await claim.lockRef.set(
      {
        status: "failed",
        errorMessage: error?.message || String(error),
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        failedAtClient: new Date().toISOString(),
      },
      { merge: true }
    );
    throw error;
  }
}

const notifyTwoWeeksMutualAccepted = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const data = request.data || {};
    const matchId = String(data?.matchId || "").trim();
    const viewerApplicationId = String(data?.viewerApplicationId || "").trim();

    if (!matchId || !viewerApplicationId) {
      throw new HttpsError("invalid-argument", "매칭 정보가 필요합니다.");
    }

    const db = admin.firestore();
    const matchSnap = await db.collection("twoweeksMatches").doc(matchId).get();

    if (!matchSnap.exists) {
      throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");
    }

    const match = matchSnap.data() || {};
    const maleApplicationId = String(match.maleApplicationId || "");
    const femaleApplicationId = String(match.femaleApplicationId || "");
    const participantIds = [maleApplicationId, femaleApplicationId].filter(Boolean);

    if (!participantIds.includes(viewerApplicationId) || participantIds.length !== 2) {
      throw new HttpsError("permission-denied", "해당 매칭의 참여자가 아닙니다.");
    }

    // 요청자가 viewerApplicationId의 실제 소유자인지 서버에서 다시 확인한다.
    await assertApplicationOwner(request, viewerApplicationId);

    const [maleResponse, femaleResponse] = await Promise.all([
      getProposalResponse(db, maleApplicationId, femaleApplicationId),
      getProposalResponse(db, femaleApplicationId, maleApplicationId),
    ]);

    if (
      maleResponse?.response !== "accepted" ||
      femaleResponse?.response !== "accepted"
    ) {
      return { status: "waiting_counterpart", sent: false };
    }

    const responseDueMs = getProposalResponseDueMs(match);
    const acceptedAtValues = [maleResponse, femaleResponse]
      .map((item) => toMillis(item?.respondedAt) || toMillis(item?.respondedAtClient))
      .filter(Boolean);

    if (
      responseDueMs &&
      acceptedAtValues.some((acceptedAtMs) => acceptedAtMs >= responseDueMs)
    ) {
      throw new HttpsError("deadline-exceeded", "제안 응답 기한이 종료되었습니다.");
    }

    // 문자 요청이 늦게 도착해도 이미 선택한 후보나 확정/종료 상태를 덮어쓰지 않습니다.
    // 신규 응답은 수락 트랜잭션이 일정을 엽니다. 이 경로는 레거시 매칭만 보완합니다.
    const authoritativeMatchPatch = await db.runTransaction(async (transaction) => {
      const ref = db.collection("twoweeksMatches").doc(matchId);
      const currentSnap = await transaction.get(ref);
      if (!currentSnap.exists) throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");
      const current = currentSnap.data() || {};
      assertLiveMatch(current);
      const currentStatus = current.scheduleStatus || current.schedule?.status || "";
      if (current.status === "confirmed" || ["waiting_counterpart", "needs_final_choice", "place_pending", "confirmed"].includes(currentStatus)) {
        return { skipNotifications: true };
      }
      if (["ready", "needs_first_choice"].includes(currentStatus)) return {};
      const patch = buildScheduleOpeningPatch(current);
      transaction.set(ref, patch, { merge: true });
      return patch;
    });

    if (authoritativeMatchPatch.skipNotifications) {
      return { status: "already_progressed", sent: false, scheduleOpened: false, results: [] };
    }

    await notifyTwoWeeksAdminLifecycle({
      matchId,
      event: "mutual_accepted",
      match: { ...match, ...authoritativeMatchPatch },
    }).catch((error) => console.error("[TwoWeeks] admin mutual accepted notification failed:", error));

    const applicationSnaps = await Promise.all(
      participantIds.map((applicationId) =>
        db.collection("twoweeksApplications").doc(applicationId).get()
      )
    );

    const applications = applicationSnaps
      .filter((snap) => snap.exists)
      .map((snap) => ({ id: snap.id, ...snap.data() }));

    if (applications.length !== 2) {
      throw new HttpsError("not-found", "신청자 정보를 찾을 수 없습니다.");
    }

    const results = [];
    for (const application of applications) {
      try {
        results.push(await sendOnce({ db, matchId, application }));
      } catch (error) {
        results.push({
          applicationId: application.id,
          status: "failed",
          errorMessage: error?.message || String(error),
        });
      }
    }

    await db.collection("twoweeksMatches").doc(matchId).set(
      {
        mutualAcceptedNotification: {
          status: results.every((item) => ["sent", "already_sent"].includes(item.status))
            ? "sent"
            : "partial",
          results,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAtClient: new Date().toISOString(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const allSent = results.every((item) =>
      ["sent", "already_sent"].includes(item.status)
    );

    return {
      status: allSent ? "sent" : "partial",
      sent: allSent,
      scheduleOpened: true,
      results,
    };
  }
);

module.exports = { notifyTwoWeeksMutualAccepted };
