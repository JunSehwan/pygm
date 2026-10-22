const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { isAdminUid } = require("./twoWeeksCallerAuth");
const { isParticipationEligible } = require("./twoWeeksDepositPolicy");
const { hasMatchingEligibleTwoWeeksProfilePhotos } = require("./twoWeeksProfilePhotoPolicy");
const { isMatchingRestricted, recommendSanction } = require("./twoWeeksSanctionPolicy");

if (!admin.apps.length) admin.initializeApp();

const REGION = "asia-northeast3";
const ALLOWED_ACTIONS = new Set([
  "record_no_show",
  "record_same_day_cancel",
  "warning",
  "restrict_next_round",
  "restrict_30_days",
  "long_term_restrict",
  "release",
  "exception",
  "require_deposit",
  "waive_deposit",
]);

function clean(value = "", max = 500) {
  return String(value || "").trim().slice(0, max);
}

function isApproved(application = {}) {
  return application.status === "approved" && application.reviewStatus === "approved";
}

function canReturnToPool(application = {}) {
  const pausedForSanction = application.matchingPauseReason === "sanction_restricted";
  return Boolean(
    isApproved(application) &&
    (application.matchingAvailability !== "paused" || pausedForSanction) &&
    !application?.currentProposal?.matchId &&
    !application?.currentProposal?.candidateApplicationId &&
    hasMatchingEligibleTwoWeeksProfilePhotos(application) &&
    isParticipationEligible(application.deposit || {}) &&
    !isMatchingRestricted(application)
  );
}

function buildRequiredDepositPatch(application = {}, adminUid = "", nowClient = "") {
  const deposit = application.deposit || {};
  const requiredBalance = Math.max(1, Number(deposit.requiredBalance || deposit.amount || 30000));
  const balance = Math.max(0, Number(deposit.balance || 0));
  const eligible = balance >= requiredBalance && deposit.status === "confirmed";
  return {
    "deposit.policy": "required",
    "deposit.waived": false,
    "deposit.amount": requiredBalance,
    "deposit.requiredBalance": requiredBalance,
    "deposit.balance": balance,
    "deposit.topUpRequiredAmount": Math.max(0, requiredBalance - balance),
    "deposit.status": eligible ? "confirmed" : "topup_required",
    "deposit.participationEligible": eligible,
    "deposit.policySource": "admin_after_violation",
    "deposit.policyUpdatedAt": admin.firestore.FieldValue.serverTimestamp(),
    "deposit.policyUpdatedAtClient": nowClient,
    "deposit.policyUpdatedByUid": adminUid,
  };
}

function buildWaivedDepositPatch(adminUid = "", nowClient = "") {
  return {
    "deposit.policy": "waived",
    "deposit.status": "waived",
    "deposit.waived": true,
    "deposit.amount": 0,
    "deposit.requiredBalance": 0,
    "deposit.balance": 0,
    "deposit.topUpRequiredAmount": 0,
    "deposit.participationEligible": true,
    "deposit.policySource": "admin_waiver",
    "deposit.policyUpdatedAt": admin.firestore.FieldValue.serverTimestamp(),
    "deposit.policyUpdatedAtClient": nowClient,
    "deposit.policyUpdatedByUid": adminUid,
  };
}

