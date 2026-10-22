const admin = require("firebase-admin");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const {
  isParticipationEligible: isDepositEligible,
} = require("./twoWeeksDepositPolicy");
const { isMatchingRestricted } = require("./twoWeeksSanctionPolicy");
const { getTwoWeeksFeedbacks } = require("./twoWeeksFeedbackPrivateStore");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";

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

  // 기존 피드백은 '재만남 희망 시 연락처 공개' 안내 아래 수집되어 호환 처리합니다.
  return intent === "yes";
}

function makeFeedbackSummary(feedbacks = {}) {
  const list = Object.values(feedbacks || {}).filter(Boolean);
  const issueList = list.filter((item) => item.meetingResult && item.meetingResult !== "met");
  const metList = list.filter((item) => item.meetingResult === "met");
  const continueList = list.filter((item) => getContinueMeetingIntent(item) === "yes");
  const mutualContactConsent = list.length >= 2 && list.every((item) => hasContactShareConsent(item));

  return {
    submittedCount: list.length,
    metCount: metList.length,
    issueCount: issueList.length,
    continueMeetingCount: continueList.length,
    needsAdminReview: issueList.length > 0,
    mutualInterest: mutualContactConsent,
    mutualContactConsent,
    discomfortCount: list.filter((item) => item.meetingMood === "uncomfortable").length,
    lastSubmittedAtClient:
      list
        .map((item) => String(item.submittedAtClient || ""))
        .filter(Boolean)
        .sort()
        .pop() || "",
  };
}

function getFeedbackStatus(feedbacks = {}) {
  const summary = makeFeedbackSummary(feedbacks);
  if (summary.needsAdminReview) return "issue_reported";
  if (summary.submittedCount >= 2) return "completed";
  if (summary.submittedCount >= 1) return "partial";
  return "waiting";
}

