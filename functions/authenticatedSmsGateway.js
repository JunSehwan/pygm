const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getBearerToken(req) {
  const header = String(req.headers?.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function verifyCaller(req) {
  const token = getBearerToken(req);
  if (!token) {
    const error = new Error("AUTH_REQUIRED");
    error.status = 401;
    throw error;
  }

  try {
    return await admin.auth().verifyIdToken(token, true);
  } catch {
    const error = new Error("AUTH_INVALID");
    error.status = 401;
    throw error;
  }
}

async function isAdminUid(uid = "") {
  if (!uid) return false;
  if (uid === "9OqbfNZW6lgq5NLB0lAigkYQxME2") return true;
  const snap = await admin.firestore().collection("adminConfig").doc("access").get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  return (Array.isArray(data.allowedUids) && data.allowedUids.includes(uid)) ||
    (Array.isArray(data.superAdmins) && data.superAdmins.includes(uid));
}

async function loadApplication(applicationId = "") {
  if (!applicationId) return null;
  const snap = await admin.firestore().collection("twoweeksApplications").doc(applicationId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

function dashboardSessionExpiresAtMs(session = {}) {
  const value = session?.expiresAt;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return Number(session?.expiresAtMs || 0);
}

async function loadActiveDashboardSession(uid = "") {
  const cleanUid = String(uid || "").trim();
  if (!cleanUid) return null;
  const snap = await admin.firestore().collection("twoweeksDashboardSessions").doc(cleanUid).get();
  if (!snap.exists) return null;
  const session = { id: snap.id, ...snap.data() };
  if (session.revoked === true || dashboardSessionExpiresAtMs(session) <= Date.now()) return null;
  return session;
}

function getApplicationPhone(application = {}) {
  return onlyDigits(
    application?.basic?.phoneNormalized ||
      application?.basic?.phone ||
      application?.phoneIdentityVerification?.phone ||
      application?.phone ||
      ""
  );
}

async function getAnonymousTwoWeeksApplications(uid = "") {
  if (!uid) return [];
  const snap = await admin.firestore().collection("twoweeksApplications").where("uid", "==", uid).limit(5).get();
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

async function assertTwoWeeksRecipient({ decoded, to, message }) {
  if (!String(message || "").trim().startsWith("[투윅스]")) {
    const error = new Error("TWOWEEKS_MESSAGE_REQUIRED");
    error.status = 403;
    throw error;
  }

  const allowedPhones = new Set();
  const adminPhone = onlyDigits(process.env.TWOWEEKS_ADMIN_PHONE || process.env.NEXT_PUBLIC_MY_NUM || "");
  if (adminPhone) allowedPhones.add(adminPhone);

  const claimApplicationId = String(decoded?.twoweeksApplicationId || "").trim();
  const dashboardSession = await loadActiveDashboardSession(decoded.uid);
  const sessionApplicationId = String(dashboardSession?.applicationId || "").trim();
  const dashboardApplicationId = claimApplicationId || sessionApplicationId;

  if ((decoded?.twoweeksDashboard === true && claimApplicationId) || dashboardApplicationId) {
    const application = await loadApplication(dashboardApplicationId);
    const directOwner = application && String(application.uid || "") === String(decoded.uid || "");
    const sessionOwner = application && sessionApplicationId === application.id;
    if (!application || (!directOwner && !sessionOwner)) {
      const error = new Error("TWOWEEKS_SESSION_INVALID");
      error.status = 403;
      throw error;
    }

    const ownPhone = getApplicationPhone(application);
    if (ownPhone) allowedPhones.add(ownPhone);

    const counterpartId = String(application?.currentProposal?.candidateApplicationId || "").trim();
    if (counterpartId) {
      const counterpart = await loadApplication(counterpartId);
      const counterpartPhone = getApplicationPhone(counterpart || {});
      if (counterpartPhone) allowedPhones.add(counterpartPhone);
    }
  } else {
    // 가입 직후에는 anonymous auth 상태일 수 있다. 이 경우 본인이 실제로 생성한
    // 투윅스 신청서의 전화번호와 관리자 번호만 허용한다.
    const applications = await getAnonymousTwoWeeksApplications(decoded.uid);
    applications.forEach((application) => {
      const phone = getApplicationPhone(application);
      if (phone) allowedPhones.add(phone);
    });
  }

  if (!allowedPhones.has(onlyDigits(to))) {
    const error = new Error("TWOWEEKS_RECIPIENT_DENIED");
    error.status = 403;
    throw error;
  }
}

async function consumeRateLimit({ uid, scope = "user", isAdmin = false }) {
  if (isAdmin) return;
  const db = admin.firestore();
  const now = Date.now();
  const minuteKey = Math.floor(now / 60000);
  const dayKey = new Date(now).toISOString().slice(0, 10);
  const ref = db.collection("twoweeksSecurityRateLimits").doc(`sms_${scope}_${uid}`);
  const minuteLimit = scope === "twoweeks" ? 8 : 10;
  const dayLimit = scope === "twoweeks" ? 50 : 80;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    const minuteCount = Number(data.minuteKey) === minuteKey ? Number(data.minuteCount || 0) : 0;
    const dayCount = String(data.dayKey || "") === dayKey ? Number(data.dayCount || 0) : 0;

    if (minuteCount >= minuteLimit || dayCount >= dayLimit) {
      const error = new Error("RATE_LIMITED");
      error.status = 429;
      throw error;
    }

    tx.set(ref, {
      minuteKey,
      minuteCount: minuteCount + 1,
      dayKey,
      dayCount: dayCount + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

async function authorizeSmsRequest(req, { to, message }) {
  const decoded = await verifyCaller(req);
  const uid = String(decoded.uid || "");
  const adminCaller = await isAdminUid(uid);
  if (adminCaller) return { decoded, uid, isAdmin: true, scope: "admin" };

  const signInProvider = String(decoded?.firebase?.sign_in_provider || "");
  const isDashboard = decoded?.twoweeksDashboard === true || Boolean(await loadActiveDashboardSession(uid));
  const isAnonymous = signInProvider === "anonymous";

  if (isDashboard || isAnonymous) {
    await assertTwoWeeksRecipient({ decoded, to, message });
    await consumeRateLimit({ uid, scope: "twoweeks", isAdmin: false });
    return { decoded, uid, isAdmin: false, scope: "twoweeks" };
  }

  // 기존 차밍수프 로그인 사용자의 기능 호환성을 위해 일반 Firebase 계정은 허용하되
  // UID 단위 rate limit을 적용한다. 비로그인 공개 호출은 더 이상 허용하지 않는다.
  await consumeRateLimit({ uid, scope: "user", isAdmin: false });
  return { decoded, uid, isAdmin: false, scope: "user" };
}

async function sendNcp({ to, message, subject = "차밍수프 안내", forceLms = false, smsOnly = false }) {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");
  if (!serviceId || !secretKey || !accessKey || !from) throw new Error("SMS_CONFIG_MISSING");

  const cleanTo = onlyDigits(to);
  const cleanMessage = String(message || "")
    .replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, "")
    .slice(0, 4000);
  const cleanSubject = String(subject || "차밍수프 안내").slice(0, 40);
  if (cleanTo.length < 10 || !cleanMessage) throw new Error("SMS_ARGUMENT_INVALID");

  const method = "POST";
  const urlPath = `/sms/v2/services/${serviceId}/messages`;
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

  const messageType = smsOnly ? "SMS" : (forceLms || Buffer.byteLength(cleanMessage, "utf8") > 90 ? "LMS" : "SMS");
  const payload = {
    type: messageType,
    countryCode: "82",
    from,
    ...(messageType === "LMS" ? { subject: cleanSubject } : {}),
    content: cleanMessage,
    messages: [{ to: cleanTo }],
  };

  const response = await axios.post(`https://sens.apigw.ntruss.com${urlPath}`, payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-apigw-signature-v2": signature,
    },
  });
  return response.data;
}

function applyCors(req, res) {
  const origin = String(req.headers?.origin || "");
  const allowed = new Set([
    "https://charmingsoup.com",
    "https://www.charmingsoup.com",
    "http://localhost:3060",
    "http://127.0.0.1:3060",
  ]);
  if (allowed.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function handleError(res, error) {
  const status = Number(error?.status || 500);
  const publicMessage = status === 401
    ? "Authentication required"
    : status === 403
      ? "SMS request is not allowed"
      : status === 429
        ? "Too many requests"
        : status === 400
          ? "Invalid request"
          : "SMS send failed";
  console.error("[authenticatedSmsGateway]", error?.message || error);
  return res.status(status).json({ error: publicMessage });
}

const sendSms = onRequest({ region: "asia-northeast3", cors: false }, async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { to, message } = req.body || {};
    if (!to || !message) return res.status(400).json({ error: "Invalid request" });
    await authorizeSmsRequest(req, { to, message });
    const data = await sendNcp({ to, message, smsOnly: true });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
});

const sendLms = onRequest({ region: "asia-northeast3", cors: false }, async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { to, message, subject, forceLms } = req.body || {};
    if (!to || !message) return res.status(400).json({ error: "Invalid request" });
    await authorizeSmsRequest(req, { to, message });
    const data = await sendNcp({ to, message, subject, forceLms: !!forceLms });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
});

module.exports = { sendSms, sendLms };
