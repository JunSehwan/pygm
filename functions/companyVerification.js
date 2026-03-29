const { onCall, HttpsError } = require("firebase-functions/v2/https");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const VERIFICATION_TTL_MS = 5 * 60 * 1000;

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "naver.com",
  "daum.net",
  "hanmail.net",
  "kakao.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "yahoo.com",
  "nate.com",
  "empal.com",
]);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isCorporateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) return false;
  const domain = normalized.split("@")[1] || "";
  return domain && !PUBLIC_EMAIL_DOMAINS.has(domain);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function getCompanyNameFromEmail(email) {
  const normalized = normalizeEmail(email);
  const domain = normalized.split("@")[1] || "";
  if (!domain) return "";

  const root = domain.split(".")[0] || "";
  if (!root) return "";

  return root.charAt(0).toUpperCase() + root.slice(1);
}

function getTransporter() {
  const host = process.env.COMPANY_MAIL_SMTP_HOST;
  const port = Number(process.env.COMPANY_MAIL_SMTP_PORT || 587);
  const user = process.env.COMPANY_MAIL_SMTP_USER;
  const pass = process.env.COMPANY_MAIL_SMTP_PASS;
  const secure = String(process.env.COMPANY_MAIL_SMTP_SECURE || "false") === "true";

  console.log("[getTransporter] env check", {
    host,
    port,
    secure,
    user,
    from: process.env.COMPANY_MAIL_FROM_ADDRESS,
  });

  if (!host || !user || !pass) {
    throw new Error("SMTP 환경변수가 설정되지 않았습니다.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

async function sendVerificationEmail({ to, code }) {
  const transporter = getTransporter();

  const fromName = process.env.COMPANY_MAIL_FROM_NAME || "차밍수프";
  const fromAddress =
    process.env.COMPANY_MAIL_FROM_ADDRESS || process.env.COMPANY_MAIL_SMTP_USER;

  console.log("[sendVerificationEmail] before send", {
    to,
    fromAddress,
  });

  const result = await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject: "[차밍수프] 회사 이메일 인증번호",
    html: `
      <div style="font-family: Arial, Apple SD Gothic Neo, Malgun Gothic, sans-serif; padding: 24px; color: #111827;">
        <h2 style="margin: 0 0 16px; font-size: 22px;">회사 이메일 인증번호</h2>
        <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6;">
          아래 인증번호 6자리를 입력해주세요.
        </p>
        <div style="margin: 20px 0; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">
          ${code}
        </div>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          인증번호는 5분 동안 유효합니다.
        </p>
      </div>
    `,
  });

  console.log("[sendVerificationEmail] sent", {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  });
}

function getSigningSecret() {
  const secret = process.env.COMPANY_VERIFICATION_SIGNING_SECRET;
  if (!secret) {
    throw new Error("COMPANY_VERIFICATION_SIGNING_SECRET 환경변수가 설정되지 않았습니다.");
  }
  return secret;
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input) {
  const normalized = String(input)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function signPayload(payload) {
  const secret = getSigningSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

function createVerificationToken(payloadObj) {
  const payload = base64UrlEncode(JSON.stringify(payloadObj));
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function verifyVerificationToken(token) {
  const raw = String(token || "");
  const [payload, signature] = raw.split(".");

  if (!payload || !signature) {
    throw new HttpsError("invalid-argument", "유효하지 않은 인증 토큰입니다.");
  }

  const expected = signPayload(payload);
  if (expected !== signature) {
    throw new HttpsError("permission-denied", "인증 토큰 서명이 올바르지 않습니다.");
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payload));
    return decoded;
  } catch (error) {
    throw new HttpsError("invalid-argument", "인증 토큰을 해석할 수 없습니다.");
  }
}

const sendCompanyVerificationCode = onCall(
  {
    region: "asia-northeast3",
    cors: true,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = request.auth.uid;
    const email = normalizeEmail(request.data?.email);

    console.log("[sendCompanyVerificationCode] start", { uid, email });

    if (!email) {
      throw new HttpsError("invalid-argument", "회사 이메일을 입력해주세요.");
    }

    if (!isCorporateEmail(email)) {
      throw new HttpsError("invalid-argument", "개인 메일이 아닌 회사 이메일을 입력해주세요.");
    }

    const code = generateCode();
    const expiresAtMs = Date.now() + VERIFICATION_TTL_MS;

    try {
      await sendVerificationEmail({ to: email, code });

      const verificationToken = createVerificationToken({
        uid,
        email,
        codeHash: hashCode(code),
        expiresAtMs,
        companyNameGuess: getCompanyNameFromEmail(email),
      });

      return {
        ok: true,
        email,
        expiresInSec: Math.floor(VERIFICATION_TTL_MS / 1000),
        verificationToken,
      };
    } catch (error) {
      console.error("[sendCompanyVerificationCode] error name:", error?.name);
      console.error("[sendCompanyVerificationCode] error code:", error?.code);
      console.error("[sendCompanyVerificationCode] error message:", error?.message);
      console.error("[sendCompanyVerificationCode] full error:", error);
      throw new HttpsError("internal", "인증번호 전송 중 오류가 발생했습니다.");
    }
  }
);

const verifyCompanyVerificationCode = onCall(
  {
    region: "asia-northeast3",
    cors: true,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = request.auth.uid;
    const email = normalizeEmail(request.data?.email);
    const code = String(request.data?.code || "").trim();
    const verificationToken = String(request.data?.verificationToken || "").trim();

    if (!email || !code || !verificationToken) {
      throw new HttpsError("invalid-argument", "이메일, 인증번호, 인증토큰이 필요합니다.");
    }

    if (code.length !== 6) {
      throw new HttpsError("invalid-argument", "인증번호 6자리를 입력해주세요.");
    }

    try {
      const tokenData = verifyVerificationToken(verificationToken);

      if (tokenData.uid !== uid) {
        throw new HttpsError("permission-denied", "토큰 소유자가 일치하지 않습니다.");
      }

      if (normalizeEmail(tokenData.email) !== email) {
        throw new HttpsError("failed-precondition", "인증 요청 이메일이 일치하지 않습니다.");
      }

      if (!tokenData.expiresAtMs || Date.now() > Number(tokenData.expiresAtMs)) {
        throw new HttpsError("deadline-exceeded", "인증번호 유효시간이 만료되었습니다.");
      }

      if (tokenData.codeHash !== hashCode(code)) {
        throw new HttpsError("invalid-argument", "인증번호가 올바르지 않습니다.");
      }

      return {
        ok: true,
        email,
        companyNameGuess: tokenData.companyNameGuess || getCompanyNameFromEmail(email),
      };
    } catch (error) {
      console.error("[verifyCompanyVerificationCode] error:", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", "인증 확인 중 오류가 발생했습니다.");
    }
  }
);

module.exports = {
  sendCompanyVerificationCode,
  verifyCompanyVerificationCode,
};