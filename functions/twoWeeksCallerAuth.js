const { HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const FALLBACK_ADMIN_UID = "9OqbfNZW6lgq5NLB0lAigkYQxME2";

function sessionExpiresAtMs(session = {}) {
  const value = session?.expiresAt;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return Number(session?.expiresAtMs || 0);
}

function isActiveDashboardSession(session = {}, applicationId = "") {
  return Boolean(
    session &&
    session.revoked !== true &&
    String(session.applicationId || "") === String(applicationId || "") &&
    sessionExpiresAtMs(session) > Date.now()
  );
}

async function loadDashboardSession(uid = "") {
  const cleanUid = String(uid || "").trim();
  if (!cleanUid) return null;
  const snap = await admin.firestore().collection("twoweeksDashboardSessions").doc(cleanUid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function isDashboardSessionAuthorized(uid = "", applicationId = "") {
  const session = await loadDashboardSession(uid);
  return isActiveDashboardSession(session, applicationId);
}

async function isAdminUid(uid = "") {
  const cleanUid = String(uid || "").trim();
  if (!cleanUid) return false;
  if (cleanUid === FALLBACK_ADMIN_UID) return true;

  const snap = await admin.firestore().collection("adminConfig").doc("access").get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  return (Array.isArray(data.allowedUids) && data.allowedUids.includes(cleanUid)) ||
    (Array.isArray(data.superAdmins) && data.superAdmins.includes(cleanUid));
}

async function assertApplicationOwner(request, applicationId, options = {}) {
  if (!request?.auth?.uid) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }

  const cleanApplicationId = String(applicationId || "").trim();
  if (!cleanApplicationId) {
    throw new HttpsError("invalid-argument", "신청자 정보가 필요합니다.");
  }

  const uid = String(request.auth.uid || "").trim();
  const allowAdmin = options.allowAdmin !== false;
  if (allowAdmin && await isAdminUid(uid)) {
    return { isAdmin: true, uid, application: null, viaDashboardSession: false };
  }

  const snap = await admin.firestore().collection("twoweeksApplications").doc(cleanApplicationId).get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "신청 정보를 찾을 수 없습니다.");
  }

  const application = { id: snap.id, ...snap.data() };
  if (
    application.status === "withdrawn" ||
    application.withdrawal?.status === "completed"
  ) {
    throw new HttpsError("permission-denied", "탈퇴 처리된 신청 정보입니다.");
  }
  const directOwner = String(application.uid || "") === uid;
  const sessionAuthorized = directOwner ? false : await isDashboardSessionAuthorized(uid, cleanApplicationId);

  if (!directOwner && !sessionAuthorized) {
    throw new HttpsError("permission-denied", "본인의 신청 정보만 처리할 수 있습니다.");
  }

  const claimApplicationId = String(request.auth?.token?.twoweeksApplicationId || "").trim();
  if (request.auth?.token?.twoweeksDashboard === true && claimApplicationId && claimApplicationId !== cleanApplicationId) {
    throw new HttpsError("permission-denied", "인증된 신청 정보와 요청 대상이 일치하지 않습니다.");
  }

  return {
    isAdmin: false,
    uid,
    application,
    viaDashboardSession: sessionAuthorized,
  };
}

module.exports = {
  assertApplicationOwner,
  isAdminUid,
  isDashboardSessionAuthorized,
  loadDashboardSession,
};
