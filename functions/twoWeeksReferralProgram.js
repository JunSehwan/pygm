"use strict";
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const crypto = require("crypto");
const { assertApplicationOwner, isAdminUid } = require("./twoWeeksCallerAuth");
const { assessFirstMeeting } = require("./twoWeeksReferralEligibility");
if (!admin.apps.length) admin.initializeApp();
const REGION = "asia-northeast3";
const sha = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
const db = () => admin.firestore();
const stamp = () => admin.firestore.FieldValue.serverTimestamp();
const clean = (value, limit = 100) => String(value || "").trim().slice(0, limit);
const DOC = "twoweeksReferralInvites";
const OWNER_DOC = "twoweeksReferralInviteOwners";

async function resolveInviteCode(code = "", excludedUid = "") {
  const v = clean(code, 80);
  if (!/^[A-Za-z0-9_-]{18,80}$/.test(v)) return null;
  const snap = await db().collection(DOC).doc(sha(v)).get();
  if (!snap.exists) return null;
  const row = snap.data() || {};
  if (row.disabled === true || row.code !== v || row.referrerUid === excludedUid) return null;
  const app = await db().collection("twoweeksApplications").doc(row.applicationId).get();
  if (!app.exists || app.data()?.status === "withdrawn" || app.data()?.withdrawal?.status === "completed" || app.data()?.uid !== row.referrerUid) return null;
  return { referrerUid: row.referrerUid, applicationId: row.applicationId, codeHash: sha(v) };
}

const createMyTwoWeeksInviteLink = onCall({ region: REGION }, async request => {
  const applicationId = clean(request.data?.applicationId, 120);
  const owner = await assertApplicationOwner(request, applicationId, { allowAdmin: false });
  // One stable code per application. Two simultaneous clicks cannot mint different codes.
  const ref = db().collection(OWNER_DOC).doc(applicationId);
  const record = await db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (snap.exists && snap.data()?.code) return snap.data();
    const code = crypto.randomBytes(20).toString("base64url");
    const inviteRef = db().collection(DOC).doc(sha(code));
    const value = { code, applicationId, referrerUid: owner.application.uid, createdAt: stamp(), disabled: false };
    tx.create(ref, value);
    tx.create(inviteRef, value);
    return value;
  });
  return { ok: true, url: `https://charmingsoup.com/2weeks/register?ref=${encodeURIComponent(record.code)}` };
});
// Only aggregate counters are returned. Invitee identities or meeting details are never exposed.
const getMyTwoWeeksReferralSummary = onCall({ region: REGION }, async request => {
  const applicationId = clean(request.data?.applicationId, 128);
  const owner = await assertApplicationOwner(request, applicationId, { allowAdmin: false });
  const ownerUid = clean(owner.application.uid, 128);
  if (!ownerUid) throw new HttpsError("failed-precondition", "회원정보를 확인할 수 없습니다.");
  const [invitees, rewards] = await Promise.all([
    db().collection("twoweeksApplications")
      .where("referral.referredByUserId", "==", ownerUid).limit(500).get(),
    db().collection("twoweeksReferralRewards")
      .where("referrerUid", "==", ownerUid).limit(500).get(),
  ]);
  const verified = new Set(invitees.docs.filter(d => {
    const item = d.data() || {};
    return item.referral?.status === "verified" && !item.testMode && !item.isDummy && item.uid !== ownerUid;
  }).map(d => d.id));
  const eligible = new Set();
  const paid = new Set();
  const pending = new Set();
  rewards.docs.forEach(doc => {
    const row = doc.data() || {};
    const inviteeId = clean(row.inviteeApplicationId || doc.id, 128);
    if (!verified.has(inviteeId)) return;
    if (row.firstCompletedMatchId && ["eligible", "approved", "paid"].includes(row.status)) eligible.add(inviteeId);
    if (row.status === "paid") paid.add(inviteeId);
    if (["eligible", "approved", "needs_review"].includes(row.status)) pending.add(inviteeId);
  });
  return {
    ok: true,
    joined: verified.size,
    firstMeetingCompleted: eligible.size,
    paid: paid.size,
    pending: pending.size,
    // Results are capped rather than leaking arbitrarily many records.
    hasMore: invitees.size === 500 || rewards.size === 500,
  };
});

