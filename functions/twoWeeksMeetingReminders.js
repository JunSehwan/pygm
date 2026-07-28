const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MEETING_DURATION_MS = 60 * 60 * 1000;
const FEEDBACK_DELAY_AFTER_END_MS = 2 * 60 * 60 * 1000;
const FEEDBACK_REQUEST_AFTER_START_MS = MEETING_DURATION_MS + FEEDBACK_DELAY_AFTER_END_MS;

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

function getDashboardUrl(application = {}) {
  const token = application.accessToken || application.proposalAccessToken || "";
  const baseUrl = `${getSiteOrigin()}/2weeks/proposal/dashboard`;

  if (!token) return baseUrl;
  return `${baseUrl}?token=${encodeURIComponent(token)}`;
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

function getFeedbackUrl(matchId = "", token = "") {
  return `${getSiteOrigin()}/2weeks/feedback/${encodeURIComponent(matchId)}?token=${encodeURIComponent(token)}`;
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

function isFeedbackRequestAlreadyHandled(match = {}) {
  const reminders = match.reminders || {};

  return Boolean(
    reminders.feedbackRequestSentAtClient ||
      match.feedbackRequestSms?.sentAtClient ||
      match.feedbackStatus === "waiting" ||
      match.feedbackStatus === "partial" ||
      match.feedbackStatus === "completed" ||
      match.feedbackStatus === "issue_reported"
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
  const name = getApplicationName(application);
  const dashboardUrl = getDashboardUrl(application);
  const title = type === "dayBefore" ? "내일 만남 안내" : "만남 2시간 전 안내";

  return [
    `[투윅스] ${title}`,
    "",
    `일시: ${formatTime(finalMeeting)}`,
    `장소: ${formatPlace(finalMeeting)}`,
    finalMeeting.mapUrl || finalMeeting.cafeMapUrl ? `지도: ${finalMeeting.mapUrl || finalMeeting.cafeMapUrl}` : "",
    "",
    buildCounterpartNoteLine(counterpartNote),
    type === "dayBefore"
      ? "내일 약속 시간에 맞춰 방문해주세요."
      : "약속 2시간 전입니다. 여유 있게 이동해주세요.",
    "",
    "신청현황:",
    dashboardUrl,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildFeedbackMessage({ application, finalMeeting, feedbackUrl }) {
  const name = getApplicationName(application);

  return [
    "[투윅스] 만남 피드백 요청",
    "",
    "오늘 만남은 어떠셨나요?",
    `일시: ${formatTime(finalMeeting)}`,
    `장소: ${formatPlace(finalMeeting)}`,
    "",
    "짧은 피드백을 남겨주시면 다음 매칭에 반영됩니다.",
    "노쇼, 지각, 불편한 상황도 함께 알려주세요.",
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
  const existingTokens = match.feedbackTokens || {};
  const nowClient = new Date().toISOString();
  const meetingMs = getMeetingStartMs(finalMeeting);
  const estimatedEndAtClient = meetingMs ? new Date(meetingMs + MEETING_DURATION_MS).toISOString() : "";
  const feedbackDueAtClient = meetingMs ? new Date(meetingMs + FEEDBACK_REQUEST_AFTER_START_MS).toISOString() : "";

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

  const results = {
    male: await sendLmsDirect({
      to: getApplicationPhone(male),
      subject: "투윅스 만남 피드백 요청",
      message: buildFeedbackMessage({
        application: male,
        finalMeeting,
        feedbackUrl: getFeedbackUrl(match.id, maleToken),
      }),
    }),
    female: await sendLmsDirect({
      to: getApplicationPhone(female),
      subject: "투윅스 만남 피드백 요청",
      message: buildFeedbackMessage({
        application: female,
        finalMeeting,
        feedbackUrl: getFeedbackUrl(match.id, femaleToken),
      }),
    }),
  };

  const batch = db.batch();
  const matchRef = db.collection("twoweeksMatches").doc(match.id);

  batch.set(
    matchRef,
    {
      status: "completed",
      meetingStatus: "feedback_requested",
      meetingLifecycleStatus: "feedback_requested",
      feedbackTokens,
      feedbackStatus: match.feedbackStatus || "waiting",
      feedbackRequestSms: {
        results,
        feedbackTokens,
        sentAtClient: nowClient,
      },
      postMeeting: {
        estimatedEndAtClient,
        feedbackDueAtClient,
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();

  return {
    results,
    feedbackTokens,
    sentAtClient: nowClient,
    estimatedEndAtClient,
    feedbackDueAtClient,
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
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("[TwoWeeksReminder] LMS failed", error.response?.data || error.message);

    return {
      status: "failed",
      phone,
      errorMessage: error.response?.data || error.message,
      failedAtClient: new Date().toISOString(),
    };
  }
}

async function sendReminderToPair({ match, type }) {
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
  const subject = type === "dayBefore" ? "투윅스 내일 만남 안내" : "투윅스 만남 2시간 전 안내";

  const results = {
    male: await sendLmsDirect({
      to: getApplicationPhone(male),
      subject,
      message: buildReminderMessage({
        application: male,
        finalMeeting,
        type,
        counterpartNote: notes?.[female.id]?.note || "",
      }),
    }),
    female: await sendLmsDirect({
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

exports.sendTwoWeeksMeetingReminders = onSchedule(
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
    const nowKstKey = toKstDateKey(nowMs);
    const nowKstHour = getKstHour(nowMs);

    const snap = await db
      .collection("twoweeksMatches")
      .where("status", "==", "confirmed")
      .limit(200)
      .get();

    const jobs = [];

    snap.forEach((doc) => {
      const match = { id: doc.id, ...doc.data() };
      const finalMeeting = getFinalMeeting(match);
      const meetingMs = getMeetingStartMs(finalMeeting);
      const attendanceReadyForReminders =
        match.attendanceStatus === "both_confirmed" ||
        Boolean(match.finalAttendanceGuideSms?.sentAtClient);

      if (!meetingMs) return;

      const meetingKstKey = toKstDateKey(meetingMs);
      const dayBeforeKstKey = toKstDateKey(meetingMs - 24 * 60 * 60 * 1000);
      const reminders = match.reminders || {};

      const shouldSendDayBefore =
        attendanceReadyForReminders &&
        !reminders.dayBeforeSentAtClient &&
        nowKstKey === dayBeforeKstKey &&
        nowKstHour >= 19;

      const shouldSendTwoHoursBefore =
        attendanceReadyForReminders &&
        !reminders.twoHoursBeforeSentAtClient &&
        nowKstKey === meetingKstKey &&
        nowMs >= meetingMs - 2 * 60 * 60 * 1000 &&
        nowMs < meetingMs;

      // 기본 만남 60분 + 휴식 2시간 후 피드백 요청
      // 피드백 요청은 참석확인 여부와 무관하게 발송합니다.
      // 그래야 한쪽이 참석확인을 누르지 않았거나 실제 노쇼였던 경우도 피드백/신고를 받을 수 있습니다.
      const feedbackDueMs = getPostMeetingFeedbackMs(finalMeeting);
      const feedbackAlreadyHandled = isFeedbackRequestAlreadyHandled(match);
      const shouldSendFeedbackRequest =
        !feedbackAlreadyHandled &&
        feedbackDueMs &&
        nowMs >= feedbackDueMs;

      const shouldMarkPastMeetingCompleted =
        feedbackAlreadyHandled &&
        nowMs >= feedbackDueMs &&
        match.meetingLifecycleStatus !== "feedback_requested" &&
        match.meetingStatus !== "feedback_requested";

      if (shouldSendDayBefore) {
        jobs.push(
          sendReminderToPair({ match, type: "dayBefore" }).then((result) =>
            db.collection("twoweeksMatches").doc(match.id).set(
              {
                reminders: {
                  dayBeforeSentAt: admin.firestore.FieldValue.serverTimestamp(),
                  dayBeforeSentAtClient: new Date().toISOString(),
                  dayBeforeResult: result,
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            )
          )
        );
      }

      if (shouldSendTwoHoursBefore) {
        jobs.push(
          sendReminderToPair({ match, type: "twoHoursBefore" }).then((result) =>
            db.collection("twoweeksMatches").doc(match.id).set(
              {
                reminders: {
                  twoHoursBeforeSentAt: admin.firestore.FieldValue.serverTimestamp(),
                  twoHoursBeforeSentAtClient: new Date().toISOString(),
                  twoHoursBeforeResult: result,
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            )
          )
        );
      }

      if (shouldSendFeedbackRequest) {
        jobs.push(
          sendFeedbackRequestToPair({ match }).then((result) =>
            db.collection("twoweeksMatches").doc(match.id).set(
              {
                feedbackTokens: result.feedbackTokens || {},
                feedbackRequestSms: result,
                feedbackStatus: match.feedbackStatus || "waiting",
                reminders: {
                  feedbackRequestSentAt: admin.firestore.FieldValue.serverTimestamp(),
                  feedbackRequestSentAtClient: new Date().toISOString(),
                  feedbackRequestResult: result.results || result,
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            )
          )
        );
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
