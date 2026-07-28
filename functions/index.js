const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const CryptoJS = require("crypto-js");
const dayjs = require("dayjs");
const logger = require("firebase-functions/logger");
const apps = express();

const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
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

exports.checkPhoneDuplicate = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    const phone = String(request.data?.phone || "").replace(/[^0-9]/g, "");

    if (!phone) {
      throw new HttpsError("invalid-argument", "연락처가 필요합니다.");
    }

    try {
      const snap = await admin
        .firestore()
        .collection("users")
        .where("phonenumber", "==", phone)
        .limit(1)
        .get();

      return {
        exists: !snap.empty,
      };
    } catch (error) {
      console.error("[checkPhoneDuplicate] error:", error);
      throw new HttpsError(
        "internal",
        "연락처 중복 확인 중 오류가 발생했습니다."
      );
    }
  }
);

exports.getPublicMemberCount = onRequest(
  { region: "asia-northeast3", cors: true },
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Cache-Control", "public, max-age=60, s-maxage=60");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const snap = await admin.firestore().collection("users").count().get();
      const count = Number(snap.data()?.count || 0);

      res.status(200).json({
        count: Number.isFinite(count) ? count : 0,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[getPublicMemberCount] error:", error);
      res.status(500).json({ error: "Failed to load member count" });
    }
  }
);

// ✅ sitemap.xml 생성기
apps.get("/sitemap.xml", async (req, res) => {
  const SITE_URL = "https://charmingsoup.com";
  const today = new Date().toISOString().slice(0, 10);

  const publicRoutes = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/signup", priority: "0.8", changefreq: "monthly" },
    { path: "/login", priority: "0.4", changefreq: "monthly" },
    { path: "/welcome", priority: "0.7", changefreq: "monthly" },
    { path: "/tests/style", priority: "0.9", changefreq: "weekly" },
    { path: "/about/service", priority: "0.7", changefreq: "monthly" },
    { path: "/about/spoon", priority: "0.6", changefreq: "monthly" },
    { path: "/about/privacy", priority: "0.3", changefreq: "yearly" },
  ];

  const urls = publicRoutes
    .map(({ path, priority, changefreq }) => {
      const loc = `${SITE_URL}${path === "/" ? "" : path}`;

      return `
        <url>
          <loc>${loc}</loc>
          <lastmod>${today}</lastmod>
          <changefreq>${changefreq}</changefreq>
          <priority>${priority}</priority>
        </url>
      `;
    })
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  res.set("Content-Type", "application/xml");
  res.status(200).send(sitemap);
});

exports.myApp = functions.https.onRequest(apps);


