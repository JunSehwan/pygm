const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const CryptoJS = require("crypto-js");
const dayjs = require("dayjs");
const logger = require("firebase-functions/logger");
const serviceAccount = require("./serviceAccountKey.json");
const apps = express();

// Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
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
      const { to, message, subject } = req.body;

      if (!to || !message) {
        res.status(400).json({ error: "Missing 'to' or 'message'" });
        return;
      }

      // 환경변수 불러오기
      const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
      const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
      const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
      const from = (process.env.NEXT_PUBLIC_MY_NUM || "").replace(/[^0-9]/g, "");

      const method = "POST";
      const space = " ";
      const newLine = "\n";
      const urlPath = `/sms/v2/services/${serviceId}/messages`;
      const timestamp = Date.now().toString();

      // ✅ 문자 길이에 따라 자동으로 SMS/LMS 선택
      const messageType = message.length > 90 ? "LMS" : "SMS";

      // ✅ 시그니처 생성
      const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
      hmac.update(method);
      hmac.update(space);
      hmac.update(urlPath);
      hmac.update(newLine);
      hmac.update(timestamp);
      hmac.update(newLine);
      hmac.update(accessKey);
      const signature = hmac.finalize().toString(CryptoJS.enc.Base64);

      // ✅ 이모지 제거
      const cleanMessage = message.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, "");

      // ✅ 요청 본문
      const payload = {
        type: messageType,
        countryCode: "82",
        from,
        subject: subject || "피그말리온 안내",
        content: cleanMessage,
        messages: [{ to }],
      };

      // ✅ API 호출
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