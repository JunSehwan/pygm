const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const { getProposalResponseDueMs, getScheduleStageDueMs } = require("./twoWeeksSchedulePolicy");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";
const RESPONSE_REMINDER_BEFORE_MS = 12 * 60 * 60 * 1000;
const SCHEDULE_REMINDER_BEFORE_MS = 12 * 60 * 60 * 1000;
const MAX_MATCHES_PER_RUN = 200;

const NO_RESPONSE_REVIEW_REASONS = new Set([
  "proposal_no_response",
  "proposal_expired",
  "schedule_no_response",
  "schedule_expired",
  "schedule_first_choice",
  "schedule_counterpart_choice",
]);

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function toClientNow() {
  return new Date().toISOString();
}

function addSafeSet(target = {}, key = "", value) {
  if (!key) return target;
  return {
    ...target,
    [key]: value,
  };
}

function getBasic(application = {}) {
  return application.basic || {};
}

function getApplicationPhone(application = {}) {
  const basic = getBasic(application);
  return onlyDigits(
    basic.phoneNormalized ||
      basic.phone ||
      application.phoneNormalized ||
      application.phone ||
      application.phoneIdentityVerification?.phone ||
      ""
  );
}

function getApplicationName(application = {}) {
  const basic = getBasic(application);
  return basic.nickname || basic.name || application.nickname || application.name || "회원";
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
  const token = application.accessToken || application.proposalAccessToken || "";
  const baseUrl = `${getSiteOrigin()}/2weeks/proposal/dashboard`;
  return token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;
}

function getPairIds(match = {}) {
  return [match.maleApplicationId, match.femaleApplicationId].filter(Boolean);
}

function getCounterpartId(match = {}, applicationId = "") {
  return getPairIds(match).find((id) => id && id !== applicationId) || "";
}

async function getApplication(db, applicationId = "") {
  if (!applicationId) return null;
  const snap = await db.collection("twoweeksApplications").doc(applicationId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
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
      phone,
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

  const body = {
    type: "LMS",
    contentType: "COMM",
    countryCode: "82",
    from,
    subject: String(subject || "투윅스 안내").slice(0, 40),
    content: message,
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
      phone,
      responseData: response.data || null,
      sentAtClient: toClientNow(),
    };
  } catch (error) {
    logger.error("[TwoWeeksDeadline] LMS failed", error.response?.data || error.message);

    return {
      status: "failed",
      phone,
      errorMessage: error.response?.data || error.message,
      failedAtClient: toClientNow(),
    };
  }
}

async function sendGuideSms(application = {}, subject = "", lines = []) {
  const dashboardUrl = getDashboardUrl(application);
  const message = [
    `[투윅스] ${subject}`,
    "",
    ...lines.filter(Boolean),
    "",
    "신청현황:",
    dashboardUrl,
  ]
    .filter((line) => line !== null && line !== undefined && line !== "")
    .join("\n");

  return sendLmsDirect({
    to: getApplicationPhone(application),
    subject: `투윅스 ${subject}`,
    message,
  });
}

function getProposalDueMs(match = {}) {
  return getProposalResponseDueMs(match);
}

function getScheduleDueMs(match = {}) {
  return getScheduleStageDueMs(match);
}

function getScheduleTargetIds(match = {}) {
  const schedule = match.schedule || {};
  const status = String(match.scheduleStatus || schedule.status || "");

  if (["waiting_counterpart", "needs_final_choice"].includes(status)) {
    const counterpartId =
      schedule.counterpartApplicationId ||
      getPairIds(match).find((id) => id && id !== schedule.firstSelectorApplicationId) ||
      "";

    return counterpartId ? [counterpartId] : [];
  }

  if (["ready", "needs_first_choice", "mutualAccepted"].includes(status) || match.status === "mutualAccepted") {
    return getPairIds(match);
  }

  return [];
}

function isTerminalMatch(match = {}) {
  const status = String(match.status || "");
  const scheduleStatus = String(match.scheduleStatus || match.schedule?.status || "");

  return [
    "declined",
    "proposal_expired",
    "schedule_expired",
    "counterpart_expired",
    "completed",
    "cancelled",
    "failed",
  ].includes(status) || ["confirmed", "expired", "schedule_expired", "counterpart_expired"].includes(scheduleStatus);
}

