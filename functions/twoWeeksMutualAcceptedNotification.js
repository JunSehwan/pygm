const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { notifyTwoWeeksAdminLifecycle } = require("./twoWeeksAdminLifecycleNotification");
const {
  PROPOSAL_RESPONSE_DUE_HOURS,
  SCHEDULE_STAGE_DUE_HOURS,
  SCHEDULE_TOTAL_DUE_HOURS,
  addHoursClient,
  buildSchedulePolicy,
  getMatchSchedulePolicy,
  getProposalResponseDueMs,
  toMillis,
} = require("./twoWeeksSchedulePolicy");

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

    // 신규 매칭은 Firestore의 서버 생성시각을 최종 기준으로 사용한다.
    // 정책 도입 전 문서처럼 서버 생성시각이 없을 때만 호환용 기준을 사용한다.
    const schedulePolicy = match.createdAt
      ? buildSchedulePolicy(match.createdAt)
      : getMatchSchedulePolicy(match);
    const currentScheduleStatus = String(
      match.scheduleStatus || match?.schedule?.status || ""
    );
    const terminalStatuses = [
      "declined",
      "failed",
      "expired",
      "proposal_expired",
      "schedule_expired",
      "counterpart_expired",
      "cancelled",
      "canceled",
    ];

    if (
      terminalStatuses.includes(String(match.status || "")) ||
      terminalStatuses.includes(String(match.proposalStatus || "")) ||
      terminalStatuses.includes(currentScheduleStatus)
    ) {
      throw new HttpsError("failed-precondition", "이미 종료된 제안입니다.");
    }

    const scheduleProgressed = [
      "waiting_counterpart",
      "needs_final_choice",
      "place_pending",
      "confirmed",
    ].includes(currentScheduleStatus);
    const scheduleInitializedByServer = Boolean(
      match?.schedule?.serverPolicyInitializedAtClient
    );
    const nowClient = new Date().toISOString();
    const firstDueAtClient = scheduleInitializedByServer
      ? match?.schedule?.dueAtClient || addHoursClient(SCHEDULE_STAGE_DUE_HOURS, nowClient)
      : addHoursClient(SCHEDULE_STAGE_DUE_HOURS, nowClient);

    const authoritativeMatchPatch = {
      schedulePolicy,
      policySnapshot: {
        ...(match.policySnapshot || {}),
        proposalResponseDueHours: PROPOSAL_RESPONSE_DUE_HOURS,
        scheduleSelectionDueHours: SCHEDULE_TOTAL_DUE_HOURS,
        firstScheduleSelectionDueHours: SCHEDULE_STAGE_DUE_HOURS,
        counterpartScheduleSelectionDueHours: SCHEDULE_STAGE_DUE_HOURS,
        meetingWeekRule: schedulePolicy.meetingWeekRule,
        meetingTimeZone: schedulePolicy.timeZone,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!scheduleProgressed && currentScheduleStatus !== "confirmed") {
      authoritativeMatchPatch.status = "mutualAccepted";
      authoritativeMatchPatch.scheduleStatus = "ready";
      authoritativeMatchPatch.mutualAcceptedAt =
        match.mutualAcceptedAt || admin.firestore.FieldValue.serverTimestamp();
      authoritativeMatchPatch.mutualAcceptedAtClient =
        match.mutualAcceptedAtClient || nowClient;
      authoritativeMatchPatch.schedule = {
        ...(match.schedule || {}),
        status: "ready",
        dueHours: SCHEDULE_STAGE_DUE_HOURS,
        totalDueHours: SCHEDULE_TOTAL_DUE_HOURS,
        dueAtClient: firstDueAtClient,
        policyVersion: schedulePolicy.version,
        meetingWindowStartDateKey: schedulePolicy.windowStartDateKey,
        meetingWindowEndDateKey: schedulePolicy.windowEndDateKey,
        openedAt: match?.schedule?.openedAt || admin.firestore.FieldValue.serverTimestamp(),
        openedAtClient: match?.schedule?.openedAtClient || nowClient,
        serverPolicyInitializedAt: admin.firestore.FieldValue.serverTimestamp(),
        serverPolicyInitializedAtClient:
          match?.schedule?.serverPolicyInitializedAtClient || nowClient,
        firstSelectorApplicationId: match?.schedule?.firstSelectorApplicationId || "",
        firstChoices: Array.isArray(match?.schedule?.firstChoices)
          ? match.schedule.firstChoices
          : [],
        finalChoice: match?.schedule?.finalChoice || null,
      };
    }

    // 문자 발송 여부와 관계없이 일정 기준과 첫 선택 기한을 서버에서 먼저 확정한다.
    await db.collection("twoweeksMatches").doc(matchId).set(
      authoritativeMatchPatch,
      { merge: true }
    );

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