// ✅ 네이버 SMS 발송 Function
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
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const onlyDigits = (value = "") => String(value || "").replace(/[^0-9]/g, "");

    const pickFirst = (...values) => {
      for (const value of values) {
        if (value === undefined || value === null) continue;

        const text = String(value).trim();

        if (text) return text;
      }

      return "";
    };

    const normalizeGenderForSignup = (value = "") => {
      const raw = String(value || "").trim();
      const lower = raw.toLowerCase();

      if (
        raw === "1" ||
        raw === "3" ||
        lower === "m" ||
        lower === "male" ||
        lower === "man" ||
        lower === "남" ||
        lower === "남자" ||
        lower === "남성"
      ) {
        return "male";
      }

      if (
        raw === "2" ||
        raw === "4" ||
        lower === "f" ||
        lower === "female" ||
        lower === "woman" ||
        lower === "여" ||
        lower === "여자" ||
        lower === "여성"
      ) {
        return "female";
      }

      return "";
    };

    const normalizeBirthForSignup = (...values) => {
      for (const value of values) {
        const only = onlyDigits(value);

        if (only.length === 8) {
          return only;
        }

        if (only.length === 6) {
          // 혹시 YYMMDD만 내려오는 예외 케이스 대응
          const yy = Number(only.slice(0, 2));
          const currentYY = Number(String(new Date().getFullYear()).slice(2));
          const prefix = yy > currentYY ? "19" : "20";
          return `${prefix}${only}`;
        }
      }

      return "";
    };

    const normalizeBirthFromParts = (year, month, day) => {
      const y = onlyDigits(year);
      const m = onlyDigits(month).padStart(2, "0");
      const d = onlyDigits(day).padStart(2, "0");

      if (y.length === 4 && m.length === 2 && d.length === 2) {
        return `${y}${m}${d}`;
      }

      return "";
    };

    const getNestedCandidates = (verification) => {
      return [
        verification,
        verification?.customer,
        verification?.verifiedCustomer,
        verification?.requestedCustomer,
        verification?.identityVerification?.customer,
        verification?.identityVerification?.verifiedCustomer,
        verification?.identityVerification?.requestedCustomer,
        verification?.data,
        verification?.data?.customer,
        verification?.data?.verifiedCustomer,
        verification?.data?.requestedCustomer,
      ].filter(Boolean);
    };

    const extractIdentityInfo = (verification) => {
      const candidates = getNestedCandidates(verification);

      const findValue = (...keys) => {
        for (const obj of candidates) {
          for (const key of keys) {
            const value = obj?.[key];

            if (value !== undefined && value !== null && String(value).trim()) {
              return value;
            }
          }
        }

        return "";
      };

      const name = pickFirst(
        findValue("name", "fullName", "customerName", "username"),
        verification?.customer?.name,
        verification?.customer?.fullName,
        verification?.verifiedCustomer?.name,
        verification?.requestedCustomer?.name
      );

      const phone = pickFirst(
        findValue("phone", "phoneNumber", "mobile", "mobileNumber", "tel"),
        verification?.customer?.phoneNumber,
        verification?.verifiedCustomer?.phoneNumber,
        verification?.requestedCustomer?.phoneNumber
      );

      const gender = normalizeGenderForSignup(
        pickFirst(
          findValue("gender", "sex"),
          verification?.customer?.gender,
          verification?.verifiedCustomer?.gender,
          verification?.requestedCustomer?.gender
        )
      );

      const birthFromParts =
        normalizeBirthFromParts(
          findValue("birthYear", "birth_year", "year"),
          findValue("birthMonth", "birth_month", "month"),
          findValue("birthDay", "birthDate", "birth_day", "day")
        ) ||
        normalizeBirthFromParts(
          verification?.customer?.birthYear,
          verification?.customer?.birthMonth,
          verification?.customer?.birthDay
        ) ||
        normalizeBirthFromParts(
          verification?.verifiedCustomer?.birthYear,
          verification?.verifiedCustomer?.birthMonth,
          verification?.verifiedCustomer?.birthDay
        ) ||
        normalizeBirthFromParts(
          verification?.requestedCustomer?.birthYear,
          verification?.requestedCustomer?.birthMonth,
          verification?.requestedCustomer?.birthDay
        );

      const birth =
        birthFromParts ||
        normalizeBirthForSignup(
          findValue(
            "birth",
            "birthday",
            "birthDate",
            "dateOfBirth",
            "birth_day",
            "birthdate"
          ),
          verification?.customer?.birthDate,
          verification?.customer?.birthday,
          verification?.verifiedCustomer?.birthDate,
          verification?.verifiedCustomer?.birthday,
          verification?.requestedCustomer?.birthDate,
          verification?.requestedCustomer?.birthday
        );

      const carrier = pickFirst(
        findValue("carrier", "operator", "telecom"),
        verification?.customer?.operator,
        verification?.verifiedCustomer?.operator,
        verification?.requestedCustomer?.operator
      );

      const ci = pickFirst(
        findValue("ci", "CI", "customerUniqueId"),
        verification?.customer?.ci,
        verification?.verifiedCustomer?.ci
      );

      const di = pickFirst(
        findValue("di", "DI", "customerId"),
        verification?.customer?.di,
        verification?.verifiedCustomer?.di
      );

      return {
        phone: onlyDigits(phone),
        name,
        birth,
        gender,
        carrier,
        ci,
        di,
      };
    };

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

      let lastJson = null;
      let lastStatusCode = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const res = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `PortOne ${portoneSecret}`,
            "Content-Type": "application/json",
          },
        });

        const json = await res.json().catch(() => ({}));

        lastJson = json;
        lastStatusCode = res.status;

        if (res.ok) {
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

          if (!isVerified && attempt < 4) {
            await sleep(1200);
            continue;
          }

          if (!isVerified) {
            return {
              verified: false,
              message: "본인인증이 완료 상태가 아닙니다.",
              status,
            };
          }

          const identity = extractIdentityInfo(verification);

          if (requestedPhone && identity.phone) {
            const req = onlyDigits(requestedPhone);
            const got = onlyDigits(identity.phone);

            if (req && got && req !== got) {
              return {
                verified: false,
                message:
                  "입력한 연락처와 본인인증 결과 연락처가 일치하지 않습니다.",
              };
            }
          }

          // 디버깅용: 민감정보 원문은 남기지 않고 어떤 필드가 잡혔는지만 확인
          console.log("[verifyIdentityResult] extracted fields", {
            hasPhone: !!identity.phone,
            hasName: !!identity.name,
            hasBirth: !!identity.birth,
            hasGender: !!identity.gender,
            status,
            topLevelKeys: Object.keys(verification || {}).slice(0, 50),
            customerKeys: Object.keys(verification?.customer || {}).slice(0, 50),
            verifiedCustomerKeys: Object.keys(
              verification?.verifiedCustomer || {}
            ).slice(0, 50),
            requestedCustomerKeys: Object.keys(
              verification?.requestedCustomer || {}
            ).slice(0, 50),
          });

          return {
            verified: true,
            provider: "PORTONE",
            phone: identity.phone,
            name: identity.name,
            birth: identity.birth,
            gender: identity.gender,
            carrier: identity.carrier,
            ci: identity.ci,
            di: identity.di,
          };
        }

        if (attempt < 4) {
          await sleep(1200);
        }
      }

      console.error("PortOne API error:", {
        status: lastStatusCode,
        json: lastJson,
      });

      throw new HttpsError("internal", "포트원 인증결과 조회 실패");
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


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const ADMIN_CARD_CATEGORY_LABEL_MAP = {
  sense: "센스",
  value: "가치관",
  date: "연애",
  lifestyle: "생활",
  marriage: "결혼관",
};

