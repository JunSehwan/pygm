"use strict";
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();

const logoutMyTwoWeeksDashboardSession = onCall({ region: "asia-northeast3" }, async request => {
  const uid = String(request.auth?.uid || "").trim();
  if (!uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  const sessionRef = admin.firestore().collection("twoweeksDashboardSessions").doc(uid);
  await admin.firestore().runTransaction(async tx => {
    const snap = await tx.get(sessionRef);
    if (!snap.exists || snap.data()?.revoked === true) return;
    tx.update(sessionRef, { revoked: true, revokedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
  return { ok: true };
});
module.exports = { logoutMyTwoWeeksDashboardSession };