function getCommonPostMeetingPatch({ matchId = "", nowClient = "" }) {
  const deleteField = admin.firestore.FieldValue.delete();
  return {
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
}

function buildPostMeetingPatch({ application = {}, matchId = "", nowClient = "", mutualContactConsent = false }) {
  const common = getCommonPostMeetingPatch({ matchId, nowClient });

  if (!isDepositEligible(application.deposit || {})) {
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

  // 상호 연락처 공개가 성립한 경우에만 새 매칭을 잠시 멈춥니다.
  if (mutualContactConsent) {
    return {
      ...common,
      matchingStatus: "paused",
      nextRoundStatus: "contact_connected",
      matchingAvailability: "paused",
      matchingPauseReason: "mutual_contact",
      pausedAt: admin.firestore.FieldValue.serverTimestamp(),
      pausedAtClient: nowClient,
    };
  }

  // 그 외 정상 만남은 다음 매칭 후보풀로 자동 복귀합니다.
  return {
    ...common,
    matchingStatus: "not_started",
    nextRoundStatus: "ready",
    matchingAvailability: "active",
    matchingPauseReason: admin.firestore.FieldValue.delete(),
  };
}

function getPostMeetingRequestStatus(application = {}, mutualContactConsent = false) {
  if (!isDepositEligible(application.deposit || {})) return "top_up_required";
  if (isMatchingRestricted(application)) return "sanction_restricted";
  return mutualContactConsent ? "contact_connected" : "queued";
}

async function pauseParticipantsForAdminReview({ db, participantIds = [], matchId = "", nowClient = "" }) {
  const deleteField = admin.firestore.FieldValue.delete();
  const batch = db.batch();

  participantIds.forEach((applicationId) => {
    batch.set(
      db.collection("twoweeksApplications").doc(applicationId),
      {
        currentProposal: deleteField,
        schedule: deleteField,
        matchingStatus: "paused",
        scheduleStatus: "not_started",
        meetingStatus: "not_started",
        photoRevealStatus: "hidden",
        nextRoundStatus: "admin_review",
        matchingAvailability: "paused",
        matchingPauseReason: "no_show_review",
        lastCompletedMatchId: matchId,
        lastCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastCompletedAtClient: nowClient,
        pausedAt: admin.firestore.FieldValue.serverTimestamp(),
        pausedAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();
}

exports.processTwoWeeksCompletedFeedback = onDocumentUpdated(
  {
    region: REGION,
    document: "twoweeksMatches/{matchId}",
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    const matchId = event.params.matchId;
    const participantIds = getParticipantIds(after);
    const db = admin.firestore();
    const feedbacks = await getTwoWeeksFeedbacks(db, matchId, after);
    const summary = makeFeedbackSummary(feedbacks);
    const terminalNoShowReview = new Set([
      "no_show_confirmed",
      "self_no_show_confirmed",
      "no_show_dismissed",
      "no_penalty_rematch",
    ]).has(String(after.noShowReviewStatus || ""));
    const feedbackStatus = terminalNoShowReview ? "reviewed" : getFeedbackStatus(feedbacks);
    const nowClient = new Date().toISOString();

    if (participantIds.length !== 2) return null;

    const beforeSignature = participantIds
      .map((id) => `${id}:${String(before.feedbackSubmissions?.[id]?.submittedAtClient || before.feedbacks?.[id]?.submittedAtClient || "")}`)
      .join("|");
    const afterSignature = participantIds
      .map((id) => `${id}:${String(after.feedbackSubmissions?.[id]?.submittedAtClient || feedbacks?.[id]?.submittedAtClient || "")}`)
      .join("|");
    const feedbackChanged = beforeSignature !== afterSignature;

    const terminalFeedbackStatus = String(after.feedbackStatus || "");
    const feedbackTimeoutProcessed = terminalFeedbackStatus === "timeout_processed";
    const canonicalNeedsWrite =
      !feedbackTimeoutProcessed &&
      (String(after.feedbackStatus || "") !== feedbackStatus ||
        Number(after.feedbackSummary?.submittedCount || 0) !== summary.submittedCount ||
        Boolean(after.feedbackSummary?.needsAdminReview) !== summary.needsAdminReview ||
        Boolean(after.feedbackSummary?.mutualContactConsent) !== summary.mutualContactConsent ||
        Number(after.feedbackSummary?.discomfortCount || 0) !== summary.discomfortCount);

    const matchRef = event.data.after.ref;

    if (canonicalNeedsWrite) {
      await matchRef.set(
        {
          feedbackStatus,
          feedbackSummary: summary,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    if (!feedbackChanged) return null;

    // 이미 관리자 판정이 끝난 노쇼/불참 건은 뒤늦은 피드백으로 다시 일시정지시키지 않습니다.
    if (summary.needsAdminReview && terminalNoShowReview) return null;

    // 노쇼/불참 신고가 접수되는 즉시 양쪽 모두 자동 다음 매칭을 멈추고 관리자 판정을 기다립니다.
    if (summary.needsAdminReview) {
      await Promise.all([
        pauseParticipantsForAdminReview({ db, participantIds, matchId, nowClient }),
        matchRef.set(
          {
            nextRoundLifecycleStatus: "admin_review",
            nextRoundRequests: Object.fromEntries(
              participantIds.map((applicationId) => [
                applicationId,
                {
                  ...(after.nextRoundRequests?.[applicationId] || {}),
                  applicationId,
                  matchId,
                  preference: "admin_review",
                  status: "admin_review",
                  processedAt: admin.firestore.FieldValue.serverTimestamp(),
                  processedAtClient: nowClient,
                  processedBy: "feedback_lifecycle_issue",
                },
              ])
            ),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        ),
      ]);
      return null;
    }

    const bothSubmitted = participantIds.every((applicationId) => Boolean(feedbacks[applicationId]));
    const bothMet = bothSubmitted && participantIds.every((applicationId) => feedbacks[applicationId]?.meetingResult === "met");
    if (!bothMet) return null;

    const allParticipantsProcessed = participantIds.every((applicationId) => {
      const request = after.nextRoundRequests?.[applicationId] || {};
      return Boolean(request.processedAtClient || request.processedByUid || request.processedBy);
    });
    if (allParticipantsProcessed) return null;

    const applicationSnaps = await Promise.all(
      participantIds.map((applicationId) => db.collection("twoweeksApplications").doc(applicationId).get())
    );

    const applications = Object.fromEntries(
      applicationSnaps
        .filter((snap) => snap.exists)
        .map((snap) => [snap.id, { id: snap.id, ...snap.data() }])
    );

    const batch = db.batch();
    const nextRoundRequests = {};
    const existingConnectionOutcome = after?.connectionOutcome || {};
    const connectionOutcomePatch = existingConnectionOutcome?.status
      ? {}
      : {
          connectionOutcome: {
            status: summary.mutualContactConsent ? "mutual_connected" : "not_connected",
            mutualContactConsent: summary.mutualContactConsent === true,
            determinedAt: admin.firestore.FieldValue.serverTimestamp(),
            determinedAtClient: nowClient,
            source: "feedback_lifecycle",
          },
        };

    participantIds.forEach((applicationId) => {
      const application = applications[applicationId];
      const feedback = feedbacks[applicationId];
      const existingRequest = after.nextRoundRequests?.[applicationId] || {};
      const alreadyProcessed = Boolean(
        existingRequest.processedAtClient || existingRequest.processedByUid || existingRequest.processedBy
      );
      if (!application || !feedback || alreadyProcessed) return;

      const patch = buildPostMeetingPatch({
        application,
        matchId,
        nowClient,
        mutualContactConsent: summary.mutualContactConsent,
      });
      const requestStatus = getPostMeetingRequestStatus(application, summary.mutualContactConsent);

      batch.set(
        db.collection("twoweeksApplications").doc(applicationId),
        {
          ...patch,
          ...(summary.mutualContactConsent
            ? {
                contactOpenStatus: "mutual_open",
                lastMutualContactMatchId: matchId,
              }
            : {}),
          lastFeedback: {
            matchId,
            status: "completed",
            meetingResult: feedback.meetingResult || "",
            continueMeetingIntent: getContinueMeetingIntent(feedback),
            contactShareConsent: hasContactShareConsent(feedback),
            meetingMood: feedback.meetingMood || "",
            discomfortReasons: Array.isArray(feedback.discomfortReasons) ? feedback.discomfortReasons : [],
            submittedAtClient: feedback.submittedAtClient || "",
          },
        },
        { merge: true }
      );

      nextRoundRequests[applicationId] = {
        ...existingRequest,
        applicationId,
        matchId,
        preference: summary.mutualContactConsent ? "mutual_contact_pause" : "auto_next_matching",
        status: requestStatus,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAtClient: nowClient,
        processedBy: "feedback_lifecycle",
      };
    });

    batch.set(
      matchRef,
      {
        feedbackStatus: "completed",
        feedbackSummary: summary,
        ...connectionOutcomePatch,
        ...(summary.mutualContactConsent
          ? {
              contactOpenStatus: "mutual_open",
              contactOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
              contactOpenedAtClient: nowClient,
            }
          : {}),
        nextRoundRequests,
        nextRoundLifecycleStatus: "processed",
        nextRoundProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
        nextRoundProcessedAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    logger.info("[TwoWeeksFeedbackLifecycle] post meeting processed", {
      matchId,
      participantIds,
      mutualContactConsent: summary.mutualContactConsent,
      nextMode: summary.mutualContactConsent ? "paused_after_contact" : "auto_next_matching",
    });

    return null;
  }
);