const ADMIN_TOPIC_BUCKETS = [
  "first_impression",
  "texting",
  "flirting",
  "values",
  "jealousy",
  "lifestyle",
  "money",
  "marriage",
  "family",
  "social",
  "dating_manners",
  "conflict",
  "boundaries",
  "confidence",
  "sns",
  "ex_relationship",
  "talking_style",
  "emotional_maturity",
  "self_awareness",
  "greenflag_redflag",
  "long_distance",
  "apology",
  "career",
];

function normalizeAdminQuestionType(value = "") {
  if (value === "multiple") return "choice";
  if (value === "subjective") return "text";
  if (value === "choice") return "choice";
  if (value === "text") return "text";
  return "choice";
}

function normalizeAdminCategory(value = "") {
  const safe = String(value || "").trim();
  if (ADMIN_CARD_CATEGORY_LABEL_MAP[safe]) return safe;
  return "sense";
}

function normalizeAdminText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeAdminCompactText(value = "") {
  return normalizeAdminText(value).replace(/\s+/g, "");
}

function getAdminOptionSignature(options = []) {
  return (Array.isArray(options) ? options : [])
    .map((item) => normalizeAdminCompactText(item))
    .filter(Boolean)
    .join("|");
}

function getAdminTopicSignature(draft = {}) {
  return String(draft?.topicKey || "").trim().toLowerCase();
}

function getAdminKeywordSignature(draft = {}) {
  const text = `${draft?.title || ""} ${draft?.body || ""} ${draft?.guide || ""}`;
  const tokens = normalizeAdminText(text)
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (item) =>
        item.length >= 2 &&
        ![
          "나는",
          "당신은",
          "상대가",
          "연애",
          "소개팅",
          "상황",
          "가장",
          "무엇",
          "어떻게",
          "답해주세요",
          "골라보세요",
          "선택지",
        ].includes(item)
    );

  return [...new Set(tokens)].sort().slice(0, 8).join("|");
}

function isTooGenericAdminTitle(title = "") {
  const t = normalizeAdminText(title);
  const banned = [
    "연락 스타일",
    "전애인 연락",
    "더치페이",
    "결혼 생각",
    "술",
    "흡연",
    "연락 빈도",
    "소개팅 매너",
  ];
  return banned.some((item) => t.includes(normalizeAdminText(item)));
}

function hasDuplicateAdminOptions(options = []) {
  const normalized = options
    .map((item) => normalizeAdminCompactText(item))
    .filter(Boolean);
  return new Set(normalized).size !== normalized.length;
}

function isWeakAdminChoicePattern(options = []) {
  const normalized = options.map((item) => normalizeAdminText(item));
  const weakWords = [
    "상관없다",
    "상황에 따라 다르다",
    "괜찮다",
    "싫다",
    "별로다",
    "안 된다",
  ];
  const weakCount = normalized.filter((item) =>
    weakWords.some((word) => item.includes(word))
  ).length;
  return weakCount >= 2;
}

function compactAdminCard(card) {
  return {
    title: card?.title || "",
    body: card?.body || "",
    guide: card?.guide || "",
    category: card?.category || "",
    questionType: normalizeAdminQuestionType(card?.questionType),
    options: Array.isArray(card?.options) ? card.options : [],
    topicKey: card?.topicKey || "",
    topicBucket: card?.topicBucket || "",
    angleKey: card?.angleKey || "",
  };
}

