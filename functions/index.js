const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const CryptoJS = require("crypto-js");
const dayjs = require("dayjs");
const logger = require("firebase-functions/logger");
const apps = express();

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Firebase 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

apps.use(cors());
// Cloud Functions 전역 옵션
functions.setGlobalOptions({
  region: "asia-northeast3",
  maxInstances: 10,
});

const log = functions.logger;


// ✅ 테스트용 Function
exports.test = functions.https.onRequest((req, res) => {
  res.send("Hello World from Firebase Functions!");
});

// ✅ 간단한 호출형 Function (테스트용)
exports.getGreeting = functions.https.onCall((request) => {
  return "Hello, world!";
});

// ✅ sitemap.xml 생성기
apps.get("/sitemap.xml", async (req, res) => {
  const header = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  const footer = `</urlset>`;

  const urls = [
    `<url><loc>https://pygm.co.kr</loc><lastmod>2025-10-01</lastmod></url>`,
    `<url><loc>https://pygm.co.kr/date/cards</loc><lastmod>2025-10-01</lastmod></url>`,
    `<url><loc>https://pygm.co.kr/date/profile</loc><lastmod>2025-10-01</lastmod></url>`,
  ];

  const sitemap = header + urls.join("") + footer;
  res.set("Content-Type", "text/xml");
  res.status(200).send(sitemap);
});

exports.myApp = functions.https.onRequest(apps);


// ✅ 네이버 SMS 발송 Function
const { onRequest } = require("firebase-functions/v2/https");