async function requireAdmin(request) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  if (!await isAdminUid(request.auth.uid)) throw new HttpsError("permission-denied", "관리자만 처리할 수 있습니다.");
}
// No bonus is granted automatically. Conservative assessment: only unambiguous real meeting with two positive feedbacks.
const assessTwoWeeksReferralRewards = onCall({ region: REGION, timeoutSeconds: 120 }, async request => {
  await requireAdmin(request);
  const applicants = await db().collection("twoweeksApplications").where("referral.status", "==", "verified").limit(500).get();
  const outputs = [];
  for (const snap of applicants.docs) {
    const invitee = snap.data();
    if (invitee.isDummy || invitee.testMode || invitee.status === "withdrawn") continue;
    const referrerUid = clean(invitee.referral?.referredByUserId, 128);
    if (!referrerUid || referrerUid === invitee.uid) continue;
    const rewardRef = db().collection("twoweeksReferralRewards").doc(snap.id);
    const prev = await rewardRef.get();
    if (prev.exists && ["approved", "paid", "excluded"].includes(prev.data()?.status)) {
      outputs.push({ id: snap.id, ...prev.data() }); continue;
    }
    const matchSnap = await db().collection("twoweeksMatches").where("maleApplicationId", "==", snap.id).limit(50).get();
    const matchSnapF = await db().collection("twoweeksMatches").where("femaleApplicationId", "==", snap.id).limit(50).get();
    const matches = [...matchSnap.docs, ...matchSnapF.docs].map(m => ({ id: m.id, ...m.data() }));
    const eligibility = assessFirstMeeting(matches);
    if (!invitee.referral?.rewardEventSnapshot?.eventId) {
      eligibility.status = "needs_review";
      eligibility.reason = "가입 시 적용된 추천 이벤트를 확인할 수 없음";
    }
    // Do not reset a previously manually reviewed record to pending.
    const doc = { inviteeApplicationId: snap.id, referrerUid, firstCompletedMatchId: eligibility.matchId, status: eligibility.status, assessmentReason: eligibility.reason, rewardEventSnapshot: invitee.referral?.rewardEventSnapshot || null, assessedAt: stamp(), updatedAt: stamp() };
    await rewardRef.set(doc, { merge: true });
    outputs.push({ id: snap.id, ...doc });
  }
  return { ok: true, scanned: applicants.size, evaluated: outputs.length };
});
const listTwoWeeksReferralRewards = onCall({ region: REGION }, async request => {
  await requireAdmin(request);
  const snap = await db().collection("twoweeksReferralRewards").limit(500).get();
  return { items: snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, assessedAt: data.assessedAt?.toDate?.()?.toISOString() || "", approvedAt: data.approvedAt?.toDate?.()?.toISOString() || "", paidAt: data.paidAt?.toDate?.()?.toISOString() || "" };
  }) };
});
const updateTwoWeeksReferralReward = onCall({ region: REGION }, async request => {
  await requireAdmin(request);
  const id = clean(request.data?.inviteeApplicationId, 128);
  const next = clean(request.data?.status, 30);
  const note = clean(request.data?.note, 300);
  if (!/^[a-zA-Z0-9_-]{10,128}$/.test(id) || !["approved", "paid", "excluded", "needs_review"].includes(next)) throw new HttpsError("invalid-argument", "보상 상태를 확인해주세요.");
  const ref = db().collection("twoweeksReferralRewards").doc(id);
  await db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "보상 판정 후 처리해주세요.");
    const prev = snap.data();
    if (prev.status === "paid" && next !== "paid") throw new HttpsError("failed-precondition", "지급 완료 기록은 되돌릴 수 없습니다.");
    if (next === "paid" && prev.status !== "approved") throw new HttpsError("failed-precondition", "관리자 승인 후 실제 지급을 기록해주세요.");
    if (next === "approved" && !["eligible", "needs_review", "approved"].includes(prev.status)) throw new HttpsError("failed-precondition", "첫 만남을 확인한 후 지급 승인해주세요.");
    const patch = { status: next, adminNote: note, updatedByUid: request.auth.uid, updatedAt: stamp() };
    if (next === "approved") { patch.approvedAt = stamp(); patch.approvedByUid = request.auth.uid; }
    if (next === "paid") { patch.paidAt = stamp(); patch.paidByUid = request.auth.uid; }
    tx.update(ref, patch);
  });
  return { ok: true };
});
// Automatic assessment on completed feedback. No payouts or approvals happen here.
const onTwoWeeksMatchReferralMilestone = onDocumentUpdated(
  { region: REGION, document: "twoweeksMatches/{matchId}", timeoutSeconds: 60 },
  async event => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    if (after.feedbackStatus !== "completed" || before.feedbackStatus === "completed") return null;
    const matchId = event.params.matchId;
    const participantIds = [after.maleApplicationId, after.femaleApplicationId].filter(Boolean);
    if (participantIds.length !== 2) return null;
    for (const applicationId of participantIds) {
      const inviteeSnap = await db().collection("twoweeksApplications").doc(applicationId).get();
      const invitee = inviteeSnap.data() || {};
      if (!inviteeSnap.exists || invitee.isDummy || invitee.testMode || invitee.status === "withdrawn" || invitee.referral?.status !== "verified") continue;
      const referrerUid = clean(invitee.referral?.referredByUserId, 128);
      if (!referrerUid || referrerUid === invitee.uid) continue;
      const snapshot = invitee.referral?.rewardEventSnapshot || null;
      // Consider the invitee's ENTIRE meeting history, not merely this updated match.
      // Otherwise a disputed first meeting followed by a later valid meeting could be rewarded.
      const [maleMatches, femaleMatches] = await Promise.all([
        db().collection("twoweeksMatches").where("maleApplicationId", "==", applicationId).limit(50).get(),
        db().collection("twoweeksMatches").where("femaleApplicationId", "==", applicationId).limit(50).get(),
      ]);
      const history = [...maleMatches.docs, ...femaleMatches.docs].map(doc => ({ id: doc.id, ...doc.data() }));
      const eligibility = assessFirstMeeting(history);
      const assessment = snapshot?.eventId ? eligibility : { status: "needs_review", reason: "적용 이벤트 확인 필요", matchId };
      const rewardRef = db().collection("twoweeksReferralRewards").doc(applicationId);
      await db().runTransaction(async tx => {
        const prevSnap = await tx.get(rewardRef);
        const prev = prevSnap.data() || {};
        if (["approved", "paid", "excluded"].includes(prev.status)) return;
        if (prev.status === "eligible" && assessment.status !== "eligible") return;
        tx.set(rewardRef, {
          inviteeApplicationId: applicationId, referrerUid, rewardEventSnapshot: snapshot,
          firstCompletedMatchId: assessment.matchId,
          status: assessment.status, assessmentReason: assessment.reason,
          assessedAt: stamp(), updatedAt: stamp(),
        }, { merge: true });
      });
    }
    return null;
  }
);
module.exports = { getMyTwoWeeksReferralSummary, createMyTwoWeeksInviteLink, resolveInviteCode, assessTwoWeeksReferralRewards, listTwoWeeksReferralRewards, updateTwoWeeksReferralReward, onTwoWeeksMatchReferralMilestone, __test: { assessFirstMeeting } };