function normalizeAdminDraft(raw, seedTag = "ai") {
  const questionType = normalizeAdminQuestionType(raw?.questionType);
  const category = normalizeAdminCategory(raw?.category);
  const options = Array.isArray(raw?.options)
    ? raw.options
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 4)
    : [];

  return {
    id: `${seedTag}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: String(raw?.title || "").trim(),
    body: String(raw?.body || "").trim(),
    guide: String(raw?.guide || "").trim(),
    questionType,
    category,
    categoryLabel: ADMIN_CARD_CATEGORY_LABEL_MAP[category],
    visibilityTarget: "male",
    source: "ai",
    options: questionType === "choice" ? options : [],
    topicKey: String(raw?.topicKey || "").trim(),
    topicBucket: String(raw?.topicBucket || "").trim(),
    angleKey: String(raw?.angleKey || "").trim(),
    viralWhy: String(raw?.viralWhy || "").trim(),
    targetReaction: String(raw?.targetReaction || "").trim(),
  };
}

function validateAdminDraft(draft, comparePool = []) {
  if (!draft.title || draft.title.length < 8) return false;
  if (!draft.body || draft.body.length < 12) return false;
  if (!draft.topicKey || draft.topicKey.length < 5) return false;
  if (!draft.topicBucket || draft.topicBucket.length < 3) return false;
  if (isTooGenericAdminTitle(draft.title)) return false;

  if (draft.questionType === "choice") {
    if (!Array.isArray(draft.options) || draft.options.length !== 4) return false;
    if (hasDuplicateAdminOptions(draft.options)) return false;
    if (isWeakAdminChoicePattern(draft.options)) return false;
  }

  const compareTopicSignatures = new Set(
    comparePool.map(getAdminTopicSignature).filter(Boolean)
  );
  const compareKeywordSignatures = new Set(
    comparePool.map(getAdminKeywordSignature).filter(Boolean)
  );
  const compareOptionSignatures = new Set(
    comparePool
      .filter((item) => normalizeAdminQuestionType(item?.questionType) === "choice")
      .map((item) => getAdminOptionSignature(item?.options || []))
      .filter(Boolean)
  );

  if (compareTopicSignatures.has(getAdminTopicSignature(draft))) return false;
  if (compareKeywordSignatures.has(getAdminKeywordSignature(draft))) return false;

  if (
    draft.questionType === "choice" &&
    compareOptionSignatures.has(getAdminOptionSignature(draft.options || []))
  ) {
    return false;
  }

  return true;
}

function buildAdminPrompt({
  count,
  existingCards = [],
  currentDrafts = [],
  excludedTopicKeys = [],
  categoryHint = "",
}) {
  const comparePool = [...existingCards, ...currentDrafts]
    .map(compactAdminCard)
    .slice(-150);

  const suggestedCount = Math.max(count * 3, 6);

  return `
너는 차밍수프 admin에서 차밍카드 추천 초안을 만드는 한국어 에디터야.

목표:
- 남성이 답하고 싶어지는 질문
- 여성 입장에서 답변을 보고 사람 판단이 쉬운 질문
- 너무 흔한 밸런스게임 금지
- 친구끼리도 의견이 갈릴 만한 "현실 연애 질문" 우선
- 댓글/반응이 붙을 만한 산뜻한 질문
- 제목만 다르고 내용이 같은 재탕 금지
- 최근 카드와 topicKey가 겹치면 안 됨
- 혐오/선정성/과도한 자극 금지

이번에는 최종 ${count}개가 필요하지만,
후보는 ${suggestedCount}개를 먼저 만들어도 된다.

카테고리:
- sense
- value
- date
- lifestyle
- marriage

반드시 각 draft에 아래 필드를 포함해:
- title
- body
- guide
- questionType
- category
- options
- topicKey
- topicBucket
- angleKey
- viralWhy
- targetReaction

topicKey 규칙:
- 영어 소문자 snake_case
- 같은 의미 질문이면 절대 다른 topicKey로 포장하지 말 것

topicBucket 규칙:
- 아래 중 하나만 사용:
  ${ADMIN_TOPIC_BUCKETS.join(", ")}

다양성 규칙:
- 결과 후보들은 서로 완전히 다른 topicKey를 가져야 한다.
- 같은 topicBucket이 과도하게 반복되면 안 된다.
- "연락 / 호감표현 / 어색함" 계열은 전체 후보에서 최대 1개씩만 허용
- 돈, 가족, SNS, 갈등해결, 장거리, 사과 방식, 자기객관화 같은 비교적 다양한 소재를 섞어라
- 같은 category만 몰아서 만들지 말 것
- categoryHint가 주어지면 그 카테고리를 조금 더 우선하되, 나머지 카테고리도 섞어라

금지:
- 연락 빈도, 전애인 연락, 더치페이, 결혼 생각, 술/흡연 같은 너무 흔한 질문 반복
- "상관없다 / 상황에 따라 다르다 / 괜찮다 / 싫다" 같은 무성의한 선택지
- 같은 의미인데 제목만 바꾼 질문
- 설명 문장, 마크다운, 코드블록

응답 형식(JSON object only):
{
  "drafts": [
    {
      "title": "...",
      "body": "...",
      "guide": "...",
      "questionType": "choice" 또는 "text",
      "category": "sense|value|date|lifestyle|marriage",
      "options": ["...", "...", "...", "..."],
      "topicKey": "...",
      "topicBucket": "...",
      "angleKey": "...",
      "viralWhy": "...",
      "targetReaction": "..."
    }
  ]
}

categoryHint:
${categoryHint || "없음"}

excludedTopicKeys:
${JSON.stringify(excludedTopicKeys, null, 2)}

최근 카드/초안 참고:
${JSON.stringify(comparePool, null, 2)}

반드시 JSON object 하나만 출력해.
`;
}

async function requestAdminDraftsFromOpenAI({
  count,
  existingCards,
  currentDrafts,
  excludedTopicKeys,
  categoryHint,
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 1.15,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 차밍수프 admin용 차밍카드 추천 초안을 만드는 한국어 에디터다. 반드시 JSON object만 출력해야 하며, 중복 주제와 뻔한 연애 질문을 매우 싫어한다.",
        },
        {
          role: "user",
          content: `${buildAdminPrompt({
            count,
            existingCards,
            currentDrafts,
            excludedTopicKeys,
            categoryHint,
          })}\n\n반드시 유효한 JSON object로만 응답해.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OPENAI_ERROR: ${response.status} ${text}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(rawText);
  return Array.isArray(parsed?.drafts) ? parsed.drafts : [];
}

