const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { isParticipationEligible } = require("./twoWeeksDepositPolicy");
const { isMatchingRestricted } = require("./twoWeeksSanctionPolicy");
const {
  TWOWEEKS_MIN_PROFILE_PHOTOS,
  hasMatchingEligibleTwoWeeksProfilePhotos,
} = require("./twoWeeksProfilePhotoPolicy");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";

function safeString(value = "") {
  return String(value || "").trim();
}

function isDepositEligible(application = {}) {
  return isParticipationEligible(application?.deposit || {});
}

function hasActiveMatch(application = {}) {
  const matchingStatus = safeString(application?.matchingStatus);
  const activeStatuses = new Set(["proposed", "accepted", "mutualAccepted", "confirmed"]);
  if (activeStatuses.has(matchingStatus)) return true;

  const proposal = application?.currentProposal || {};
  return Boolean(proposal?.matchId || proposal?.candidateApplicationId);
}

function assertCanResume(application = {}) {
  if (hasActiveMatch(application)) {
    throw new HttpsError("failed-precondition", "진행 중인 매칭이 있어 상태를 변경할 수 없습니다.");
  }

  const nextRoundStatus = safeString(application?.nextRoundStatus);
  const blockedStatuses = new Set([
    "top_up_required",
    "refund_requested",
    "refunded",
    "feedback_overdue",
    "admin_review",
    "sanction_restricted",
  ]);
  if (blockedStatuses.has(nextRoundStatus)) {
    throw new HttpsError("failed-precondition", "현재는 운영 확인 또는 예치금 처리가 먼저 필요합니다.");
  }

  if (!isDepositEligible(application)) {
    throw new HttpsError("failed-precondition", "다음 매칭을 위해 예치금을 먼저 확인해주세요.");
  }

  if (isMatchingRestricted(application)) {
    throw new HttpsError("failed-precondition", "현재 당일취소·노쇼 제재가 적용되어 매칭을 재개할 수 없습니다. 운영자에게 문의해주세요.");
  }

  if (!hasMatchingEligibleTwoWeeksProfilePhotos(application)) {
    throw new HttpsError(
      "failed-precondition",
      `다음 매칭을 시작하려면 프로필 사진을 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장 등록해주세요. 단, 정책 적용 전에 이미 승인된 1~2장 프로필은 기존 승인 상태로 이용할 수 있습니다.`
    );
  }

  if (safeString(application?.reviewStatus) !== "approved" || safeString(application?.status) !== "approved") {
    throw new HttpsError("failed-precondition", "승인된 회원만 매칭을 다시 시작할 수 있습니다.");
  }
}

