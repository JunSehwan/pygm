const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const crypto = require("crypto");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

const REGION = "asia-northeast3";
const RESET_REQUESTS_COLLECTION = "passwordResetPhoneRequests";
const CODE_EXPIRE_MS = 3 * 60 * 1000; // 3분
const VERIFY_TOKEN_EXPIRE_MS = 10 * 60 * 1000; // 10분
const RESEND_GAP_MS = 60 * 1000; // 60초
const MAX_VERIFY_ATTEMPTS = 5;

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function sha256(value = "") {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function maskPhone(phone = "") {
  const digits = onlyDigits(phone);
  if (digits.length < 8) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, 4)}***-${digits.slice(-4)}`;
}

function normalizeBirth(raw) {
  if (!raw) return "";

  if (typeof raw === "string" || typeof raw === "number") {
    const digits = onlyDigits(raw);
    if (digits.length >= 8) return digits.slice(0, 8);
    if (digits.length === 6) return digits;
    if (digits.length === 4) return digits;
    return "";
  }

  if (typeof raw === "object") {
    const year = raw.year ? String(raw.year) : "";
    const month = raw.month ? String(raw.month).padStart(2, "0") : "";
    const day =
      raw.day
        ? String(raw.day).padStart(2, "0")
        : raw.date
          ? String(raw.date).padStart(2, "0")
          : "";

    if (year && month && day) return `${year}${month}${day}`;
    if (year) return year;
  }

  return "";
}

function isBirthMatched(userData = {}, inputBirth = "") {
  const input = normalizeBirth(inputBirth);
  if (!input) return false;

  const candidates = [
    userData.identity_birth,
    userData.birthday,
    userData.birth,
    userData.identityBirth,
  ]
    .map(normalizeBirth)
    .filter(Boolean);

  if (!candidates.length) return false;

  return candidates.some((candidate) => {
    if (candidate.length === 8) return candidate === input;
    if (candidate.length === 6) return input.slice(2) === candidate;
    if (candidate.length === 4) return input.startsWith(candidate);
    return false;
  });
}

async function sendSmsDirect({ to, message }) {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");

  if (!serviceId || !accessKey || !secretKey || !from) {
    throw new Error("SMS 환경변수가 설정되지 않았습니다.");
  }

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

  const body = {
    type: "SMS",
    countryCode: "82",
    from,
    content: message,
    messages: [{ to: onlyDigits(to) }],
  };

  await axios.post(url, body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-apigw-signature-v2": signature,
    },
  });
}

async function findUserByResetIdentity({ email, birth, phone }) {
  const db = admin.firestore();

  const emailNormalized = String(email || "").trim().toLowerCase();
  const phoneNormalized = onlyDigits(phone);
  const birthNormalized = onlyDigits(birth);

  if (!emailNormalized || !phoneNormalized || !birthNormalized) {
    throw new HttpsError("invalid-argument", "이메일, 생년월일, 휴대폰 번호를 확인해주세요.");
  }

  const snap = await db
    .collection("users")
    .where("email", "==", emailNormalized)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new HttpsError(
      "not-found",
      "입력한 정보와 일치하는 계정을 찾지 못했어요."
    );
  }

  const doc = snap.docs[0];
  const userData = doc.data() || {};
  const savedPhone = onlyDigits(userData.phonenumber || "");

  if (!savedPhone || savedPhone !== phoneNormalized) {
    throw new HttpsError(
      "not-found",
      "입력한 정보와 일치하는 계정을 찾지 못했어요."
    );
  }

  if (!isBirthMatched(userData, birthNormalized)) {
    throw new HttpsError(
      "not-found",
      "입력한 정보와 일치하는 계정을 찾지 못했어요."
    );
  }

  return {
    uid: doc.id,
    userData,
    phone: savedPhone,
    email: emailNormalized,
  };
}

exports.sendPasswordResetCodeByPhone = onCall(
  { region: REGION, timeoutSeconds: 60 },
  async (request) => {
    try {
      console.log("[reset] function entered");

      const { email, birth, phone } = request.data || {};
      console.log("[reset] request data", { email, birth, phone });

      const found = await findUserByResetIdentity({ email, birth, phone });
      console.log("[reset] user matched", {
        uid: found.uid,
        email: found.email,
        phone: found.phone,
      });

      const db = admin.firestore();
      console.log("[reset] firestore ready");

      const ref = db.collection(RESET_REQUESTS_COLLECTION).doc(found.uid);
      const existingSnap = await ref.get();
      console.log("[reset] existing request checked", {
        exists: existingSnap.exists,
      });

      const code = generateCode();
      console.log("[reset] code generated");

      await ref.set(
        {
          uid: found.uid,
          email: found.email,
          phone: found.phone,
          codeHash: sha256(code),
          verifyAttempts: 0,
          verified: false,
          verificationToken: "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastSentAt: Date.now(),
          codeExpiresAt: Date.now() + CODE_EXPIRE_MS,
          verifyTokenExpiresAt: 0,
          usedAt: null,
        },
        { merge: true }
      );
      console.log("[reset] request saved");

      await sendSmsDirect({
        to: found.phone,
        message: `[차밍수프] 비밀번호 재설정 인증번호는 [${code}] 입니다.`,
      });
      console.log("[reset] sms sent");

      return {
        ok: true,
        requestId: found.uid,
        maskedPhone: maskPhone(found.phone),
        expiresInSec: Math.floor(CODE_EXPIRE_MS / 1000),
      };
    } catch (error) {
      console.error("[reset] sendPasswordResetCodeByPhone error full:", error);
      throw error;
    }
  }
);

exports.verifyPasswordResetCodeByPhone = onCall(
  { region: REGION, timeoutSeconds: 60 },
  async (request) => {
    try {
      const { requestId, code } = request.data || {};

      if (!requestId || !code) {
        throw new HttpsError("invalid-argument", "인증 요청 정보와 인증번호가 필요합니다.");
      }

      const ref = admin.firestore().collection(RESET_REQUESTS_COLLECTION).doc(String(requestId));
      const snap = await ref.get();

      if (!snap.exists) {
        throw new HttpsError("not-found", "인증 요청을 찾지 못했어요. 다시 시도해주세요.");
      }

      const data = snap.data() || {};
      const now = Date.now();

      if (!data.codeExpiresAt || now > data.codeExpiresAt) {
        throw new HttpsError("deadline-exceeded", "인증번호 유효시간이 만료되었어요.");
      }

      const attempts = Number(data.verifyAttempts || 0);
      if (attempts >= MAX_VERIFY_ATTEMPTS) {
        throw new HttpsError(
          "resource-exhausted",
          "인증번호 입력 횟수를 초과했어요. 다시 받아주세요."
        );
      }

      const inputHash = sha256(String(code || "").trim());
      if (inputHash !== data.codeHash) {
        await ref.set(
          {
            verifyAttempts: attempts + 1,
          },
          { merge: true }
        );

        throw new HttpsError("invalid-argument", "인증번호가 올바르지 않습니다.");
      }

      const verificationToken = generateToken();

      await ref.set(
        {
          verified: true,
          verificationToken,
          verifyTokenExpiresAt: now + VERIFY_TOKEN_EXPIRE_MS,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        ok: true,
        verificationToken,
      };
    } catch (error) {
      console.error("verifyPasswordResetCodeByPhone error:", error);

      if (error instanceof HttpsError) throw error;

      throw new HttpsError(
        "internal",
        error?.message || "인증번호 확인 중 오류가 발생했습니다."
      );
    }
  }
);

exports.completePasswordResetByPhone = onCall(
  { region: REGION, timeoutSeconds: 60 },
  async (request) => {
    try {
      const { requestId, verificationToken, newPassword } = request.data || {};

      if (!requestId || !verificationToken || !newPassword) {
        throw new HttpsError("invalid-argument", "필수 정보가 누락되었어요.");
      }

      if (String(newPassword).length < 8) {
        throw new HttpsError("invalid-argument", "비밀번호는 8자 이상이어야 해요.");
      }

      const ref = admin.firestore().collection(RESET_REQUESTS_COLLECTION).doc(String(requestId));
      const snap = await ref.get();

      if (!snap.exists) {
        throw new HttpsError("not-found", "재설정 요청을 찾지 못했어요.");
      }

      const data = snap.data() || {};
      const now = Date.now();

      if (!data.verified) {
        throw new HttpsError("failed-precondition", "휴대폰 인증을 먼저 완료해주세요.");
      }

      if (!data.verifyTokenExpiresAt || now > data.verifyTokenExpiresAt) {
        throw new HttpsError("deadline-exceeded", "비밀번호 재설정 시간이 만료되었어요.");
      }

      if (data.verificationToken !== verificationToken) {
        throw new HttpsError("permission-denied", "재설정 권한이 유효하지 않아요.");
      }

      if (!data.uid) {
        throw new HttpsError("internal", "계정 정보를 찾지 못했어요.");
      }

      await admin.auth().updateUser(data.uid, {
        password: String(newPassword),
      });

      await admin.auth().revokeRefreshTokens(data.uid);

      await ref.set(
        {
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
          verified: false,
          verificationToken: "",
          verifyTokenExpiresAt: 0,
          codeHash: "",
        },
        { merge: true }
      );

      return {
        ok: true,
      };
    } catch (error) {
      console.error("completePasswordResetByPhone error:", error);

      if (error instanceof HttpsError) throw error;

      throw new HttpsError(
        "internal",
        error?.message || "비밀번호 재설정 중 오류가 발생했습니다."
      );
    }
  }
);