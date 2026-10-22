const admin = require("firebase-admin");
const crypto = require("crypto");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";
const FEEDBACK_WINDOW_MS = 48 * 60 * 60 * 1000;

const MEETING_RESULTS = new Set(["met", "counterpart_no_show", "self_no_show"]);
const CONTINUE_OPTIONS = new Set(["yes", "no"]);
const MOOD_OPTIONS = new Set(["good", "neutral", "disappointing", "uncomfortable"]);
const DISCOMFORT_OPTIONS = new Set([
  "rude_behavior",
  "profile_mismatch",
  "excessive_alcohol_smoking",
  "safety_concern",
  "other",
]);
const NO_SHOW_OPTIONS = new Set(["no_contact_absent", "late_too_long", "could_not_find", "other"]);
const ARRIVAL_OPTIONS = new Set(["arrived_before_time", "arrived_on_time", "arrived_late"]);
const SELF_NO_SHOW_REASONS = new Set(["urgent_schedule", "health", "mistake", "changed_mind", "other"]);

function cleanText(value = "", max = 500) {
  return String(value || "").trim().slice(0, max);
}

function hashFeedbackToken(token = "") {
  return crypto.createHash("sha256").update(String(token || "").trim()).digest("hex");
}

function secureTokenEquals(left = "", right = "") {
  const leftBuffer = Buffer.from(String(left || "").trim());
  const rightBuffer = Buffer.from(String(right || "").trim());
  if (!leftBuffer.length || leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseMs(value) {
  if (!value) return 0;
  if (value?.toMillis) return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getFeedbackRequestedMs(match = {}) {
  const values = [
    match?.postMeeting?.feedbackRequestedAtClient,
    match?.feedbackRequestSms?.sentAtClient,
    match?.postMeeting?.feedbackDueAtClient,
  ];
  for (const value of values) {
    const parsed = parseMs(value);
    if (parsed) return parsed;
  }
  return parseMs(match?.postMeeting?.feedbackRequestedAt);
}

function getFeedbackDeadlineMs(match = {}) {
  const explicit = parseMs(match?.postMeeting?.feedbackDeadlineAtClient);
  if (explicit) return explicit;
  const requestedMs = getFeedbackRequestedMs(match);
  return requestedMs ? requestedMs + FEEDBACK_WINDOW_MS : 0;
}

function getContinueIntent(feedback = {}) {
  return String(feedback?.continueMeetingIntent || feedback?.meetAgainIntent || "");
}

function hasContactConsent(feedback = {}) {
  if (feedback?.meetingResult !== "met") return false;
  const intent = getContinueIntent(feedback);
  if (typeof feedback?.contactShareConsent === "boolean") {
    return intent === "yes" && feedback.contactShareConsent;
  }
  return intent === "yes";
}

function makeFeedbackSummary(feedbacks = {}) {
  const list = Object.values(feedbacks || {}).filter(Boolean);
  const issueList = list.filter((item) => item.meetingResult && item.meetingResult !== "met");
  const metList = list.filter((item) => item.meetingResult === "met");
  const continueList = list.filter((item) => getContinueIntent(item) === "yes");

  return {
    submittedCount: list.length,
    metCount: metList.length,
    issueCount: issueList.length,
    continueMeetingCount: continueList.length,
    needsAdminReview: issueList.length > 0,
    mutualInterest: list.length >= 2 && list.every((item) => hasContactConsent(item)),
    mutualContactConsent: list.length >= 2 && list.every((item) => hasContactConsent(item)),
    discomfortCount: list.filter((item) => item.meetingMood === "uncomfortable").length,
    lastSubmittedAtClient: new Date().toISOString(),
  };
}

function makeFeedbackStatus(feedbacks = {}) {
  const summary = makeFeedbackSummary(feedbacks);
  if (summary.needsAdminReview) return "issue_reported";
  if (summary.submittedCount >= 2) return "completed";
  if (summary.submittedCount >= 1) return "partial";
  return "waiting";
}

function validatePayload(payload = {}) {
  const meetingResult = String(payload.meetingResult || "");
  if (!MEETING_RESULTS.has(meetingResult)) {
    throw new HttpsError("invalid-argument", "오늘 실제 만남 여부를 확인해주세요.");
  }

  if (meetingResult === "met") {
    const continueMeetingIntent = String(payload.continueMeetingIntent || "");
    if (!CONTINUE_OPTIONS.has(continueMeetingIntent)) {
      throw new HttpsError("invalid-argument", "추후 만남 의향을 선택해주세요.");
    }
    if (!MOOD_OPTIONS.has(String(payload.meetingMood || ""))) {
      throw new HttpsError("invalid-argument", "오늘 만남 느낌을 선택해주세요.");
    }
    if (payload.meetingMood === "uncomfortable") {
      const reasons = Array.isArray(payload.discomfortReasons) ? payload.discomfortReasons : [];
      if (!reasons.length || reasons.some((value) => !DISCOMFORT_OPTIONS.has(String(value)))) {
        throw new HttpsError("invalid-argument", "불편했던 이유를 하나 이상 선택해주세요.");
      }
      if (reasons.includes("other") && !cleanText(payload.discomfortOtherText, 300)) {
        throw new HttpsError("invalid-argument", "기타 불편 사유를 간단히 적어주세요.");
      }
    }
  }

  if (meetingResult === "counterpart_no_show") {
    if (!NO_SHOW_OPTIONS.has(String(payload?.noShow?.situation || ""))) {
      throw new HttpsError("invalid-argument", "상대가 오지 않은 상황을 선택해주세요.");
    }
    if (!ARRIVAL_OPTIONS.has(String(payload?.noShow?.arrivalStatus || ""))) {
      throw new HttpsError("invalid-argument", "내 도착 상황을 선택해주세요.");
    }
  }

  if (meetingResult === "self_no_show" && !SELF_NO_SHOW_REASONS.has(String(payload?.selfNoShow?.reason || ""))) {
    throw new HttpsError("invalid-argument", "참석하지 못한 이유를 선택해주세요.");
  }
}

function sanitizePayload(payload = {}, { matchId, applicationId, counterpartApplicationId, nowClient }) {
  const meetingResult = String(payload.meetingResult || "");
  const continueMeetingIntent = meetingResult === "met" ? String(payload.continueMeetingIntent || "") : "";
  const meetingMood = meetingResult === "met" ? String(payload.meetingMood || "") : "";
  const discomfortReasons =
    meetingResult === "met" && meetingMood === "uncomfortable"
      ? (Array.isArray(payload.discomfortReasons) ? payload.discomfortReasons : []).filter((value) => DISCOMFORT_OPTIONS.has(String(value)))
      : [];

  return {
    version: 4,
    matchId,
    applicationId,
    counterpartApplicationId,
    meetingResult,
    continueMeetingIntent,
    contactShareConsent:
      meetingResult === "met" && continueMeetingIntent === "yes",
    meetAgainIntent: continueMeetingIntent,
    meetingMood,
    discomfortReasons,
    discomfortOtherText:
      discomfortReasons.includes("other") ? cleanText(payload.discomfortOtherText, 300) : "",
    memo: meetingResult === "met" ? cleanText(payload.memo, 500) : "",
    noShow:
      meetingResult === "counterpart_no_show"
        ? {
            situation: String(payload?.noShow?.situation || ""),
            waitedMinutes: Math.max(0, Math.min(180, Number(payload?.noShow?.waitedMinutes || 0))),
            arrivalStatus: String(payload?.noShow?.arrivalStatus || ""),
            memo: cleanText(payload?.noShow?.memo, 500),
            reviewStatus: "needs_admin_review",
          }
        : null,
    selfNoShow:
      meetingResult === "self_no_show"
        ? {
            reason: String(payload?.selfNoShow?.reason || ""),
            memo: cleanText(payload?.selfNoShow?.memo, 500),
            reviewStatus: "needs_admin_review",
          }
        : null,
    postMeetingMatchingMode: meetingResult === "met" ? "auto_after_feedback" : "admin_review",
    issueStatus: meetingResult === "met" ? "none" : "needs_admin_review",
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    submittedAtClient: nowClient,
  };
}

exports.submitTwoWeeksFeedback = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "피드백 제출을 위해 인증이 필요합니다.");

    const token = String(request.data?.token || "").trim();
    const payload = request.data?.feedback || {};
    if (token.length < 20 || token.length > 200) {
      throw new HttpsError("invalid-argument", "피드백 링크가 올바르지 않습니다.");
    }
    validatePayload(payload);

    const db = admin.firestore();
    const accessSnap = await db.collection("twoweeksFeedbackAccess").doc(hashFeedbackToken(token)).get();
    if (!accessSnap.exists) {
      throw new HttpsError("not-found", "만료되었거나 올바르지 않은 피드백 링크입니다.");
    }

    const access = accessSnap.data() || {};
    const matchId = String(access.matchId || "").trim();
    const applicationId = String(access.applicationId || "").trim();
    if (!matchId || !applicationId) {
      throw new HttpsError("not-found", "피드백 대상 만남을 찾지 못했습니다.");
    }

    // 링크 토큰만 아는 다른 사용자가 피드백을 대신 제출하지 못하도록
    // 현재 인증 세션이 실제 신청자 소유인지 한 번 더 확인한다.
    await assertApplicationOwner(request, applicationId, { allowAdmin: false });

    const matchRef = db.collection("twoweeksMatches").doc(matchId);
    const privateRef = db.collection("twoweeksFeedbackPrivate").doc(matchId);
    let response = null;

    await db.runTransaction(async (tx) => {
      const [matchSnap, privateSnap] = await Promise.all([
        tx.get(matchRef),
        tx.get(privateRef),
      ]);
      if (!matchSnap.exists) throw new HttpsError("not-found", "피드백 대상 만남을 찾지 못했습니다.");

      const match = { id: matchSnap.id, ...matchSnap.data() };
      const privateData = privateSnap.exists ? privateSnap.data() || {} : {};
      const feedbackTokens = privateData.feedbackTokens || match.feedbackTokens || {};
      const feedbacks = privateData.feedbacks || match.feedbacks || {};
      const tokenEntry = feedbackTokens?.[applicationId] || {};
      if (!secureTokenEquals(String(tokenEntry.token || ""), token)) {
        throw new HttpsError("permission-denied", "만료되었거나 올바르지 않은 피드백 링크입니다.");
      }

      const participantIds = [match.maleApplicationId, match.femaleApplicationId].filter(Boolean);
      if (!participantIds.includes(applicationId)) {
        throw new HttpsError("permission-denied", "해당 만남의 참여자가 아닙니다.");
      }

      if (feedbacks?.[applicationId]) {
        throw new HttpsError("already-exists", "이미 제출된 피드백은 수정할 수 없습니다.");
      }

      if (["timeout_processed", "reviewed"].includes(String(match.feedbackStatus || ""))) {
        throw new HttpsError("failed-precondition", "피드백 제출 기한이 종료되었습니다.");
      }

      const deadlineMs = getFeedbackDeadlineMs(match);
      if (deadlineMs && Date.now() > deadlineMs) {
        throw new HttpsError(
          "deadline-exceeded",
          "피드백 제출 기한이 종료되었습니다. 이번 만남은 연락처 공개 없이 처리됩니다."
        );
      }

      const counterpartApplicationId =
        String(access.counterpartApplicationId || tokenEntry.counterpartApplicationId || "").trim() ||
        participantIds.find((id) => id !== applicationId) ||
        "";
      const nowClient = new Date().toISOString();
      const feedback = sanitizePayload(payload, {
        matchId,
        applicationId,
        counterpartApplicationId,
        nowClient,
      });
      const nextFeedbacks = { ...feedbacks, [applicationId]: feedback };
      const feedbackSummary = makeFeedbackSummary(nextFeedbacks);
      const feedbackStatus = makeFeedbackStatus(nextFeedbacks);
      const connectionOutcome =
        feedbackStatus === "completed"
          ? {
              status: feedbackSummary.mutualContactConsent ? "mutual_connected" : "not_connected",
              mutualContactConsent: feedbackSummary.mutualContactConsent === true,
              determinedAt: admin.firestore.FieldValue.serverTimestamp(),
              determinedAtClient: nowClient,
              source: "feedback_submission",
            }
          : null;

      tx.set(
        privateRef,
        {
          matchId,
          participantApplicationIds: participantIds,
          feedbacks: { [applicationId]: feedback },
          feedbackTokens: {
            [applicationId]: {
              ...tokenEntry,
              token: tokenEntry.token || token,
              applicationId,
              matchId,
              usedAt: admin.firestore.FieldValue.serverTimestamp(),
              usedAtClient: nowClient,
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAtClient: nowClient,
        },
        { merge: true }
      );

      tx.set(
        matchRef,
        {
          feedbackStatus,
          feedbackSummary,
          ...(connectionOutcome ? { connectionOutcome } : {}),
          feedbackSubmissions: {
            [applicationId]: {
              submitted: true,
              meetingResult: feedback.meetingResult,
              submittedAtClient: nowClient,
            },
          },
          feedbacks: admin.firestore.FieldValue.delete(),
          feedbackTokens: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      const feedbackForClient = { ...feedback };
      delete feedbackForClient.submittedAt;
      response = { ok: true, feedbackStatus, submittedAtClient: nowClient, feedback: feedbackForClient };
    });

    return response || { ok: true };
  }
);