async function assertAdmin(request) {
  const uid = clean(request.auth?.uid, 160);
  if (!uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  if (!(await isAdminUid(uid))) throw new HttpsError("permission-denied", "관리자만 처리할 수 있습니다.");
  return uid;
}

const manageTwoWeeksMemberSanction = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    const adminUid = await assertAdmin(request);
    const data = request.data || {};
    const applicationId = clean(data.applicationId, 120);
    const action = clean(data.action, 80);
    const matchId = clean(data.matchId, 120);
    const memo = clean(data.memo, 500);
    const eventKey = clean(data.eventKey, 200);
    if (!applicationId || !ALLOWED_ACTIONS.has(action)) {
      throw new HttpsError("invalid-argument", "제재 처리 정보가 올바르지 않습니다.");
    }

    const db = admin.firestore();
    const applicationRef = db.collection("twoweeksApplications").doc(applicationId);
    const eventRef = eventKey
      ? db.collection("twoweeksSanctions").doc(`${applicationId}_${eventKey}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 220))
      : db.collection("twoweeksSanctions").doc();
    const nowClient = new Date().toISOString();
    let output = null;

    await db.runTransaction(async (tx) => {
      const [applicationSnap, duplicateSnap] = await Promise.all([
        tx.get(applicationRef),
        eventKey ? tx.get(eventRef) : Promise.resolve(null),
      ]);
      if (!applicationSnap.exists) throw new HttpsError("not-found", "회원을 찾을 수 없습니다.");
      if (duplicateSnap?.exists) {
        output = { ok: true, duplicate: true, summary: applicationSnap.data()?.sanctionSummary || {} };
        return;
      }

      const application = { id: applicationSnap.id, ...applicationSnap.data() };
      const current = application.sanctionSummary || {};
      let type = action;
      let next = { ...current };
      let patch = {};

      if (action === "record_no_show" || action === "record_same_day_cancel") {
        type = action === "record_no_show" ? "no_show" : "same_day_cancel";
        next = { ...current, ...recommendSanction(current, type, Date.now()) };
      } else if (action === "warning") {
        next = { ...current, status: "warning", warningCount: Number(current.warningCount || 0) + 1 };
      } else if (action === "restrict_next_round") {
        next = {
          ...current,
          status: "next_round_restricted",
          restrictionRemainingRounds: 1,
          restrictedUntilMs: Date.now() + 14 * 24 * 60 * 60 * 1000,
        };
      } else if (action === "restrict_30_days") {
        next = { ...current, status: "restricted_until", restrictedUntil: admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000) };
      } else if (action === "long_term_restrict") {
        next = { ...current, status: "long_term_restricted", needsAdminReview: true };
      } else if (action === "release") {
        next = { ...current, status: "released", restrictedUntil: null, restrictionRemainingRounds: 0, needsAdminReview: false, exceptionActive: false };
      } else if (action === "exception") {
        next = { ...current, status: "exception", restrictedUntil: null, restrictionRemainingRounds: 0, needsAdminReview: false, exceptionActive: true };
      } else if (action === "require_deposit") {
        patch = { ...patch, ...buildRequiredDepositPatch(application, adminUid, nowClient) };
      } else if (action === "waive_deposit") {
        patch = { ...patch, ...buildWaivedDepositPatch(adminUid, nowClient) };
      }

      next = {
        ...next,
        lastType: type,
        lastMatchId: matchId,
        lastMemo: memo,
        lastHandledByUid: adminUid,
        lastHandledAtClient: nowClient,
      };
      patch.sanctionSummary = {
        ...next,
        ...(next.restrictedUntilMs
          ? { restrictedUntil: admin.firestore.Timestamp.fromMillis(next.restrictedUntilMs) }
          : {}),
        lastHandledAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const preview = { ...application, sanctionSummary: next, deposit: { ...(application.deposit || {}) } };
      Object.entries(patch).forEach(([key, value]) => {
        if (key.startsWith("deposit.")) preview.deposit[key.slice(8)] = value;
      });

      if (isMatchingRestricted(preview)) {
        patch.matchingStatus = "paused";
        patch.nextRoundStatus = "sanction_restricted";
        patch.matchingAvailability = "paused";
        patch.matchingPauseReason = "sanction_restricted";
      } else if (["release", "exception", "waive_deposit"].includes(action) && canReturnToPool(preview)) {
        patch.matchingStatus = "not_started";
        patch.nextRoundStatus = "ready";
        patch.matchingAvailability = "active";
        patch.matchingPauseReason = admin.firestore.FieldValue.delete();
      } else if (["release", "exception"].includes(action) && !isParticipationEligible(preview.deposit)) {
        patch.matchingStatus = "paused";
        patch.nextRoundStatus = "top_up_required";
        patch.matchingAvailability = "paused";
        patch.matchingPauseReason = "top_up_required";
      } else if (action === "require_deposit" && !isParticipationEligible(preview.deposit)) {
        patch.matchingStatus = "paused";
        patch.nextRoundStatus = "top_up_required";
        patch.matchingAvailability = "paused";
        patch.matchingPauseReason = "top_up_required";
      }

      patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      tx.set(applicationRef, patch, { merge: true });
      tx.set(eventRef, {
        applicationId,
        type,
        action,
        matchId,
        occurredAt: admin.firestore.FieldValue.serverTimestamp(),
        occurredAtClient: nowClient,
        sanctionStatus: next.status || "none",
        sanctionEndAt: next.restrictedUntil || null,
        adminMemo: memo,
        appliedByUid: adminUid,
        exception: action === "exception",
      });
      output = { ok: true, duplicate: false, summary: next, eventId: eventRef.id };
    });

    return output || { ok: true };
  }
);

const getTwoWeeksSanctionHistory = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    await assertAdmin(request);
    const applicationId = clean(request.data?.applicationId, 120);
    if (!applicationId) throw new HttpsError("invalid-argument", "회원 정보가 필요합니다.");

    const snap = await admin.firestore().collection("twoweeksSanctions")
      .where("applicationId", "==", applicationId)
      .limit(100)
      .get();
    const history = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(b.occurredAtClient || "").localeCompare(String(a.occurredAtClient || "")));
    return { history };
  }
);

const releaseExpiredTwoWeeksSanctions = onSchedule(
  {
    region: REGION,
    schedule: "every 60 minutes",
    timeZone: "Asia/Seoul",
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async () => {
    const db = admin.firestore();
    const snap = await db.collection("twoweeksApplications")
      .where("matchingPauseReason", "==", "sanction_restricted")
      .limit(200)
      .get();
    const nowMs = Date.now();

    for (const doc of snap.docs) {
      const application = { id: doc.id, ...doc.data() };
      const summary = application.sanctionSummary || {};
      const endMs = Number(summary.restrictedUntilMs || 0) ||
        (typeof summary.restrictedUntil?.toMillis === "function" ? summary.restrictedUntil.toMillis() : 0);
      if (!endMs || endMs > nowMs || isMatchingRestricted(application, nowMs)) continue;

      const nextSummary = {
        ...summary,
        status: "released",
        restrictionRemainingRounds: 0,
        needsAdminReview: false,
        autoReleasedAt: admin.firestore.FieldValue.serverTimestamp(),
        autoReleasedAtClient: new Date(nowMs).toISOString(),
      };
      const preview = { ...application, sanctionSummary: nextSummary };
      const patch = {
        sanctionSummary: nextSummary,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (canReturnToPool(preview)) {
        patch.matchingStatus = "not_started";
        patch.nextRoundStatus = "ready";
        patch.matchingAvailability = "active";
        patch.matchingPauseReason = admin.firestore.FieldValue.delete();
      }
      await doc.ref.set(patch, { merge: true });
    }
  }
);

module.exports = {
  getTwoWeeksSanctionHistory,
  manageTwoWeeksMemberSanction,
  releaseExpiredTwoWeeksSanctions,
};
