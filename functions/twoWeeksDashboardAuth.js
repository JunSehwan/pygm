const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const {
  isTwoWeeksTestPhone,
  normalizeTwoWeeksPhone,
} = require("./twoWeeksTestAuth");

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MIN_INTERVAL_MS = 60 * 1000;
const OTP_MAX_PER_HOUR_PHONE = 5;
const OTP_MAX_PER_HOUR_IP = 20;
const OTP_MAX_VERIFY_ATTEMPTS = 5;
const DASHBOARD_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DASHBOARD_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TEST_CODE = "000000";

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function sha256(value = "") {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function timingSafeEqualString(a = "", b = "") {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function randomCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function getClientIp(request) {
  const forwarded = String(request?.rawRequest?.headers?.["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwarded || request?.rawRequest?.ip || "unknown";
}

function getApplicationPhone(application = {}) {
  return normalizeTwoWeeksPhone(
    application?.basic?.phoneNormalized ||
      application?.basic?.phone ||
      application?.phoneIdentityVerification?.phone ||
      application?.phone ||
      ""
  );
}

function getApplicationTimeMs(application = {}) {
  const candidates = [
    application?.updatedAt,
    application?.submittedAt,
    application?.createdAt,
    application?.completedAtClient,
  ];

  for (const value of candidates) {
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.seconds === "number") return value.seconds * 1000;
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return 0;
}

function getApplicationRank(application = {}) {
  const status = String(application?.matchingStatus || "");
  const scheduleStatus = String(application?.scheduleStatus || application?.schedule?.status || "");
  const proposal = application?.currentProposal || {};
  const hasProposal = Boolean(proposal.matchId || proposal.candidateApplicationId);

  if (hasProposal && (status === "confirmed" || scheduleStatus === "confirmed" || application?.schedule?.finalMeeting)) return 7000;
  if (hasProposal && ["accepted", "mutualAccepted"].includes(status)) return 6000;
  if (hasProposal && ["waiting_counterpart", "ready"].includes(scheduleStatus)) return 5500;
  if (hasProposal && ["proposed", "pending"].includes(String(proposal.response || ""))) return 5000;
  if (application?.reviewStatus === "approved" && ["confirmed", "waived"].includes(application?.deposit?.status)) return 2000;
  if (application?.reviewStatus === "approved") return 1000;
  return 0;
}

function pickDashboardApplication(applications = [], preferredApplicationId = "") {
  const rows = applications.filter((item) => item?.id);
  if (!rows.length) return null;
  const preferred = preferredApplicationId ? rows.find((item) => item.id === preferredApplicationId) : null;
  if (preferred) return preferred;
  return [...rows].sort((a, b) => {
    const rankDiff = getApplicationRank(b) - getApplicationRank(a);
    if (rankDiff) return rankDiff;
    return getApplicationTimeMs(b) - getApplicationTimeMs(a);
  })[0] || null;
}

async function findApplicationsByPhone(db, phone) {
  const cleanPhone = normalizeTwoWeeksPhone(phone);
  const formatted = cleanPhone.length === 11
    ? `${cleanPhone.slice(0, 3)}-${cleanPhone.slice(3, 7)}-${cleanPhone.slice(7)}`
    : cleanPhone;
  const values = Array.from(new Set([cleanPhone, formatted].filter(Boolean)));
  const fields = [
    "basic.phoneNormalized",
    "basic.phone",
    "phoneIdentityVerification.phone",
    "phoneNormalized",
    "phone",
  ];
  const rows = new Map();

  for (const field of fields) {
    for (const value of values) {
      try {
        const snap = await db.collection("twoweeksApplications").where(field, "==", value).limit(10).get();
        snap.docs.forEach((docSnap) => rows.set(docSnap.id, { id: docSnap.id, ...docSnap.data() }));
      } catch (error) {
        console.warn(`[TwoWeeksDashboardAuth] query skipped ${field}:`, error?.message || error);
      }
    }
  }

  return Array.from(rows.values()).filter((application) => getApplicationPhone(application) === cleanPhone);
}

async function sendNcpSms(to, message, subject = "투윅스 신청현황 인증") {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");

  if (!serviceId || !accessKey || !secretKey || !from) {
    throw new Error("NCP SMS 환경변수가 설정되지 않았습니다.");
  }

  const cleanMessage = String(message || "").replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, "");
  const type = Buffer.byteLength(cleanMessage, "utf8") > 90 ? "LMS" : "SMS";
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

  return axios.post(
    `https://sens.apigw.ntruss.com${urlPath}`,
    {
      type,
      countryCode: "82",
      from,
      ...(type === "LMS" ? { subject } : {}),
      content: cleanMessage,
      messages: [{ to: onlyDigits(to) }],
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
}

async function consumeRateLimit(db, { phoneHash, ipHash }) {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const phoneRef = db.collection("twoweeksSecurityRateLimits").doc(`dashboardOtp_phone_${phoneHash}`);
  const ipRef = db.collection("twoweeksSecurityRateLimits").doc(`dashboardOtp_ip_${ipHash}`);

  await db.runTransaction(async (tx) => {
    const [phoneSnap, ipSnap] = await Promise.all([tx.get(phoneRef), tx.get(ipRef)]);
    const phoneData = phoneSnap.exists ? phoneSnap.data() || {} : {};
    const ipData = ipSnap.exists ? ipSnap.data() || {} : {};

    const phoneWindowStart = Number(phoneData.windowStartMs || 0);
    const phoneWindowActive = phoneWindowStart && now - phoneWindowStart < hourMs;
    const phoneCount = phoneWindowActive ? Number(phoneData.count || 0) : 0;
    const lastSentMs = Number(phoneData.lastSentMs || 0);

    if (lastSentMs && now - lastSentMs < OTP_MIN_INTERVAL_MS) {
      throw new HttpsError("resource-exhausted", "인증번호는 1분 후 다시 요청할 수 있습니다.");
    }
    if (phoneCount >= OTP_MAX_PER_HOUR_PHONE) {
      throw new HttpsError("resource-exhausted", "인증번호 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.");
    }

    const ipWindowStart = Number(ipData.windowStartMs || 0);
    const ipWindowActive = ipWindowStart && now - ipWindowStart < hourMs;
    const ipCount = ipWindowActive ? Number(ipData.count || 0) : 0;
    if (ipCount >= OTP_MAX_PER_HOUR_IP) {
      throw new HttpsError("resource-exhausted", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
    }

    tx.set(phoneRef, {
      windowStartMs: phoneWindowActive ? phoneWindowStart : now,
      count: phoneCount + 1,
      lastSentMs: now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    tx.set(ipRef, {
      windowStartMs: ipWindowActive ? ipWindowStart : now,
      count: ipCount + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

function createDashboardLinkToken() {
  return `tw_${crypto.randomBytes(32).toString("hex")}`;
}

const createTwoWeeksDashboardAccess = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const applicationId = String(request.data?.applicationId || "").trim();
    if (!applicationId) {
      throw new HttpsError("invalid-argument", "신청 정보가 필요합니다.");
    }

    const db = admin.firestore();
    const appRef = db.collection("twoweeksApplications").doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      throw new HttpsError("not-found", "신청 정보를 찾을 수 없습니다.");
    }

    const application = appSnap.data() || {};
    if (String(application.uid || "") !== String(request.auth.uid || "")) {
      throw new HttpsError("permission-denied", "본인의 신청 정보만 처리할 수 있습니다.");
    }

    const rawToken = createDashboardLinkToken();
    const nowMs = Date.now();
    const expiresAtMs = nowMs + DASHBOARD_LINK_TTL_MS;

    await db.collection("twoweeksDashboardAccess").doc(applicationId).set({
      applicationId,
      ownerUid: request.auth.uid,
      tokenHash: sha256(rawToken),
      revoked: false,
      expiresAtMs,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtClient: new Date(nowMs).toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: false });

    // 일반 신청서에는 raw token이나 token이 포함된 URL을 저장하지 않는다.
    await appRef.set({
      dashboardAccess: {
        method: "sms_magic_link",
        revoked: false,
        tokenStoredPrivately: true,
        sessionTtlDays: 7,
        expiresAtClient: new Date(expiresAtMs).toISOString(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      ok: true,
      applicationId,
      token: rawToken,
      expiresAt: expiresAtMs,
    };
  }
);

async function createDashboardSession(db, request, applicationId, source = "otp") {
  const authUid = String(request?.auth?.uid || "").trim();
  if (!authUid) {
    throw new HttpsError("unauthenticated", "신청현황 인증 세션을 만들기 위해 로그인이 필요합니다.");
  }

  const nowMs = Date.now();
  const expiresAtMs = nowMs + DASHBOARD_SESSION_TTL_MS;
  await db.collection("twoweeksDashboardSessions").doc(authUid).set({
    authUid,
    applicationId: String(applicationId || "").trim(),
    source,
    revoked: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAtClient: new Date(nowMs).toISOString(),
    lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastVerifiedAtClient: new Date(nowMs).toISOString(),
    expiresAt: admin.firestore.Timestamp.fromMillis(expiresAtMs),
    expiresAtMs,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return { authUid, expiresAtMs };
}

const requestTwoWeeksDashboardOtp = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "인증번호 요청을 위해 로그인 세션이 필요합니다.");
    }

    const phone = normalizeTwoWeeksPhone(request.data?.phone || "");
    if (phone.length < 10 || phone.length > 11) {
      throw new HttpsError("invalid-argument", "휴대폰 번호를 확인해주세요.");
    }

    const db = admin.firestore();
    const phoneHash = sha256(phone);
    const ipHash = sha256(getClientIp(request));

    // 존재하지 않는 번호도 동일한 rate-limit을 먼저 소비하게 해서
    // 대량 번호 대입으로 신청 여부를 탐색하는 것을 어렵게 한다.
    await consumeRateLimit(db, { phoneHash, ipHash });

    const applications = await findApplicationsByPhone(db, phone);
    if (!applications.length) {
      // 계정 존재 여부를 과도하게 노출하지 않도록 상세 상태는 공개하지 않는다.
      throw new HttpsError("not-found", "신청내역을 확인할 수 없습니다.");
    }

    const testPhone = isTwoWeeksTestPhone(phone);
    const code = testPhone ? TEST_CODE : randomCode();
    const challengeId = crypto.randomBytes(24).toString("hex");
    const expiresAtMs = Date.now() + OTP_TTL_MS;

    await db.collection("twoweeksDashboardOtpChallenges").doc(challengeId).set({
      phoneHash,
      codeHash: sha256(`${challengeId}:${code}`),
      expiresAtMs,
      attempts: 0,
      consumed: false,
      requestAuthUid: request.auth?.uid || "",
      ipHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtClient: new Date().toISOString(),
    });

    if (!testPhone) {
      await sendNcpSms(
        phone,
        `[투윅스] 신청현황 인증번호: ${code}\n5분 안에 입력해주세요.`,
        "투윅스 신청현황 인증번호"
      );
    }

    return {
      ok: true,
      challengeId,
      expiresAt: expiresAtMs,
      testMode: testPhone,
    };
  }
);

const verifyTwoWeeksDashboardOtp = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "인증번호 확인을 위해 로그인 세션이 필요합니다.");
    }

    const phone = normalizeTwoWeeksPhone(request.data?.phone || "");
    const code = onlyDigits(request.data?.code || "");
    const challengeId = String(request.data?.challengeId || "").trim();
    const preferredApplicationId = String(request.data?.preferredApplicationId || "").trim();

    if (!phone || code.length !== 6 || !challengeId) {
      throw new HttpsError("invalid-argument", "인증번호 정보를 확인해주세요.");
    }

    const db = admin.firestore();
    const challengeRef = db.collection("twoweeksDashboardOtpChallenges").doc(challengeId);

    const verifyResult = await db.runTransaction(async (tx) => {
      const snap = await tx.get(challengeRef);
      if (!snap.exists) {
        return { error: "not-found" };
      }

      const data = snap.data() || {};
      if (data.requestAuthUid && String(data.requestAuthUid) !== String(request.auth.uid || "")) {
        return { error: "session-mismatch" };
      }
      if (data.consumed === true) return { error: "consumed" };
      if (Date.now() > Number(data.expiresAtMs || 0)) return { error: "expired" };
      if (Number(data.attempts || 0) >= OTP_MAX_VERIFY_ATTEMPTS) return { error: "too-many-attempts" };
      if (!timingSafeEqualString(String(data.phoneHash || ""), sha256(phone))) {
        return { error: "mismatch" };
      }

      const validCode = timingSafeEqualString(String(data.codeHash || ""), sha256(`${challengeId}:${code}`));
      if (!validCode) {
        const nextAttempts = Number(data.attempts || 0) + 1;
        tx.update(challengeRef, {
          attempts: nextAttempts,
          lastFailedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...(nextAttempts >= OTP_MAX_VERIFY_ATTEMPTS
            ? { lockedAt: admin.firestore.FieldValue.serverTimestamp() }
            : {}),
        });
        // transaction 내부에서 throw하면 위 update도 rollback되므로 결과만 반환한다.
        return { error: nextAttempts >= OTP_MAX_VERIFY_ATTEMPTS ? "too-many-attempts" : "invalid-code" };
      }

      tx.update(challengeRef, {
        consumed: true,
        attempts: admin.firestore.FieldValue.increment(1),
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { ok: true };
    });

    if (!verifyResult?.ok) {
      const reason = verifyResult?.error;
      if (reason === "not-found" || reason === "expired") {
        throw new HttpsError("deadline-exceeded", "인증번호가 만료되었습니다. 다시 요청해주세요.");
      }
      if (reason === "consumed") {
        throw new HttpsError("failed-precondition", "이미 사용한 인증번호입니다. 다시 요청해주세요.");
      }
      if (reason === "too-many-attempts") {
        throw new HttpsError("resource-exhausted", "인증번호 입력 횟수를 초과했습니다. 다시 요청해주세요.");
      }
      if (reason === "mismatch" || reason === "session-mismatch") {
        throw new HttpsError("permission-denied", "인증정보가 일치하지 않습니다. 인증번호를 다시 요청해주세요.");
      }
      throw new HttpsError("permission-denied", "인증번호가 일치하지 않습니다.");
    }

    const applications = await findApplicationsByPhone(db, phone);
    const application = pickDashboardApplication(applications, preferredApplicationId);
    if (!application) throw new HttpsError("not-found", "신청내역을 확인할 수 없습니다.");

    const session = await createDashboardSession(db, request, application.id, "otp");
    return {
      ok: true,
      sessionAuthorized: true,
      sessionExpiresAt: session.expiresAtMs,
      applicationId: application.id,
      phone,
      name: application?.basic?.name || "",
    };
  }
);

const authenticateTwoWeeksDashboardLink = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "신청현황 링크 확인을 위해 로그인 세션이 필요합니다.");
    }

    const applicationId = String(request.data?.applicationId || "").trim();
    const token = String(request.data?.token || "").trim();
    if (!applicationId || token.length < 20) {
      throw new HttpsError("invalid-argument", "신청현황 링크 정보가 올바르지 않습니다.");
    }

    const db = admin.firestore();
    const appRef = db.collection("twoweeksApplications").doc(applicationId);
    const [appSnap, privateAccessSnap] = await Promise.all([
      appRef.get(),
      db.collection("twoweeksDashboardAccess").doc(applicationId).get(),
    ]);

    if (!appSnap.exists) throw new HttpsError("not-found", "신청 정보를 찾지 못했습니다.");
    const application = { id: appSnap.id, ...appSnap.data() };
    if (application?.dashboardAccess?.revoked === true || application?.access?.revoked === true) {
      throw new HttpsError("permission-denied", "신청현황 링크가 만료되었습니다. 휴대폰 번호로 다시 인증해주세요.");
    }

    const suppliedHash = sha256(token);
    const privateHash = privateAccessSnap.exists ? String(privateAccessSnap.data()?.tokenHash || "") : "";
    const legacyToken = String(
      application?.dashboardAccess?.token || application?.access?.dashboardToken || application?.dashboardToken || ""
    );

    const privateData = privateAccessSnap.exists ? privateAccessSnap.data() || {} : {};
    const privateExpiresAtMs = Number(privateData.expiresAtMs || 0);
    const privateExpired = privateHash && privateExpiresAtMs > 0 && Date.now() > privateExpiresAtMs;
    const valid = privateHash
      ? !privateExpired && timingSafeEqualString(privateHash, suppliedHash)
      : legacyToken && timingSafeEqualString(sha256(legacyToken), suppliedHash);

    if (!valid) {
      throw new HttpsError("permission-denied", "신청현황 링크가 만료되었거나 올바르지 않습니다. 휴대폰 번호로 다시 인증해주세요.");
    }

    // 기존 문서의 평문 토큰을 즉시 제거하면 기존 문자 생성 로직과 충돌할 수 있으므로,
    // 서버 전용 hash 사본을 먼저 만든다. 고객간 read 차단 규칙으로 평문 토큰의 타인 노출은 막는다.
    const migrationExpiresAtMs = Date.now() + DASHBOARD_LINK_TTL_MS;
    await db.collection("twoweeksDashboardAccess").doc(applicationId).set({
      applicationId,
      ownerUid: application.uid || "",
      tokenHash: suppliedHash,
      revoked: false,
      expiresAtMs: privateHash ? (privateExpiresAtMs || migrationExpiresAtMs) : migrationExpiresAtMs,
      migratedFromLegacy: !privateHash,
      createdAt: privateAccessSnap.exists
        ? privateData.createdAt || admin.firestore.FieldValue.serverTimestamp()
        : admin.firestore.FieldValue.serverTimestamp(),
      lastOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // legacy 평문 token/path/url은 첫 정상 인증 시 일반 신청서에서 제거한다.
    await appRef.update({
      "dashboardAccess.method": "sms_magic_link",
      "dashboardAccess.revoked": false,
      "dashboardAccess.tokenStoredPrivately": true,
      "dashboardAccess.sessionTtlDays": 7,
      "dashboardAccess.expiresAtClient": new Date(privateHash ? (privateExpiresAtMs || migrationExpiresAtMs) : migrationExpiresAtMs).toISOString(),
      "dashboardAccess.lastOpenedAt": admin.firestore.FieldValue.serverTimestamp(),
      "dashboardAccess.lastOpenedAtClient": new Date().toISOString(),
      "dashboardAccess.token": admin.firestore.FieldValue.delete(),
      "dashboardAccess.path": admin.firestore.FieldValue.delete(),
      "dashboardAccess.url": admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const session = await createDashboardSession(db, request, applicationId, "magic_link");
    return {
      ok: true,
      sessionAuthorized: true,
      sessionExpiresAt: session.expiresAtMs,
      applicationId,
      phone: getApplicationPhone(application),
      name: application?.basic?.name || "",
    };
  }
);


function normalizeName(value = "") {
  return String(value || "").replace(/\s+/g, "").trim().toLowerCase();
}

function normalizeGender(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  if (["male", "m", "1", "3", "남", "남자", "남성"].includes(raw)) return "male";
  if (["female", "f", "2", "4", "여", "여자", "여성"].includes(raw)) return "female";
  return "";
}

const completeTwoWeeksDashboardIdentity = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "본인인증 연결을 위해 신청현황 인증이 필요합니다.");
    }

    const applicationId = String(request.data?.applicationId || "").trim();
    const identityVerificationId = String(request.data?.identityVerificationId || "").trim().slice(0, 120);
    if (!applicationId || !identityVerificationId) {
      throw new HttpsError("invalid-argument", "본인인증 완료 정보를 확인할 수 없습니다.");
    }

    await assertApplicationOwner(request, applicationId, { allowAdmin: false });

    const db = admin.firestore();
    const appRef = db.collection("twoweeksApplications").doc(applicationId);
    const verificationRef = db.collection("twoweeksIdentityVerifications").doc(identityVerificationId);

    await db.runTransaction(async (tx) => {
      const [appSnap, verificationSnap] = await Promise.all([tx.get(appRef), tx.get(verificationRef)]);
      if (!appSnap.exists) throw new HttpsError("not-found", "기존 신청내역을 찾지 못했습니다.");
      if (!verificationSnap.exists) throw new HttpsError("failed-precondition", "본인인증 확인정보가 만료되었습니다.");

      const application = { id: appSnap.id, ...appSnap.data() };
      const verification = verificationSnap.data() || {};
      if (verification.verified !== true || verification.source !== "twoweeks_dashboard_upgrade") {
        throw new HttpsError("failed-precondition", "본인인증 확인정보가 올바르지 않습니다.");
      }
      if (String(verification.ownerUid || "") !== request.auth.uid) {
        throw new HttpsError("permission-denied", "본인인증 사용자와 신청자가 일치하지 않습니다.");
      }
      if (verification.expiresAt?.toMillis && Date.now() > verification.expiresAt.toMillis()) {
        throw new HttpsError("deadline-exceeded", "본인인증 확인정보가 만료되었습니다.");
      }
      if (verification.applicationId && verification.applicationId !== applicationId) {
        throw new HttpsError("permission-denied", "이미 다른 신청내역에 사용된 본인인증입니다.");
      }

      const appPhone = getApplicationPhone(application);
      const verifiedPhone = normalizeTwoWeeksPhone(verification.phone || "");
      if (!appPhone || !verifiedPhone || appPhone !== verifiedPhone) {
        throw new HttpsError("permission-denied", "기존 신청 연락처와 본인인증 연락처가 일치하지 않습니다.");
      }

      const appName = normalizeName(application?.basic?.name || "");
      const verifiedName = normalizeName(verification?.name || "");
      if (appName && verifiedName && appName !== verifiedName) {
        throw new HttpsError("permission-denied", "기존 신청 이름과 본인인증 이름이 일치하지 않습니다.");
      }

      const appBirthYear = onlyDigits(application?.basic?.birthYear || application?.birthYear || "").slice(0, 4);
      const verifiedBirthYear = onlyDigits(verification?.birth || "").slice(0, 4);
      if (appBirthYear && verifiedBirthYear && appBirthYear !== verifiedBirthYear) {
        throw new HttpsError("permission-denied", "기존 신청 출생연도와 본인인증 정보가 일치하지 않습니다.");
      }

      const appGender = normalizeGender(application?.basic?.gender || application?.gender || "");
      const verifiedGender = normalizeGender(verification?.gender || "");
      if (appGender && verifiedGender && appGender !== verifiedGender) {
        throw new HttpsError("permission-denied", "기존 신청 성별과 본인인증 정보가 일치하지 않습니다.");
      }

      const now = new Date();
      tx.update(appRef, {
        "basic.phoneVerified": true,
        "basic.phoneVerificationSkipped": false,
        "phoneIdentityVerification.verified": true,
        "phoneIdentityVerification.provider": verification.provider || "PORTONE",
        "phoneIdentityVerification.phone": verifiedPhone,
        "phoneIdentityVerification.verificationId": identityVerificationId,
        "phoneIdentityVerification.verifiedAt": admin.firestore.FieldValue.serverTimestamp(),
        "phoneIdentityVerification.verifiedAtClient": now.toISOString(),
        "phoneIdentityVerification.upgradedFromLegacy": true,
        "phoneIdentityVerification.upgradedAtClient": now.toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.update(verificationRef, {
        applicationId,
        consumedAt: admin.firestore.FieldValue.serverTimestamp(),
        consumedAtClient: now.toISOString(),
      });
    });

    return { ok: true, applicationId };
  }
);

module.exports = {
  createTwoWeeksDashboardAccess,
  requestTwoWeeksDashboardOtp,
  verifyTwoWeeksDashboardOtp,
  authenticateTwoWeeksDashboardLink,
  completeTwoWeeksDashboardIdentity,
};