exports.sendSms = onRequest(
  { region: "asia-northeast3", cors: true },
  async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    try {
      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({ error: "Missing 'to' or 'message' field" });
      }
      
      const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
      const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
      const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
      const from = (process.env.NEXT_PUBLIC_MY_NUM || "").replace(/[^0-9]/g, "");
      // const from = process.env.NEXT_PUBLIC_MY_NUM;

      if (!serviceId || !accessKey || !secretKey || !from) {
        return res.status(500).json({ error: "Missing environment variables" });
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
        messages: [{ to }],
      };

      const response = await axios.post(url, body, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "x-ncp-iam-access-key": accessKey,
          "x-ncp-apigw-timestamp": timestamp,
          "x-ncp-apigw-signature-v2": signature,
        },
      });

      return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      console.error("SMS 전송 실패:", error.response?.data || error.message);
      return res.status(400).json({
        error: "Failed to send SMS",
        details: error.response?.data || error.message,
      });
    }
  }
);
// ✅ LMS 발송 (v2 버전)
exports.sendLms = onRequest(
  { region: "asia-northeast3", cors: true },
  async (req, res) => {
    try {
      const { to, message, subject, forceLms } = req.body;

      if (!to || !message) {
        res.status(400).json({ error: "Missing 'to' or 'message'" });
        return;
      }

      const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
      const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
      const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
      const from = (process.env.NEXT_PUBLIC_MY_NUM || "").replace(/[^0-9]/g, "");

      const method = "POST";
      const space = " ";
      const newLine = "\n";
      const urlPath = `/sms/v2/services/${serviceId}/messages`;
      const timestamp = Date.now().toString();

      const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
      hmac.update(method);
      hmac.update(space);
      hmac.update(urlPath);
      hmac.update(newLine);
      hmac.update(timestamp);
      hmac.update(newLine);
      hmac.update(accessKey);
      const signature = hmac.finalize().toString(CryptoJS.enc.Base64);

      const cleanMessage = String(message || "").replace(
        /([\uD800-\uDBFF][\uDC00-\uDFFF])/g,
        ""
      );

      const getByteLength = (str = "") =>
        Buffer.byteLength(String(str), "utf8");

      const messageType =
        forceLms || getByteLength(cleanMessage) > 90 ? "LMS" : "SMS";

      const payload = {
        type: messageType,
        countryCode: "82",
        from,
        subject: subject || "피그말리온 안내",
        content: cleanMessage,
        messages: [{ to }],
      };

      const response = await axios.post(
        `https://sens.apigw.ntruss.com${urlPath}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-ncp-iam-access-key": accessKey,
            "x-ncp-apigw-timestamp": timestamp,
            "x-ncp-apigw-signature-v2": signature,
          },
        }
      );

      logger.info("✅ LMS 전송 성공:", response.data);
      res.status(200).json({ success: true, data: response.data });
    } catch (error) {
      logger.error("❌ LMS 전송 실패:", error.response?.data || error.message);
      res.status(400).json({
        error: "Failed to send LMS",
        details: error.response?.data || error.message,
      });
    }
  }
);

// 이미 admin.initializeApp() 되어 있으면 중복 호출하지 마세요.
const PORTONE_API_SECRET = defineSecret("PORTONE_API_SECRET");

exports.verifyIdentityResult = onCall(
  {
    region: "asia-northeast3",
    secrets: [PORTONE_API_SECRET],
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      const data = request.data || {};
      const { identityVerificationId, requestedPhone } = data;

      if (!identityVerificationId) {
        throw new HttpsError(
          "invalid-argument",
          "identityVerificationId가 필요합니다."
        );
      }

      const portoneSecret = PORTONE_API_SECRET.value();
      if (!portoneSecret) {
        throw new HttpsError(
          "failed-precondition",
          "PortOne API Secret이 설정되지 않았습니다."
        );
      }

      const endpoint =
        "https://api.portone.io/identity-verifications/" +
        encodeURIComponent(identityVerificationId);

      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `PortOne ${portoneSecret}`,
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("PortOne API error:", json);
        throw new HttpsError("internal", "포트원 인증결과 조회 실패");
      }

      const verification = json?.identityVerification || json?.data || json;

      const status =
        verification?.status ||
        verification?.identityVerificationStatus ||
        verification?.result ||
        "";

      const isVerified =
        status === "VERIFIED" ||
        status === "SUCCEEDED" ||
        status === "COMPLETED" ||
        verification?.verified === true;

      if (!isVerified) {
        return {
          verified: false,
          message: "본인인증이 완료 상태가 아닙니다.",
          status,
        };
      }

      const phone =
        verification?.phone ||
        verification?.phoneNumber ||
        verification?.customer?.phoneNumber ||
        "";

      const name =
        verification?.name ||
        verification?.fullName ||
        verification?.customer?.fullName ||
        "";

      const birth =
        verification?.birth ||
        verification?.birthDate ||
        verification?.birthday ||
        "";

      let gender = verification?.gender || "";
      if (gender === "M" || gender === "male") gender = "male";
      if (gender === "F" || gender === "female") gender = "female";

      const carrier = verification?.carrier || verification?.telecom || "";
      const ci = verification?.ci || verification?.CI || "";
      const di = verification?.di || verification?.DI || "";

      // 입력번호와 결과번호 비교
      if (requestedPhone && phone) {
        const req = String(requestedPhone).replace(/[^0-9]/g, "");
        const got = String(phone).replace(/[^0-9]/g, "");
        if (req && got && req !== got) {
          return {
            verified: false,
            message: "입력한 연락처와 본인인증 결과 연락처가 일치하지 않습니다.",
          };
        }
      }

      return {
        verified: true,
        provider: "PORTONE",
        phone,
        name,
        birth,
        gender,
        carrier,
        ci,
        di,
      };
    } catch (err) {
      console.error("verifyIdentityResult error:", err);

      if (err instanceof HttpsError) throw err;

      throw new HttpsError(
        "internal",
        err?.message || "본인인증 검증 중 오류가 발생했습니다."
      );
    }
  }
);

const {
  sendCompanyVerificationCode,
  verifyCompanyVerificationCode,
} = require("./companyVerification");

const {
  sendPasswordResetCodeByPhone,
  verifyPasswordResetCodeByPhone,
  completePasswordResetByPhone,
} = require("./passwordResetPhone");

const { deleteCurrentUserAccount } = require("./accountDelete");

exports.expireArenaInterests = require("./arenaInterestExpiry").expireArenaInterests;

exports.sendCompanyVerificationCode = sendCompanyVerificationCode;
exports.verifyCompanyVerificationCode = verifyCompanyVerificationCode;

exports.sendPasswordResetCodeByPhone = sendPasswordResetCodeByPhone;
exports.verifyPasswordResetCodeByPhone = verifyPasswordResetCodeByPhone;
exports.completePasswordResetByPhone = completePasswordResetByPhone;


exports.deleteCurrentUserAccount = deleteCurrentUserAccount;