async function sendProposalReminderIfNeeded({ db, match, male, female, nowMs }) {
  const dueMs = getProposalDueMs(match);
  if (!dueMs || nowMs >= dueMs) return null;

  const reminders = match.deadlineReminders || {};
  if (reminders.proposalResponseSentAtClient) return null;

  if (nowMs < dueMs - RESPONSE_REMINDER_BEFORE_MS) return null;

  const apps = [male, female].filter(Boolean);
  const results = {};

  for (const app of apps) {
    const response = String(app?.currentProposal?.response || "");
    if (response && response !== "pending") continue;

    results[app.id] = await sendGuideSms(app, "응답 마감 안내", [
      "매칭 제안 응답 기한이 얼마 남지 않았습니다.",
      "만남 진행 또는 패스를 선택해주세요.",
      "무응답은 다음 매칭에 반영될 수 있습니다.",
    ]);
  }

  if (!Object.keys(results).length) return null;

  const payload = {
    deadlineReminders: {
      proposalResponseSentAt: admin.firestore.FieldValue.serverTimestamp(),
      proposalResponseSentAtClient: toClientNow(),
      proposalResponseResults: results,
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("twoweeksMatches").doc(match.id).set(payload, { merge: true });
  return results;
}

async function sendScheduleReminderIfNeeded({ db, match, applicationsById, nowMs }) {
  const dueMs = getScheduleDueMs(match);
  if (!dueMs || nowMs >= dueMs) return null;

  const reminders = match.deadlineReminders || {};
  const schedule = match.schedule || {};
  const status = String(match.scheduleStatus || schedule.status || "");
  const reminderKey = ["waiting_counterpart", "needs_final_choice"].includes(status)
    ? "scheduleCounterpartSentAtClient"
    : "scheduleFirstChoiceSentAtClient";

  if (reminders[reminderKey]) return null;
  if (nowMs < dueMs - SCHEDULE_REMINDER_BEFORE_MS) return null;

  const targetIds = getScheduleTargetIds(match);
  const results = {};

  for (const id of targetIds) {
    const app = applicationsById[id] || (await getApplication(db, id));
    if (!app) continue;

    const isCounterpart = ["waiting_counterpart", "needs_final_choice"].includes(status);
    results[id] = await sendGuideSms(app, "일정 선택 마감 안내", [
      isCounterpart
        ? "상대가 제안한 일시/장소 중 1개씩 선택해주세요."
        : "일시 후보 3개와 장소 후보 3개를 선택해주세요.",
      "기한 내 선택하지 않으면 이번 만남은 종료될 수 있습니다.",
      "무응답은 다음 매칭에 반영될 수 있습니다.",
    ]);
  }

  if (!Object.keys(results).length) return null;

  await db
    .collection("twoweeksMatches")
    .doc(match.id)
    .set(
      {
        deadlineReminders: {
          [reminderKey.replace("SentAtClient", "SentAt")]: admin.firestore.FieldValue.serverTimestamp(),
          [reminderKey]: toClientNow(),
          [reminderKey.replace("SentAtClient", "Results")]: results,
        },
        "schedule.reminderCount": Number(schedule.reminderCount || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return results;
}

async function expireProposalMatch({ db, match: requestedMatch, nowMs }) {
  const matchId = requestedMatch.id;
  const committed = await db.runTransaction(async (transaction) => {
    const currentSnap = await transaction.get(db.collection("twoweeksMatches").doc(matchId));
    if (!currentSnap.exists) return null;
    const match = { id: currentSnap.id, ...currentSnap.data() };
    const ids = getPairIds(match);
    const snaps = await Promise.all(ids.map((id) => transaction.get(db.collection("twoweeksApplications").doc(id))));
    const currentApplications = snaps.filter((snap) => snap.exists).map((snap) => ({ id: snap.id, ...snap.data() }))
      .filter((app) => app.currentProposal?.matchId === matchId && app.status !== "withdrawn" && app.withdrawal?.status !== "completed");
    if (isTerminalMatch(match) || match.status !== "proposed") return null;

    const dueMs = getProposalDueMs(match);
    if (!dueMs || nowMs < dueMs) return null;
    if (match.expiration?.proposalExpiredAtClient) return null;

    const apps = currentApplications;
    const nonResponders = apps.filter((app) => {
      const response = String(app?.currentProposal?.response || "");
      return !response || response === "pending";
    });
    const acceptedApps = apps.filter((app) => String(app?.currentProposal?.response || "") === "accepted");

    if (!nonResponders.length) return null;

    const smsResults = {};
    const notifications = [];

    for (const app of acceptedApps) {
      notifications.push({ application: app, title: "매칭 제안 종료", lines: [
        "상대방이 기한 내 만남을 확정하지 않아 이번 제안은 종료되었습니다.",
        "해당 사유는 회원님에게 불이익 없이 처리됩니다.",
        "다음 후보를 다시 검토해드리겠습니다.",
      ] });
    }

    for (const app of nonResponders) {
      notifications.push({ application: app, title: "응답 기한 만료", lines: [
        "기한 내 응답이 없어 이번 매칭 제안은 종료되었습니다.",
        "무응답은 다음 매칭 우선순위에 반영될 수 있습니다.",
      ] });
    }

    const batch = transaction;
    const matchRef = db.collection("twoweeksMatches").doc(match.id);
    batch.set(
      matchRef,
      {
        status: "proposal_expired",
        proposalStatus: "expired",
        expiredStage: "proposal_response",
        expiredByApplicationIds: nonResponders.map((app) => app.id),
        expiration: {
          proposalExpiredAt: admin.firestore.FieldValue.serverTimestamp(),
          proposalExpiredAtClient: toClientNow(),
          dueAtClient: match.responseDueAtClient || "",
          nonResponderApplicationIds: nonResponders.map((app) => app.id),
          acceptedApplicationIds: acceptedApps.map((app) => app.id),
          smsResults,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    for (const app of acceptedApps) {
      const appRef = db.collection("twoweeksApplications").doc(app.id);
      batch.update(appRef, {
        matchingStatus: "not_started",
        matchingAvailability: "active",
        nextRoundStatus: "ready",
        currentProposal: admin.firestore.FieldValue.delete(),
        scheduleStatus: "not_started",
        schedule: admin.firestore.FieldValue.delete(),
        photoRevealStatus: "hidden",
        noPenaltyReason: "counterpart_proposal_no_response",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    for (const app of nonResponders) {
      const appRef = db.collection("twoweeksApplications").doc(app.id);
      const previousProposalNoResponseCount = Number(app?.penaltyStats?.proposalNoResponseCount || 0);
      const isRepeatedNoResponse = previousProposalNoResponseCount >= 1;

      if (!isRepeatedNoResponse) {
        // 첫 제안 무응답은 이력과 경고만 남기고 다음 후보 검토가 가능하도록 복귀시킨다.
        // 한 번의 기한 초과로 무기한 정지되면 관리자 매칭풀에서 영구히 사라질 수 있다.
        batch.update(appRef, {
          matchingStatus: "not_started",
          matchingAvailability: "active",
          matchingPauseReason: admin.firestore.FieldValue.delete(),
          nextRoundStatus: "ready",
          currentProposal: admin.firestore.FieldValue.delete(),
          scheduleStatus: "not_started",
          schedule: admin.firestore.FieldValue.delete(),
          photoRevealStatus: "hidden",
          "penaltyStats.proposalNoResponseCount": admin.firestore.FieldValue.increment(1),
          "penaltyStats.totalNoResponseCount": admin.firestore.FieldValue.increment(1),
          "penaltyStats.lastPenaltyReason": "proposal_no_response",
          "penaltyStats.lastPenaltyAt": admin.firestore.FieldValue.serverTimestamp(),
          "penaltyStats.lastPenaltyAtClient": toClientNow(),
          "penaltyStats.lastMatchId": match.id,
          "penaltyStats.lastCounterpartOutcome": acceptedApps.length ? "counterpart_accepted" : "both_no_response",
          "penaltyStats.reviewStatus": "warning_recorded",
          "penaltyStats.lastAdminDecision": "auto_returned_after_first_proposal_no_response",
          "penaltyStats.lastAdminDecisionAt": admin.firestore.FieldValue.serverTimestamp(),
          "penaltyStats.lastAdminDecisionAtClient": toClientNow(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // 반복 무응답부터는 운영자가 참여 의사를 확인한 뒤 복귀시킨다.
        batch.update(appRef, {
          matchingStatus: "paused",
          matchingAvailability: "paused",
          matchingPauseReason: "proposal_no_response",
          matchingPausedAt: admin.firestore.FieldValue.serverTimestamp(),
          matchingPausedAtClient: toClientNow(),
          scheduleStatus: "proposal_expired",
          nextRoundStatus: "admin_review",
          currentProposal: admin.firestore.FieldValue.delete(),
          "penaltyStats.proposalNoResponseCount": admin.firestore.FieldValue.increment(1),
          "penaltyStats.totalNoResponseCount": admin.firestore.FieldValue.increment(1),
          "penaltyStats.lastPenaltyReason": "proposal_no_response",
          "penaltyStats.lastPenaltyAt": admin.firestore.FieldValue.serverTimestamp(),
          "penaltyStats.lastPenaltyAtClient": toClientNow(),
          "penaltyStats.lastMatchId": match.id,
          "penaltyStats.lastCounterpartOutcome": acceptedApps.length ? "counterpart_accepted" : "both_no_response",
          "penaltyStats.reviewStatus": "admin_review",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }


    return {
      notifications,
      matchId: match.id,
      stage: "proposal_response",
      nonResponders: nonResponders.map((app) => app.id),
      accepted: acceptedApps.map((app) => app.id),
    };
  });
  if (!committed) return null;
  const { notifications, ...result } = committed;
  const smsResults = {};
  for (const notification of notifications) {
    smsResults[notification.application.id] = await sendGuideSms(notification.application, notification.title, notification.lines);
  }
  await db.collection("twoweeksMatches").doc(matchId).set({
    expiration: { smsResults }, updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return result;
}

async function expireScheduleMatch({ db, match: requestedMatch, nowMs }) {
  const matchId = requestedMatch.id;
  const committed = await db.runTransaction(async (transaction) => {
    const currentSnap = await transaction.get(db.collection("twoweeksMatches").doc(matchId));
    if (!currentSnap.exists) return null;
    const match = { id: currentSnap.id, ...currentSnap.data() };
    const ids = getPairIds(match);
    const snaps = await Promise.all(ids.map((id) => transaction.get(db.collection("twoweeksApplications").doc(id))));
    const currentApplications = snaps.filter((snap) => snap.exists).map((snap) => ({ id: snap.id, ...snap.data() }))
      .filter((app) => app.currentProposal?.matchId === matchId && app.status !== "withdrawn" && app.withdrawal?.status !== "completed");
    if (isTerminalMatch(match)) return null;

    const schedule = match.schedule || {};
    const status = String(match.scheduleStatus || schedule.status || "");
    if (!["ready", "needs_first_choice", "waiting_counterpart", "needs_final_choice"].includes(status)) return null;

    const dueMs = getScheduleDueMs(match);
    if (!dueMs || nowMs < dueMs) return null;
    if (match.expiration?.scheduleExpiredAtClient) return null;

    const allIds = getPairIds(match);
    const isCounterpartStep = ["waiting_counterpart", "needs_final_choice"].includes(status);
    const nonResponderIds = isCounterpartStep ? getScheduleTargetIds(match) : allIds;
    const noPenaltyIds = allIds.filter((id) => !nonResponderIds.includes(id));

    const nonResponders = [];
    const noPenaltyApps = [];

    for (const id of nonResponderIds) {
      const app = currentApplications.find((item) => item.id === id);
      if (app) nonResponders.push(app);
    }

    for (const id of noPenaltyIds) {
      const app = currentApplications.find((item) => item.id === id);
      if (app) noPenaltyApps.push(app);
    }

    if (!nonResponders.length) return null;

    const smsResults = {};
    const notifications = [];

    for (const app of noPenaltyApps) {
      notifications.push({ application: app, title: "일정조율 종료", lines: [
        "상대방이 기한 내 일시/장소를 확정하지 않아 이번 만남은 종료되었습니다.",
        "해당 사유는 회원님에게 불이익 없이 처리됩니다.",
        "다음 후보를 다시 검토해드리겠습니다.",
      ] });
    }

    for (const app of nonResponders) {
      notifications.push({ application: app, title: "일정조율 기한 만료", lines: [
        "기한 내 일시/장소 선택이 완료되지 않아 이번 만남은 종료되었습니다.",
        "일정조율 무응답은 다음 매칭 우선순위에 반영될 수 있습니다.",
      ] });
    }

    const batch = transaction;
    const matchRef = db.collection("twoweeksMatches").doc(match.id);
    const expiredStage = isCounterpartStep ? "schedule_counterpart_choice" : "schedule_first_choice";
    const nextScheduleStatus = isCounterpartStep ? "counterpart_expired" : "schedule_expired";

    batch.set(
      matchRef,
      {
        status: "schedule_expired",
        scheduleStatus: nextScheduleStatus,
        expiredStage,
        expiredByApplicationIds: nonResponders.map((app) => app.id),
        schedule: {
          status: nextScheduleStatus,
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          expiredAtClient: toClientNow(),
          expiredReason: expiredStage,
        },
        expiration: {
          scheduleExpiredAt: admin.firestore.FieldValue.serverTimestamp(),
          scheduleExpiredAtClient: toClientNow(),
          dueAtClient:
            schedule.counterpartDueAtClient ||
            schedule.dueAtClient ||
            "",
          expiredStage,
          nonResponderApplicationIds: nonResponders.map((app) => app.id),
          noPenaltyApplicationIds: noPenaltyApps.map((app) => app.id),
          smsResults,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    for (const app of noPenaltyApps) {
      const appRef = db.collection("twoweeksApplications").doc(app.id);
      batch.update(appRef, {
        matchingStatus: "not_started",
        matchingAvailability: "active",
        nextRoundStatus: "ready",
        currentProposal: admin.firestore.FieldValue.delete(),
        scheduleStatus: "not_started",
        schedule: admin.firestore.FieldValue.delete(),
        photoRevealStatus: "hidden",
        noPenaltyReason: "counterpart_schedule_no_response",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    for (const app of nonResponders) {
      const appRef = db.collection("twoweeksApplications").doc(app.id);
      batch.update(appRef, {
        matchingStatus: "paused",
        matchingAvailability: "paused",
        matchingPauseReason: expiredStage,
        matchingPausedAt: admin.firestore.FieldValue.serverTimestamp(),
        matchingPausedAtClient: toClientNow(),
        scheduleStatus: nextScheduleStatus,
        nextRoundStatus: "admin_review",
        // 종료된 제안을 남겨두면 관리자 복귀 판정이 이를 활성 제안으로 오인한다.
        currentProposal: admin.firestore.FieldValue.delete(),
        schedule: {
          status: nextScheduleStatus,
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          expiredAtClient: toClientNow(),
          expiredReason: expiredStage,
        },
        "penaltyStats.scheduleNoResponseCount": admin.firestore.FieldValue.increment(1),
        "penaltyStats.totalNoResponseCount": admin.firestore.FieldValue.increment(1),
        "penaltyStats.lastPenaltyReason": expiredStage,
        "penaltyStats.lastPenaltyAt": admin.firestore.FieldValue.serverTimestamp(),
        "penaltyStats.lastPenaltyAtClient": toClientNow(),
        "penaltyStats.lastMatchId": match.id,
        "penaltyStats.lastCounterpartOutcome": noPenaltyApps.length ? "counterpart_waited" : "both_no_response",
        "penaltyStats.reviewStatus": "admin_review",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }


    return {
      notifications,
      matchId: match.id,
      stage: expiredStage,
      nonResponders: nonResponders.map((app) => app.id),
      noPenalty: noPenaltyApps.map((app) => app.id),
    };
  });
  if (!committed) return null;
  const { notifications, ...result } = committed;
  const smsResults = {};
  for (const notification of notifications) {
    smsResults[notification.application.id] = await sendGuideSms(notification.application, notification.title, notification.lines);
  }
  await db.collection("twoweeksMatches").doc(matchId).set({
    expiration: { smsResults }, updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return result;
}

async function processProposedMatches({ db, nowMs }) {
  const snap = await db.collection("twoweeksMatches").where("status", "==", "proposed").limit(MAX_MATCHES_PER_RUN).get();
  const jobs = [];

  snap.forEach((doc) => {
    jobs.push(
      (async () => {
        const match = { id: doc.id, ...doc.data() };
        const male = await getApplication(db, match.maleApplicationId);
        const female = await getApplication(db, match.femaleApplicationId);

        const reminder = await sendProposalReminderIfNeeded({ db, match, male, female, nowMs });
        const expired = await expireProposalMatch({ db, match, male, female, nowMs });

        return { reminder, expired };
      })()
    );
  });

  return Promise.allSettled(jobs);
}

async function processScheduleMatches({ db, nowMs }) {
  const snap = await db
    .collection("twoweeksMatches")
    .where("status", "==", "mutualAccepted")
    .limit(MAX_MATCHES_PER_RUN)
    .get();

  const jobs = [];

  snap.forEach((doc) => {
    jobs.push(
      (async () => {
        const match = { id: doc.id, ...doc.data() };
        const applicationsById = {};

        for (const id of getPairIds(match)) {
          const app = await getApplication(db, id);
          if (app) applicationsById[id] = app;
        }

        const reminder = await sendScheduleReminderIfNeeded({ db, match, applicationsById, nowMs });
        const expired = await expireScheduleMatch({ db, match, applicationsById, nowMs });

        return { reminder, expired };
      })()
    );
  });

  return Promise.allSettled(jobs);
}

async function repairExpiredAdminReviewApplications({ db }) {
  const snap = await db
    .collection("twoweeksApplications")
    .where("nextRoundStatus", "==", "admin_review")
    .limit(MAX_MATCHES_PER_RUN)
    .get();

  if (snap.empty) return { scanned: 0, returnedToPool: 0, staleProposalCleared: 0 };

  let returnedToPool = 0;
  let staleProposalCleared = 0;

  for (const document of snap.docs) {
    const outcome = await db.runTransaction(async (batch) => {
      const current = await batch.get(document.ref);
      if (!current.exists) return;
      const app = { id: current.id, ...current.data() };
      if (app.nextRoundStatus !== "admin_review" || String(app.matchingStatus || "") !== "paused") return;
      const proposalStatus = String(app.currentProposal?.status || app.currentProposal?.response || "");
      if (app.currentProposal?.candidateApplicationId && !["expired", "declined", "cancelled", "canceled", "completed"].includes(proposalStatus)) return;

      const pauseReason = String(app.matchingPauseReason || app?.penaltyStats?.lastPenaltyReason || "");
      if (!NO_RESPONSE_REVIEW_REASONS.has(pauseReason)) return;

      const proposalNoResponseCount = Number(app?.penaltyStats?.proposalNoResponseCount || 0);
      const isFirstProposalNoResponse =
        pauseReason === "proposal_no_response" && proposalNoResponseCount <= 1;
      const ref = db.collection("twoweeksApplications").doc(app.id);

      if (isFirstProposalNoResponse) {
        batch.update(ref, {
          matchingStatus: "not_started",
          matchingAvailability: "active",
          matchingPauseReason: admin.firestore.FieldValue.delete(),
          nextRoundStatus: "ready",
          currentProposal: admin.firestore.FieldValue.delete(),
          scheduleStatus: "not_started",
          schedule: admin.firestore.FieldValue.delete(),
          photoRevealStatus: "hidden",
          "penaltyStats.reviewStatus": "warning_recorded",
          "penaltyStats.lastAdminDecision": "auto_repaired_first_proposal_no_response",
          "penaltyStats.lastAdminDecisionAt": admin.firestore.FieldValue.serverTimestamp(),
          "penaltyStats.lastAdminDecisionAtClient": toClientNow(),
          resumedAt: admin.firestore.FieldValue.serverTimestamp(),
          resumedAtClient: toClientNow(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return "returned";
      }

      const currentProposalStatus = String(app?.currentProposal?.status || app?.currentProposal?.response || "");
      const hasStaleProposal =
        Boolean(app?.currentProposal?.candidateApplicationId) &&
        ["expired", "declined", "cancelled", "canceled", "completed"].includes(currentProposalStatus);

      if (hasStaleProposal || pauseReason.startsWith("schedule_")) {
        batch.update(ref, {
          currentProposal: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return "cleared";
      }
    });
    if (outcome === "returned") returnedToPool += 1;
    if (outcome === "cleared") staleProposalCleared += 1;
  }

  return {
    scanned: snap.docs.length,
    returnedToPool,
    staleProposalCleared,
  };
}

exports.processTwoWeeksDeadlineExpirations = onSchedule(
  {
    region: REGION,
    schedule: "every 30 minutes",
    timeZone: "Asia/Seoul",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    const db = admin.firestore();
    const nowMs = Date.now();

    const [proposalResults, scheduleResults, repairResults] = await Promise.all([
      processProposedMatches({ db, nowMs }),
      processScheduleMatches({ db, nowMs }),
      repairExpiredAdminReviewApplications({ db }),
    ]);

    const summarize = (results = []) => ({
      total: results.length,
      fulfilled: results.filter((item) => item.status === "fulfilled").length,
      rejected: results.filter((item) => item.status === "rejected").length,
    });

    logger.info("[TwoWeeksDeadline] finished", {
      proposed: summarize(proposalResults),
      schedules: summarize(scheduleResults),
      repairs: repairResults,
    });
  }
);

// 회귀 테스트에서 스케줄러와 동일한 만료 처리 함수를 사용합니다.
exports.expireProposalMatch = expireProposalMatch;
exports.expireScheduleMatch = expireScheduleMatch;

exports.repairExpiredAdminReviewApplications = repairExpiredAdminReviewApplications;
