const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";
const RESPONSE_REMINDER_BEFORE_MS = 12 * 60 * 60 * 1000;
const SCHEDULE_REMINDER_BEFORE_MS = 12 * 60 * 60 * 1000;
const MAX_MATCHES_PER_RUN = 200;

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function toClientNow() {
  return new Date().toISOString();
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();

  const ms = Date.parse(String(value));
  return Number.isNaN(ms) ? 0 : ms;
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
  return toMillis(match.responseDueAtClient || match.proposalDueAtClient || match.schedule?.responseDueAtClient);
}

function getScheduleDueMs(match = {}) {
  const schedule = match.schedule || {};
  const status = String(match.scheduleStatus || schedule.status || "");

  if (["waiting_counterpart", "needs_final_choice"].includes(status)) {
    return toMillis(schedule.counterpartDueAtClient || schedule.dueAtClient);
  }

  return toMillis(schedule.dueAtClient || schedule.counterpartDueAtClient);
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

async function expireProposalMatch({ db, match, male, female, nowMs }) {
  if (isTerminalMatch(match) || match.status !== "proposed") return null;

  const dueMs = getProposalDueMs(match);
  if (!dueMs || nowMs < dueMs) return null;
  if (match.expiration?.proposalExpiredAtClient) return null;

  const apps = [male, female].filter(Boolean);
  const nonResponders = apps.filter((app) => {
    const response = String(app?.currentProposal?.response || "");
    return !response || response === "pending";
  });
  const acceptedApps = apps.filter((app) => String(app?.currentProposal?.response || "") === "accepted");

  if (!nonResponders.length) return null;

  const smsResults = {};

  for (const app of acceptedApps) {
    smsResults[app.id] = await sendGuideSms(app, "매칭 제안 종료", [
      "상대방이 기한 내 만남을 확정하지 않아 이번 제안은 종료되었습니다.",
      "해당 사유는 회원님에게 불이익 없이 처리됩니다.",
      "다음 후보를 다시 검토해드리겠습니다.",
    ]);
  }

  for (const app of nonResponders) {
    smsResults[app.id] = await sendGuideSms(app, "응답 기한 만료", [
      "기한 내 응답이 없어 이번 매칭 제안은 종료되었습니다.",
      "무응답은 다음 매칭 우선순위에 반영될 수 있습니다.",
    ]);
  }

  const batch = db.batch();
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
    batch.set(
      appRef,
      {
        matchingStatus: "paused",
        scheduleStatus: "proposal_expired",
        nextRoundStatus: "admin_review",
        currentProposal: {
          response: "expired",
          status: "expired",
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          expiredAtClient: toClientNow(),
          expiredReason: "proposal_no_response",
        },
        penaltyStats: {
          proposalNoResponseCount: admin.firestore.FieldValue.increment(1),
          totalNoResponseCount: admin.firestore.FieldValue.increment(1),
          lastPenaltyReason: "proposal_no_response",
          lastPenaltyAt: admin.firestore.FieldValue.serverTimestamp(),
          lastPenaltyAtClient: toClientNow(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();

  return {
    matchId: match.id,
    stage: "proposal_response",
    nonResponders: nonResponders.map((app) => app.id),
    accepted: acceptedApps.map((app) => app.id),
  };
}

async function expireScheduleMatch({ db, match, applicationsById, nowMs }) {
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
    const app = applicationsById[id] || (await getApplication(db, id));
    if (app) nonResponders.push(app);
  }

  for (const id of noPenaltyIds) {
    const app = applicationsById[id] || (await getApplication(db, id));
    if (app) noPenaltyApps.push(app);
  }

  if (!nonResponders.length) return null;

  const smsResults = {};

  for (const app of noPenaltyApps) {
    smsResults[app.id] = await sendGuideSms(app, "일정조율 종료", [
      "상대방이 기한 내 일시/장소를 확정하지 않아 이번 만남은 종료되었습니다.",
      "해당 사유는 회원님에게 불이익 없이 처리됩니다.",
      "다음 후보를 다시 검토해드리겠습니다.",
    ]);
  }

  for (const app of nonResponders) {
    smsResults[app.id] = await sendGuideSms(app, "일정조율 기한 만료", [
      "기한 내 일시/장소 선택이 완료되지 않아 이번 만남은 종료되었습니다.",
      "일정조율 무응답은 다음 매칭 우선순위에 반영될 수 있습니다.",
    ]);
  }

  const batch = db.batch();
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
    batch.set(
      appRef,
      {
        matchingStatus: "paused",
        scheduleStatus: nextScheduleStatus,
        nextRoundStatus: "admin_review",
        schedule: {
          status: nextScheduleStatus,
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          expiredAtClient: toClientNow(),
          expiredReason: expiredStage,
        },
        penaltyStats: {
          scheduleNoResponseCount: admin.firestore.FieldValue.increment(1),
          totalNoResponseCount: admin.firestore.FieldValue.increment(1),
          lastPenaltyReason: expiredStage,
          lastPenaltyAt: admin.firestore.FieldValue.serverTimestamp(),
          lastPenaltyAtClient: toClientNow(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();

  return {
    matchId: match.id,
    stage: expiredStage,
    nonResponders: nonResponders.map((app) => app.id),
    noPenalty: noPenaltyApps.map((app) => app.id),
  };
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

    const [proposalResults, scheduleResults] = await Promise.all([
      processProposedMatches({ db, nowMs }),
      processScheduleMatches({ db, nowMs }),
    ]);

    const summarize = (results = []) => ({
      total: results.length,
      fulfilled: results.filter((item) => item.status === "fulfilled").length,
      rejected: results.filter((item) => item.status === "rejected").length,
    });

    logger.info("[TwoWeeksDeadline] finished", {
      proposed: summarize(proposalResults),
      schedules: summarize(scheduleResults),
    });
  }
);