const setTwoWeeksMatchingAvailability = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

    const data = request.data || {};
    const applicationId = safeString(data.applicationId);
    const action = safeString(data.action);

    if (!applicationId || !["pause", "resume"].includes(action)) {
      throw new HttpsError("invalid-argument", "매칭 상태 변경 정보가 올바르지 않습니다.");
    }

    await assertApplicationOwner(request, applicationId, { allowAdmin: false });

    const db = admin.firestore();
    const ref = db.collection("twoweeksApplications").doc(applicationId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpsError("not-found", "신청 정보를 찾을 수 없습니다.");

    const application = { id: snap.id, ...snap.data() };

    if (hasActiveMatch(application)) {
      throw new HttpsError("failed-precondition", "진행 중인 매칭이 있어 상태를 변경할 수 없습니다.");
    }

    const nowClient = new Date().toISOString();

    if (action === "resume") {
      assertCanResume(application);
      const batch = db.batch();
      const lastCompletedMatchId = safeString(application?.lastCompletedMatchId);
      const lastMutualContactMatchId = safeString(application?.lastMutualContactMatchId);
      const lastClosedContactMatchId = safeString(application?.lastClosedContactMatchId);
      const contactWasOpen =
        safeString(application?.contactOpenStatus) === "mutual_open" ||
        safeString(application?.nextRoundStatus) === "contact_connected";
      // 매칭 재개는 현재 연락처 노출만 닫습니다. 과거에 서로 연결됐다는 결과 이력은 지우지 않습니다.
      // 구버전에서 이미 재개되어 lastMutualContactMatchId가 삭제된 경우에는
      // lastClosedContactMatchId를 이용해 결과 스냅샷을 복원합니다.
      const contactMatchId =
        lastMutualContactMatchId ||
        lastClosedContactMatchId ||
        (contactWasOpen ? lastCompletedMatchId : "");
      const hadMutualConnection = Boolean(contactMatchId);

      batch.set(
        ref,
        {
          matchingStatus: "not_started",
          nextRoundStatus: "ready",
          matchingAvailability: "active",
          matchingPauseReason: admin.firestore.FieldValue.delete(),
          ...(hadMutualConnection ? { lastMutualContactMatchId: contactMatchId } : {}),
          ...(contactWasOpen
            ? {
                contactOpenStatus: "hidden",
                lastClosedContactMatchId: contactMatchId || lastCompletedMatchId || "",
                contactClosedAt: admin.firestore.FieldValue.serverTimestamp(),
                contactClosedAtClient: nowClient,
              }
            : {}),
          resumedAt: admin.firestore.FieldValue.serverTimestamp(),
          resumedAtClient: nowClient,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (lastCompletedMatchId) {
        batch.set(
          db.collection("twoweeksMatches").doc(lastCompletedMatchId),
          {
            nextRoundRequests: {
              [applicationId]: {
                applicationId,
                matchId: lastCompletedMatchId,
                preference: "resume_matching",
                status: "queued",
                availabilityUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                availabilityUpdatedAtClient: nowClient,
                processedBy: "user_matching_availability",
              },
            },
            ...(hadMutualConnection && contactMatchId === lastCompletedMatchId
              ? {
                  connectionOutcome: {
                    status: "mutual_connected",
                    mutualContactConsent: true,
                    determinedAt: admin.firestore.FieldValue.serverTimestamp(),
                    determinedAtClient: nowClient,
                    source: "matching_resume_backfill",
                  },
                }
              : {}),
            ...(contactWasOpen && contactMatchId === lastCompletedMatchId
              ? {
                  contactVisibilityByApplicationId: {
                    [applicationId]: {
                      status: "hidden",
                      reason: "matching_resumed",
                      closedAt: admin.firestore.FieldValue.serverTimestamp(),
                      closedAtClient: nowClient,
                    },
                  },
                }
              : {}),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      if (hadMutualConnection && contactMatchId !== lastCompletedMatchId) {
        batch.set(
          db.collection("twoweeksMatches").doc(contactMatchId),
          {
            connectionOutcome: {
              status: "mutual_connected",
              mutualContactConsent: true,
              determinedAt: admin.firestore.FieldValue.serverTimestamp(),
              determinedAtClient: nowClient,
              source: "matching_resume_backfill",
            },
            ...(contactWasOpen
              ? {
                  contactVisibilityByApplicationId: {
                    [applicationId]: {
                      status: "hidden",
                      reason: "matching_resumed",
                      closedAt: admin.firestore.FieldValue.serverTimestamp(),
                      closedAtClient: nowClient,
                    },
                  },
                }
              : {}),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      await batch.commit();
      return { ok: true, action, matchingStatus: "not_started", nextRoundStatus: "ready" };
    }

    const blockedPauseStatuses = new Set(["refund_requested", "refunded", "feedback_overdue", "admin_review", "top_up_required", "sanction_restricted"]);
    if (blockedPauseStatuses.has(safeString(application?.nextRoundStatus))) {
      throw new HttpsError("failed-precondition", "현재는 운영 확인 또는 예치금 처리가 먼저 필요합니다.");
    }

    const batch = db.batch();
    batch.set(
      ref,
      {
        matchingStatus: "paused",
        nextRoundStatus: "user_paused",
        matchingAvailability: "paused",
        matchingPauseReason: "user_choice",
        pausedAt: admin.firestore.FieldValue.serverTimestamp(),
        pausedAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const lastCompletedMatchId = safeString(application?.lastCompletedMatchId);
    if (lastCompletedMatchId) {
      batch.set(
        db.collection("twoweeksMatches").doc(lastCompletedMatchId),
        {
          nextRoundRequests: {
            [applicationId]: {
              applicationId,
              matchId: lastCompletedMatchId,
              preference: "pause_until_resume",
              status: "user_paused",
              availabilityUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              availabilityUpdatedAtClient: nowClient,
              processedBy: "user_matching_availability",
            },
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    return { ok: true, action, matchingStatus: "paused", nextRoundStatus: "user_paused" };
  }
);

module.exports = { setTwoWeeksMatchingAvailability };