exports.recommendAdminCards = onCall(
  {
    region: "asia-northeast3",
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      if (!OPENAI_API_KEY) {
        throw new HttpsError(
          "failed-precondition",
          "OPENAI_API_KEY가 설정되지 않았어요."
        );
      }

      const {
        count = 1,
        existingCards = [],
        currentDrafts = [],
        excludedTopicKeys = [],
        categoryHint = "",
      } = request.data || {};

      const safeCount = Math.max(1, Math.min(Number(count || 1), 8));
      const comparePool = [...existingCards, ...currentDrafts].map(compactAdminCard);

      let accepted = [];
      let attempts = 0;

      while (accepted.length < safeCount && attempts < 4) {
        attempts += 1;

        const rawDrafts = await requestAdminDraftsFromOpenAI({
          count: safeCount - accepted.length,
          existingCards,
          currentDrafts: [...currentDrafts, ...accepted],
          excludedTopicKeys: [
            ...excludedTopicKeys,
            ...accepted.map((item) => item.topicKey).filter(Boolean),
          ],
          categoryHint,
        });

        const normalized = rawDrafts.map((item) =>
          normalizeAdminDraft(item, "ai")
        );

        for (const draft of normalized) {
          const valid = validateAdminDraft(draft, [...comparePool, ...accepted]);
          if (valid) {
            accepted.push(draft);
          }
          if (accepted.length >= safeCount) break;
        }
      }

      return {
        ok: true,
        drafts: accepted,
        source: "ai",
        attempts,
      };
    } catch (error) {
      console.error("[recommendAdminCards] error:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        error?.message || "추천 초안 생성 중 오류가 발생했어요."
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

// 3일마다 문자말송(만약에 남성 소개가 도착한다면..)
exports.scheduleArenaOffers = require("./arenaOfferScheduler").scheduleArenaOffers;

// 투윅스 만남 전날/당일 리마인드 문자
exports.sendTwoWeeksMeetingReminders = require("./twoWeeksMeetingReminders").sendTwoWeeksMeetingReminders;

// 투윅스 제안/일정 기한 만료 자동 처리
exports.processTwoWeeksDeadlineExpirations = require("./twoWeeksDeadlineExpirations").processTwoWeeksDeadlineExpirations;
