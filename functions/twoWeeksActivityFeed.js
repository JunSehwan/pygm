const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");

const TEST_PHONES = new Set([
  "01000000001",
  "01000000002",
  "01000000003",
]);
const MAX_PUBLIC_ITEMS = 14;
const FETCH_LIMIT = 50;
const PUBLIC_JOB_CATEGORIES = new Set([
  "회사원",
  "공무원",
  "전문직",
  "자영업",
  "프리랜서",
  "학생",
  "기타",
]);

function clean(value = "", max = 40) {
  return String(value || "").trim().slice(0, max);
}

function onlyDigits(value = "") {
  return clean(value, 30).replace(/[^0-9]/g, "");
}

function getFullAge(basic = {}) {
  const birthDate = onlyDigits(basic?.birthDate).slice(0, 8);
  const birthYear = Number(birthDate.slice(0, 4) || basic?.birthYear);
  if (Number.isInteger(birthYear) && birthYear >= 1940 && birthYear <= 2010) {
    // Cloud Functions의 UTC 실행시간을 한국 날짜 기준으로 바꿔 경계일 오차를 막는다.
    const koreaNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const currentYear = koreaNow.getUTCFullYear();
    let age = currentYear - birthYear;

    if (birthDate.length === 8) {
      const currentMonthDay = Number(
        `${String(koreaNow.getUTCMonth() + 1).padStart(2, "0")}${String(
          koreaNow.getUTCDate()
        ).padStart(2, "0")}`
      );
      const birthMonthDay = Number(birthDate.slice(4));
      if (currentMonthDay < birthMonthDay) age -= 1;
    }

    if (age >= 18 && age <= 80) return age;
  }

  const storedAge = Number(basic?.age);
  if (Number.isFinite(storedAge) && storedAge >= 18 && storedAge <= 80) {
    return Math.floor(storedAge);
  }

  return null;
}

function toAgeGroup(age) {
  if (!Number.isFinite(age)) return "";
  const decade = Math.floor(age / 10) * 10;
  const lastDigit = age % 10;
  const range = lastDigit <= 3 ? "초반" : lastDigit <= 6 ? "중반" : "후반";
  return `${decade}대 ${range}`;
}

function toGenderLabel(value = "") {
  const normalized = clean(value, 20).toLowerCase();
  if (["female", "f", "woman", "여성", "여자"].includes(normalized)) return "여성";
  if (["male", "m", "man", "남성", "남자"].includes(normalized)) return "남성";
  return "";
}

function toJobLabel(identity = {}) {
  const category = clean(identity?.jobCategory, 20);
  return PUBLIC_JOB_CATEGORIES.has(category) ? category : "";
}

function toAreaLabel(basic = {}) {
  const values = [
    basic?.preferredArea,
    ...(Array.isArray(basic?.activityAreas) ? basic.activityAreas : []),
  ];

  for (const value of values) {
    const candidate = clean(value, 30);
    if (!candidate) continue;

    const district = candidate.match(/[가-힣]{1,8}(?:구|시|군)/)?.[0];
    if (district) return district;

    const safe = candidate.replace(/[^가-힣0-9 ]/g, "").trim().slice(0, 10);
    if (safe) return safe;
  }

  return "";
}

function toStatusLabel(application = {}) {
  const reviewStatus = clean(application?.reviewStatus, 30).toLowerCase();
  const matchingStatus = clean(application?.matchingStatus, 30).toLowerCase();
  const status = clean(application?.status, 30).toLowerCase();

  if (
    [reviewStatus, matchingStatus, status].some((value) =>
      ["withdrawn", "rejected", "deleted", "blocked", "declined"].includes(value)
    )
  ) {
    return "";
  }

  if (["pending", "reviewing"].includes(reviewStatus)) return "신청완료";
  if (reviewStatus !== "approved" && status !== "approved") return "";

  if (
    ["confirmed", "completed"].includes(matchingStatus) ||
    status === "confirmed"
  ) {
    return "만남확정";
  }
  if (
    [
      "matched",
      "matcheddraft",
      "proposed",
      "accepted",
      "bothaccepted",
      "mutualaccepted",
      "scheduling",
    ].includes(matchingStatus) ||
    status === "proposed" ||
    application?.currentProposal?.candidateApplicationId
  ) {
    return "매칭진행";
  }
  if (matchingStatus === "not_started") return "매칭대기";
  if (["not_ready", ""].includes(matchingStatus)) return "승인완료";

  return "";
}

function isTestApplication(application = {}) {
  const phones = [
    application?.basic?.phoneNormalized,
    application?.basic?.phone,
    application?.phoneIdentityVerification?.phone,
  ].map(onlyDigits);

  return application?.testMode === true || phones.some((phone) => TEST_PHONES.has(phone));
}

function toPublicItem(application = {}) {
  if (isTestApplication(application)) return null;

  const ageGroup = toAgeGroup(getFullAge(application?.basic || {}));
  const gender = toGenderLabel(application?.basic?.gender);
  const job = toJobLabel(application?.identity || {});
  const area = toAreaLabel(application?.basic || {});
  const status = toStatusLabel(application);

  if (!ageGroup || !gender || !job || !area || !status) return null;
  return { ageGroup, gender, job, area, status };
}

exports.getTwoWeeksActivityFeed = onRequest(
  {
    region: "asia-northeast3",
    cors: true,
    maxInstances: 10,
  },
  async (request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Cache-Control", "public, max-age=180, s-maxage=300");

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "GET") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const snapshot = await admin
        .firestore()
        .collection("twoweeksApplications")
        .orderBy("createdAt", "desc")
        .limit(FETCH_LIMIT)
        .select(
          "uid",
          "testMode",
          "status",
          "reviewStatus",
          "matchingStatus",
          "createdAt",
          "basic.age",
          "basic.birthDate",
          "basic.birthYear",
          "basic.gender",
          "basic.preferredArea",
          "basic.activityAreas",
          "basic.phoneNormalized",
          "basic.phone",
          "phoneIdentityVerification.phone",
          "identity.jobCategory",
          "currentProposal.candidateApplicationId"
        )
        .get();

      const items = [];
      const seenOwners = new Set();

      for (const document of snapshot.docs) {
        const application = document.data() || {};
        const ownerKey = clean(application?.uid || document.id, 160);
        if (!ownerKey || seenOwners.has(ownerKey)) continue;

        const publicItem = toPublicItem(application);
        if (!publicItem) continue;

        seenOwners.add(ownerKey);
        items.push(publicItem);
        if (items.length >= MAX_PUBLIC_ITEMS) break;
      }

      response.status(200).json({ items });
    } catch (error) {
      console.error("[getTwoWeeksActivityFeed] failed", error);
      response.status(500).json({ error: "Failed to load activity feed" });
    }
  }
);

exports.__testables = {
  getFullAge,
  toAgeGroup,
  toGenderLabel,
  toJobLabel,
  toAreaLabel,
  toStatusLabel,
  isTestApplication,
  toPublicItem,
};
