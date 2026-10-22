const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const { sendTwoWeeksAdminSms } = require("./twoWeeksAdminSms");
const { isParticipationEligible } = require("./twoWeeksDepositPolicy");
const { isMatchingRestricted } = require("./twoWeeksSanctionPolicy");
const { getTwoWeeksFeedbackPrivateData } = require("./twoWeeksFeedbackPrivateStore");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";
const REMINDER_AFTER_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_AFTER_MS = 48 * 60 * 60 * 1000;

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

function getName(application = {}) {
  return String(application?.basic?.name || application?.basic?.nickname || "신청자").trim();
}

function getSiteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVICE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://charmingsoup.com"
  ).replace(/\/$/, "");
}

function getFeedbackUrl(token = "") {
  return `${getSiteOrigin()}/2weeks/feedback?token=${encodeURIComponent(String(token || "").trim())}`;
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

function isDepositEligible(application = {}) {
  return isParticipationEligible(application?.deposit || {});
}

function getSubmittedMs(feedback = {}) {
  const clientMs = Date.parse(feedback?.submittedAtClient || "");
  if (!Number.isNaN(clientMs)) return clientMs;

  const ts = feedback?.submittedAt;
  if (ts?.toMillis) return ts.toMillis();
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;
  return 0;
}

function getFeedbackRequestedMs(match = {}) {
  const candidates = [
    match?.postMeeting?.feedbackRequestedAtClient,
    match?.feedbackRequestSms?.sentAtClient,
    match?.postMeeting?.feedbackDueAtClient,
  ];

  for (const value of candidates) {
    const parsed = Date.parse(value || "");
    if (!Number.isNaN(parsed)) return parsed;
  }

  const ts = match?.postMeeting?.feedbackRequestedAt;
  if (ts?.toMillis) return ts.toMillis();
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;
  return 0;
}

function getFeedbackDeadlineMs(match = {}) {
  const explicit = Date.parse(match?.postMeeting?.feedbackDeadlineAtClient || "");
  if (!Number.isNaN(explicit)) return explicit;
  const requestedMs = getFeedbackRequestedMs(match);
  return requestedMs ? requestedMs + TIMEOUT_AFTER_MS : 0;
}

function formatKstDeadline(ms) {
  if (!ms) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

function getParticipantIds(match = {}) {
  return [match.maleApplicationId, match.femaleApplicationId].filter(Boolean);
}

function getContinueMeetingIntent(feedback = {}) {
  return String(feedback?.continueMeetingIntent || feedback?.meetAgainIntent || "");
}

function hasContactShareConsent(feedback = {}) {
  if (feedback?.meetingResult !== "met") return false;
  const intent = getContinueMeetingIntent(feedback);
  if (typeof feedback?.contactShareConsent === "boolean") {
    return intent === "yes" && feedback.contactShareConsent;
  }
  return intent === "yes";
}

function buildAutomaticNextPatch({ application = {}, matchId = "", nowClient = "" }) {
  const deleteField = admin.firestore.FieldValue.delete();
  const common = {
    currentProposal: deleteField,
    schedule: deleteField,
    scheduleStatus: "not_started",
    meetingStatus: "not_started",
    photoRevealStatus: "hidden",
    lastCompletedMatchId: matchId,
    lastCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastCompletedAtClient: nowClient,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!isDepositEligible(application)) {
    return {
      ...common,
      matchingStatus: "paused",
      nextRoundStatus: "top_up_required",
      matchingAvailability: "paused",
      matchingPauseReason: "top_up_required",
    };
  }

  if (isMatchingRestricted(application)) {
    return {
      ...common,
      matchingStatus: "paused",
      nextRoundStatus: "sanction_restricted",
      matchingAvailability: "paused",
      matchingPauseReason: "sanction_restricted",
    };
  }

  return {
    ...common,
    matchingStatus: "not_started",
    nextRoundStatus: "ready",
    matchingAvailability: "active",
    matchingPauseReason: admin.firestore.FieldValue.delete(),
  };
}

function getAutomaticNextRequestStatus(application = {}) {
  if (!isDepositEligible(application)) return "top_up_required";
  return isMatchingRestricted(application) ? "sanction_restricted" : "queued";
}

async function sendLmsDirect({ to, message, subject = "투윅스 피드백 안내" }) {
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
        subject: String(subject).slice(0, 40),
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
      providerRequestId: String(response?.data?.requestId || ""),
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("[TwoWeeksFeedbackTimeout] LMS failed", error.response?.data || error.message);
    return { status: "failed", errorMessage: error.response?.data || error.message, failedAtClient: new Date().toISOString() };
  }
}

async function sendMissingFeedbackReminder({ match, applicationId, application }) {
  const token = match?.feedbackTokens?.[applicationId]?.token || "";
  const feedbackUrl = token ? getFeedbackUrl(token) : "";
  const deadlineMs = getFeedbackDeadlineMs(match);
  const message = [
    "[투윅스] 만남 피드백을 아직 확인하지 못했어요.",
    `${getName(application)}님, 피드백은 요청 후 48시간 이내 작성해주세요.`,
    deadlineMs ? `마감: ${formatKstDeadline(deadlineMs)}` : "",
    "기한 내 미응답은 이번 만남의 연락처 공개 의사가 없는 것으로 처리되어 연락처가 공개되지 않습니다.",
    "반복적인 미응답은 추후 매칭에 영향을 줄 수 있습니다.",
    "",
    feedbackUrl ? "피드백 남기기:" : "신청현황에서 피드백을 확인해주세요.",
    feedbackUrl,
  ].filter(Boolean).join("\n");

  return sendLmsDirect({ to: getPhone(application), message, subject: "투윅스 피드백 재안내" });
}

function buildPenaltyStats(application = {}, matchId = "", nowClient = "") {
  const current = application?.penaltyStats || {};
  return {
    ...current,
    feedbackNoResponseCount: Number(current.feedbackNoResponseCount || 0) + 1,
    lastFeedbackOverdueMatchId: matchId,
    lastFeedbackOverdueAtClient: nowClient,
    lastPenaltyReason: "feedback_no_response",
    lastPenaltyAt: admin.firestore.FieldValue.serverTimestamp(),
    lastPenaltyAtClient: nowClient,
    // 피드백 미응답만으로 다음 매칭을 막지는 않습니다. 반복 기록은 운영 참고용입니다.
    reviewStatus: "feedback_no_response_recorded",
  };
}

async function processPartialTimeout({ match, submittedApplicationId, missingApplicationId }) {
  const db = admin.firestore();
  const matchRef = db.collection("twoweeksMatches").doc(match.id);
  const submitterRef = db.collection("twoweeksApplications").doc(submittedApplicationId);
  const missingRef = db.collection("twoweeksApplications").doc(missingApplicationId);
  const privateFeedbackRef = db.collection("twoweeksFeedbackPrivate").doc(match.id);
  const nowClient = new Date().toISOString();
  let result = null;

  await db.runTransaction(async (tx) => {
    const [freshMatchSnap, privateFeedbackSnap, submitterSnap, missingSnap] = await Promise.all([
      tx.get(matchRef),
      tx.get(privateFeedbackRef),
      tx.get(submitterRef),
      tx.get(missingRef),
    ]);

    if (!freshMatchSnap.exists || !submitterSnap.exists || !missingSnap.exists) {
      result = { status: "skipped", reason: "APPLICATION_NOT_FOUND" };
      return;
    }

    const freshMatch = { id: freshMatchSnap.id, ...freshMatchSnap.data() };
    if (String(freshMatch.feedbackStatus || "") !== "partial") {
      result = { status: "skipped", reason: "ALREADY_PROCESSED" };
      return;
    }

    const freshFeedbacks = privateFeedbackSnap.data()?.feedbacks || freshMatch.feedbacks || {};
    const submittedFeedback = freshFeedbacks[submittedApplicationId] || null;
    if (!submittedFeedback || freshFeedbacks[missingApplicationId] || submittedFeedback.meetingResult !== "met") {
      result = { status: "skipped", reason: "FEEDBACK_CHANGED_OR_ISSUE" };
      return;
    }

    const submitter = { id: submitterSnap.id, ...submitterSnap.data() };
    const missing = { id: missingSnap.id, ...missingSnap.data() };

    tx.set(
      submitterRef,
      {
        ...buildAutomaticNextPatch({ application: submitter, matchId: freshMatch.id, nowClient }),
        lastFeedback: {
          matchId: freshMatch.id,
          status: "timeout_processed",
          meetingResult: submittedFeedback.meetingResult || "",
          continueMeetingIntent: getContinueMeetingIntent(submittedFeedback),
          contactShareConsent: hasContactShareConsent(submittedFeedback),
          meetingMood: submittedFeedback.meetingMood || "",
          discomfortReasons: Array.isArray(submittedFeedback.discomfortReasons) ? submittedFeedback.discomfortReasons : [],
          submittedAtClient: submittedFeedback.submittedAtClient || "",
        },
      },
      { merge: true }
    );

    tx.set(
      missingRef,
      {
        ...buildAutomaticNextPatch({ application: missing, matchId: freshMatch.id, nowClient }),
        penaltyStats: buildPenaltyStats(missing, freshMatch.id, nowClient),
      },
      { merge: true }
    );

    tx.set(
      matchRef,
      {
        feedbackStatus: "timeout_processed",
        contactOpenStatus: "hidden",
        nextRoundLifecycleStatus: "partial_timeout_auto_next",
        nextRoundRequests: {
          ...(freshMatch.nextRoundRequests || {}),
          [submittedApplicationId]: {
            ...(freshMatch.nextRoundRequests?.[submittedApplicationId] || {}),
            applicationId: submittedApplicationId,
            matchId: freshMatch.id,
            preference: "auto_next_matching",
            status: getAutomaticNextRequestStatus(submitter),
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAtClient: nowClient,
            processedBy: "feedback_timeout",
          },
          [missingApplicationId]: {
            ...(freshMatch.nextRoundRequests?.[missingApplicationId] || {}),
            applicationId: missingApplicationId,
            matchId: freshMatch.id,
            preference: "auto_next_matching_feedback_missing",
            status: getAutomaticNextRequestStatus(missing),
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAtClient: nowClient,
            processedBy: "feedback_timeout",
          },
        },
        feedbackFollowup: {
          ...(freshMatch.feedbackFollowup || {}),
          status: "timeout_processed",
          disposition: "contact_not_opened_due_to_feedback_timeout",
          submittedApplicationId,
          missingApplicationId,
          timedOutAt: admin.firestore.FieldValue.serverTimestamp(),
          timedOutAtClient: nowClient,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    result = { status: "processed", submitter, missing, submittedFeedback };
  });

  if (!result || result.status !== "processed") return result || { status: "skipped" };

  const [submitterSms, missingSms, adminSms] = await Promise.all([
    sendLmsDirect({
      to: getPhone(result.submitter),
      subject: "투윅스 매칭 결과",
      message: [
        "[투윅스] 매칭 결과가 도착했습니다.",
        `${getName(result.submitter)}님은 피드백을 정상 제출해주셨습니다.`,
        "상대 피드백이 기한 내 확인되지 않아 연락처 공개 없이 다음 매칭 대기로 자동 전환됩니다.",
        "",
        "결과보기:",
        getDashboardUrl(result.submitter),
      ].join("\n"),
    }),
    sendLmsDirect({
      to: getPhone(result.missing),
      subject: "투윅스 매칭 결과",
      message: [
        "[투윅스] 매칭 결과가 도착했습니다.",
        "피드백 제출 기한이 종료되었습니다.",
        `${getName(result.missing)}님, 이번 만남은 연락처 공개 의사가 없는 것으로 처리되어 연락처가 공개되지 않습니다.`,
        "피드백 미응답 기록은 운영 참고용으로 남습니다.",
        "이번 건으로 다음 매칭이 중지되지는 않으며, 조건이 충족되면 다음 매칭은 자동 진행됩니다.",
        "반복적인 미응답은 추후 매칭 우선순위에 영향을 줄 수 있습니다.",
        "",
        "결과보기:",
        getDashboardUrl(result.missing),
      ].join("\n"),
    }),
    sendTwoWeeksAdminSms({
      subject: "투윅스 피드백 미응답 처리",
      message: [
        "[투윅스] 피드백 48시간 미응답 자동처리",
        `제출: ${getName(result.submitter)} / 미응답: ${getName(result.missing)}`,
        "처리: 양쪽 모두 다음 매칭 자동 대기(예치금 미충족 시 제외)",
        `매칭ID: ${match.id}`,
      ].join("\n"),
    }),
  ]);

  await matchRef.set(
    {
      "feedbackFollowup.timeoutSms": { submitter: submitterSms, missing: missingSms, admin: adminSms },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { status: "processed", submittedApplicationId, missingApplicationId };
}

async function processNoFeedbackTimeout({ match, participantIds = [] }) {
  const db = admin.firestore();
  const matchRef = db.collection("twoweeksMatches").doc(match.id);
  const refs = participantIds.map((id) => db.collection("twoweeksApplications").doc(id));
  const privateFeedbackRef = db.collection("twoweeksFeedbackPrivate").doc(match.id);
  const nowClient = new Date().toISOString();
  let result = null;

  await db.runTransaction(async (tx) => {
    const [freshMatchSnap, privateFeedbackSnap, ...applicationSnaps] = await Promise.all([
      tx.get(matchRef),
      tx.get(privateFeedbackRef),
      ...refs.map((ref) => tx.get(ref)),
    ]);
    if (!freshMatchSnap.exists || applicationSnaps.some((snap) => !snap.exists)) {
      result = { status: "skipped", reason: "APPLICATION_NOT_FOUND" };
      return;
    }

    const freshMatch = { id: freshMatchSnap.id, ...freshMatchSnap.data() };
    const freshFeedbacks = privateFeedbackSnap.data()?.feedbacks || freshMatch.feedbacks || {};
    if (String(freshMatch.feedbackStatus || "") !== "waiting" || participantIds.some((id) => freshFeedbacks[id])) {
      result = { status: "skipped", reason: "FEEDBACK_CHANGED" };
      return;
    }

    const applications = applicationSnaps.map((snap) => ({ id: snap.id, ...snap.data() }));

    applications.forEach((application) => {
      tx.set(
        db.collection("twoweeksApplications").doc(application.id),
        {
          ...buildAutomaticNextPatch({ application, matchId: freshMatch.id, nowClient }),
          penaltyStats: buildPenaltyStats(application, freshMatch.id, nowClient),
        },
        { merge: true }
      );
    });

    tx.set(
      matchRef,
      {
        feedbackStatus: "timeout_processed",
        contactOpenStatus: "hidden",
        nextRoundLifecycleStatus: "no_feedback_timeout_auto_next",
        nextRoundRequests: Object.fromEntries(
          applications.map((application) => [
            application.id,
            {
              ...(freshMatch.nextRoundRequests?.[application.id] || {}),
              applicationId: application.id,
              matchId: freshMatch.id,
              preference: "auto_next_matching_feedback_missing",
              status: getAutomaticNextRequestStatus(application),
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
              processedAtClient: nowClient,
              processedBy: "feedback_timeout",
            },
          ])
        ),
        feedbackFollowup: {
          ...(freshMatch.feedbackFollowup || {}),
          status: "no_feedback_timeout_processed",
          disposition: "contact_not_opened_due_to_feedback_timeout",
          timedOutAt: admin.firestore.FieldValue.serverTimestamp(),
          timedOutAtClient: nowClient,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    result = { status: "processed", applications };
  });

  if (!result || result.status !== "processed") return result || { status: "skipped" };

  const userSmsResults = await Promise.all(
    result.applications.map((application) =>
      sendLmsDirect({
        to: getPhone(application),
        subject: "투윅스 매칭 결과",
        message: [
          "[투윅스] 매칭 결과가 도착했습니다.",
          "피드백 제출 기한이 종료되었습니다.",
          `${getName(application)}님, 이번 만남은 연락처 공개 의사가 없는 것으로 처리되어 연락처가 공개되지 않습니다.`,
          "피드백 미응답 기록은 운영 참고용으로 남습니다.",
          "이번 건으로 다음 매칭이 중지되지는 않으며, 조건이 충족되면 다음 매칭은 자동 진행됩니다.",
          "반복적인 미응답은 추후 매칭 우선순위에 영향을 줄 수 있습니다.",
          "",
          "결과보기:",
          getDashboardUrl(application),
        ].join("\n"),
      })
    )
  );

  const adminSms = await sendTwoWeeksAdminSms({
    subject: "투윅스 피드백 미응답 처리",
    message: [
      "[투윅스] 피드백 0/2 미응답 자동처리",
      `대상: ${result.applications.map(getName).join(" / ")}`,
      "처리: 양쪽 모두 다음 매칭 자동 대기(예치금 미충족 시 제외)",
      `매칭ID: ${match.id}`,
    ].join("\n"),
  });

  await matchRef.set(
    {
      "feedbackFollowup.timeoutSms": {
        users: Object.fromEntries(result.applications.map((application, index) => [application.id, userSmsResults[index]])),
        admin: adminSms,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { status: "processed", participantIds };
}

exports.processTwoWeeksFeedbackTimeouts = onSchedule(
  {
    region: REGION,
    schedule: "every 60 minutes",
    timeZone: "Asia/Seoul",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    const db = admin.firestore();
    const nowMs = Date.now();
    const snap = await db
      .collection("twoweeksMatches")
      .where("feedbackStatus", "in", ["waiting", "partial"])
      .limit(200)
      .get();
    const jobs = [];

    snap.forEach((docSnap) => {
      const match = { id: docSnap.id, ...docSnap.data() };
      const participantIds = getParticipantIds(match);
      if (participantIds.length !== 2) return;

      jobs.push((async () => {
      const privateData = await getTwoWeeksFeedbackPrivateData(db, match.id, match);
      const feedbacks = privateData.feedbacks || {};
      const feedbackTokens = privateData.feedbackTokens || {};
      const mergedMatch = { ...match, feedbacks, feedbackTokens };
      const submittedIds = participantIds.filter((id) => Boolean(feedbacks[id]));
      const missingIds = participantIds.filter((id) => !feedbacks[id]);

      // 노쇼/불참 이슈는 feedbackStatus=issue_reported로 전환되어 이 스케줄러에서 자동 처리하지 않습니다.
      if (submittedIds.some((id) => feedbacks[id]?.meetingResult && feedbacks[id]?.meetingResult !== "met")) return null;

      if (submittedIds.length === 1 && missingIds.length === 1) {
        const submittedApplicationId = submittedIds[0];
        const missingApplicationId = missingIds[0];
        const submittedFeedback = feedbacks[submittedApplicationId] || {};
        const submittedMs = getSubmittedMs(submittedFeedback);
        const requestedMs = getFeedbackRequestedMs(match);
        const timeoutBaseMs = requestedMs || submittedMs;
        if (!timeoutBaseMs) return;
        const elapsed = nowMs - timeoutBaseMs;

        return (async () => {
          const missingSnap = await db.collection("twoweeksApplications").doc(missingApplicationId).get();
          if (!missingSnap.exists) return null;
          const missingApplication = { id: missingSnap.id, ...missingSnap.data() };

          if (elapsed >= TIMEOUT_AFTER_MS) {
            return processPartialTimeout({ match: mergedMatch, submittedApplicationId, missingApplicationId });
          }

          const reminderSent = Boolean(match?.feedbackFollowup?.[missingApplicationId]?.reminderSentAtClient);
          if (elapsed >= REMINDER_AFTER_MS && !reminderSent) {
            const sms = await sendMissingFeedbackReminder({
              match: mergedMatch,
              applicationId: missingApplicationId,
              application: missingApplication,
            });
            await docSnap.ref.set(
              {
                feedbackFollowup: {
                  ...(match.feedbackFollowup || {}),
                  [missingApplicationId]: {
                    ...(match.feedbackFollowup?.[missingApplicationId] || {}),
                    reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
                    reminderSentAtClient: new Date().toISOString(),
                    reminderSms: sms,
                  },
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
            return { status: "reminded", matchId: match.id, missingApplicationId };
          }
          return null;
        })();
      }

      if (submittedIds.length === 0 && missingIds.length === 2) {
        const requestedMs = getFeedbackRequestedMs(match);
        if (!requestedMs) return;
        const elapsed = nowMs - requestedMs;

        return (async () => {
          if (elapsed >= TIMEOUT_AFTER_MS) {
            return processNoFeedbackTimeout({ match: mergedMatch, participantIds });
          }

          if (elapsed < REMINDER_AFTER_MS) return null;

          const applicationSnaps = await Promise.all(
            participantIds.map((id) => db.collection("twoweeksApplications").doc(id).get())
          );
          const applications = Object.fromEntries(
            applicationSnaps.filter((item) => item.exists).map((item) => [item.id, { id: item.id, ...item.data() }])
          );

          const updates = {};
          for (const applicationId of participantIds) {
            if (match?.feedbackFollowup?.[applicationId]?.reminderSentAtClient) continue;
            const application = applications[applicationId];
            if (!application) continue;
            const sms = await sendMissingFeedbackReminder({ match: mergedMatch, applicationId, application });
            updates[applicationId] = {
              ...(match.feedbackFollowup?.[applicationId] || {}),
              reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
              reminderSentAtClient: new Date().toISOString(),
              reminderSms: sms,
            };
          }

          if (Object.keys(updates).length) {
            await docSnap.ref.set(
              {
                feedbackFollowup: {
                  ...(match.feedbackFollowup || {}),
                  ...updates,
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          return { status: "reminded_both", matchId: match.id };
        })();
      }
      return null;
      })());
    });

    const results = await Promise.allSettled(jobs);
    const summary = results.reduce(
      (acc, item) => {
        if (item.status === "fulfilled") acc.fulfilled += 1;
        else acc.rejected += 1;
        return acc;
      },
      { fulfilled: 0, rejected: 0 }
    );

    logger.info("[TwoWeeksFeedbackTimeout] completed", summary);
    return summary;
  }
);
