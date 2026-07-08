const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const ARENA_DURATION_MS = 72 * 60 * 60 * 1000;
const OFFER_COUNT = 2;
const CHARMINGSOUP_URL = "https://charmingsoup.com/arena";

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => safeString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getUserDocId(user = {}) {
  return user?.userID || user?.uid || user?.id || "";
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);

  if (typeof value === "string") {
    const normalized = value.replace(" ", "T");
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isProfileReviewPending(user = {}) {
  return (
    user?.date_pending === true ||
    user?.reviewStatus === "pending" ||
    user?.pendingStatus === "reviewing"
  );
}

function isArenaBlockedUser(user = {}) {
  return (
    user?.withdraw === true ||
    user?.sleep === true ||
    user?.date_sleep === true ||
    isProfileReviewPending(user) ||
    user?.date_profile_finished !== true
  );
}

function isArenaReceivePausedUser(user = {}) {
  return user?.arenaReceivePaused === true;
}

function isAdminMatchExposureBlocked(user = {}) {
  return user?.adminMatchExposureBlocked === true;
}

function getAge(user = {}) {
  if (user?.age && Number(user.age) > 1) return Number(user.age) - 1;
  if (user?.age && Number(user.age) > 0) return Number(user.age);

  const birthday = user?.birthday || {};
  const year = Number(birthday?.year || 0);
  const month = Number(birthday?.month || 0);
  const day = Number(birthday?.day || 0);

  if (!year || !month || !day) return "";

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasNotHadBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);

  if (hasNotHadBirthday) age -= 1;
  age -= 1;

  return age > 0 ? age : "";
}

function getStyleCode(user = {}) {
  if (user?.styleTest?.resultCode) return String(user.styleTest.resultCode).toUpperCase();
  if (user?.styleTest?.typeCode) return String(user.styleTest.typeCode).toUpperCase();
  if (user?.styleTest?.mbti) return String(user.styleTest.mbti).toUpperCase();

  const ei = safeString(user?.mbti_ei);
  const sn = safeString(user?.mbti_sn);
  const tf = safeString(user?.mbti_tf);
  const jp = safeString(user?.mbti_jp);

  if (ei && sn && tf && jp) {
    return `${ei}${sn}${tf}${jp}`.toUpperCase();
  }

  if (user?.mbti) return String(user.mbti).toUpperCase();

  return "";
}

function buildValuePreferenceSet(user = {}) {
  const preferences = [
    ...normalizeArray(user?.idealTypeList),
    ...normalizeArray(user?.preferTypeList),
    ...normalizeArray(user?.preferredValues),
  ];

  return new Set(preferences.map((item) => item.toLowerCase()));
}

function getValueSimilarityScore(femaleUser = {}, maleUser = {}) {
  const femaleSet = buildValuePreferenceSet(femaleUser);
  if (!femaleSet.size) return 0;

  const maleValues = [
    ...normalizeArray(maleUser?.idealTypeList),
    ...normalizeArray(maleUser?.preferTypeList),
    ...normalizeArray(maleUser?.preferredValues),
  ].map((item) => item.toLowerCase());

  if (!maleValues.length) return 0;

  const overlap = maleValues.filter((item) => femaleSet.has(item)).length;
  return Math.min(1, overlap / Math.max(3, femaleSet.size));
}

function getValueMatchPercent(femaleUser = {}, maleUser = {}) {
  const similarity = getValueSimilarityScore(femaleUser, maleUser);
  const percent = Math.round(similarity * 100);
  return Number.isFinite(percent) && percent > 0 ? percent : 85;
}

function getMbtiMatchBonus(femaleUser = {}, maleUser = {}) {
  const femaleMbti = getStyleCode(femaleUser);
  const maleMbti = getStyleCode(maleUser);

  if (!femaleMbti || !maleMbti) return 0;
  if (femaleMbti === maleMbti) return 8;

  let bonus = 0;
  if (femaleMbti[0] === maleMbti[0]) bonus += 2;
  if (femaleMbti[1] === maleMbti[1]) bonus += 2;
  if (femaleMbti[2] === maleMbti[2]) bonus += 2;
  if (femaleMbti[3] === maleMbti[3]) bonus += 2;

  return bonus;
}

function getPreferenceRateBonus(femaleUser = {}, maleUser = {}) {
  const female = Number(femaleUser?.preference_rate || 0);
  const male = Number(maleUser?.preference_rate || 0);

  if (!female || !male) return 0;

  const gap = Math.abs(female - male);
  if (gap <= 5) return 10;
  if (gap <= 10) return 6;
  if (gap <= 20) return 3;
  return 0;
}

function getAgeDistancePenalty(femaleUser = {}, maleUser = {}) {
  const femaleAge = getAge(femaleUser);
  const maleAge = getAge(maleUser);

  if (!femaleAge || !maleAge) return 0;

  const gap = Math.abs(Number(femaleAge) - Number(maleAge));
  if (gap <= 3) return 0;
  if (gap <= 6) return 5;
  if (gap <= 9) return 10;
  return 18;
}

function getLikeScore(user = {}) {
  return (
    Number(user?.charmingCardLikeReceivedCount || 0) ||
    Number(user?.charmingCardReceivedLikeCount || 0) ||
    Number(user?.receivedLikeCount || 0) ||
    Number(user?.wink || 0) ||
    Number(user?.infoseen || 0) * 0.02
  );
}

function getReportPenalty(user = {}) {
  const reportCount = Number(user?.reportCount || 0);
  const warningCount = Number(user?.adminWarningCount || 0);
  const penaltyStatus = String(user?.adminPenaltyStatus || "").toLowerCase();

  if (penaltyStatus === "suspended") {
    return {
      blocked: true,
      penalty: 9999,
    };
  }

  let penalty = 0;

  penalty += reportCount * 12;
  penalty += warningCount * 18;

  const lastReportedAt = toDate(user?.lastReportedAt);
  if (lastReportedAt) {
    const diffDays = (Date.now() - lastReportedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 30) penalty += 20;
    else if (diffDays <= 90) penalty += 10;
  }

  const blocked = reportCount >= 5 || warningCount >= 3;

  return {
    blocked,
    penalty,
  };
}

function buildMaleScore({ femaleUser, male }) {
  let score = 100;

  const valueSimilarity = getValueSimilarityScore(femaleUser, male);

  score += valueSimilarity * 25;
  score += getMbtiMatchBonus(femaleUser, male);
  score += getPreferenceRateBonus(femaleUser, male);
  score -= getAgeDistancePenalty(femaleUser, male);
  score += Math.min(getLikeScore(male), 15);

  const reportPolicy = getReportPenalty(male);
  score -= reportPolicy.penalty;

  return score;
}

function getOfferMaleUids(offerData = {}) {
  const fromArray = Array.isArray(offerData?.maleUids)
    ? offerData.maleUids.map((item) => safeString(item)).filter(Boolean)
    : [];

  const legacyMaleUid = safeString(offerData?.maleUid);

  return [...new Set([...fromArray, legacyMaleUid].filter(Boolean))];
}

function getShownMaleUids(offerData = {}) {
  const shown = Array.isArray(offerData?.shownMaleUids)
    ? offerData.shownMaleUids.map((item) => safeString(item)).filter(Boolean)
    : [];

  return [...new Set(shown)];
}

function mergeRecentShownMaleUids(previous = [], next = [], limit = 80) {
  const merged = [
    ...previous.map((item) => safeString(item)).filter(Boolean),
    ...next.map((item) => safeString(item)).filter(Boolean),
  ];

  return [...new Set(merged)].slice(-limit);
}

function getPhoneNumber(user = {}) {
  return String(
    user?.phonenumber ||
    user?.phoneNumber ||
    user?.phone ||
    ""
  ).replace(/[^0-9]/g, "");
}

function buildSmsMessage(lines = []) {
  const cleaned = lines
    .map((line) => String(line || "").trim())
    .filter(Boolean);

  return ["[차밍수프]", ...cleaned, CHARMINGSOUP_URL].join("\n");
}

async function sendLmsDirect(to, message, subject = "차밍수프 안내") {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const from = (process.env.NEXT_PUBLIC_MY_NUM || "").replace(/[^0-9]/g, "");

  if (!serviceId || !secretKey || !accessKey || !from || !to || !message) {
    throw new Error("LMS env missing");
  }

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

  await axios.post(
    `https://sens.apigw.ntruss.com${urlPath}`,
    {
      type: "LMS",
      countryCode: "82",
      from,
      subject,
      content: String(message || ""),
      messages: [{ to: String(to).replace(/[^0-9]/g, "") }],
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

async function getMatchedMaleIdsForFemale(db, femaleUid) {
  if (!femaleUid) return [];

  const snap = await db
    .collection("arenaMatches")
    .where("femaleUid", "==", femaleUid)
    .get();

  return snap.docs
    .map((item) => item.data() || {})
    .map((item) => String(item?.maleUid || "").trim())
    .filter(Boolean);
}

async function getRejectedMaleIdsForFemale(db, femaleUid) {
  if (!femaleUid) return [];

  const snap = await db
    .collection("arenaRejects")
    .where("femaleUid", "==", femaleUid)
    .get();

  return snap.docs
    .map((item) => item.data() || {})
    .map((item) => String(item?.maleUid || "").trim())
    .filter(Boolean);
}

async function getInterestedMaleIdsForFemale(db, femaleUid) {
  if (!femaleUid) return [];

  const snap = await db
    .collection("arenaInterests")
    .where("femaleUid", "==", femaleUid)
    .get();

  return snap.docs
    .map((item) => item.data() || {})
    .map((item) => String(item?.maleUid || "").trim())
    .filter(Boolean);
}

function isFemaleUser(user = {}) {
  const gender = String(user?.gender || user?.identity_gender || "").toLowerCase();
  return gender === "female" || gender === "f" || user?.gender === "여성";
}

function isMaleUser(user = {}) {
  const gender = String(user?.gender || user?.identity_gender || "").toLowerCase();
  return gender === "male" || gender === "m" || user?.gender === "남성";
}

exports.scheduleArenaOffers = onSchedule(
  {
    schedule: "every 30 minutes",
    timeZone: "Asia/Seoul",
    region: "asia-northeast3",
  },
  async () => {
    const db = admin.firestore();
    const usersSnap = await db.collection("users").get();

    const allUsers = usersSnap.docs.map((docSnap) => ({
      userID: docSnap.id,
      ...docSnap.data(),
    }));

    const femaleUsers = allUsers.filter(
      (user) =>
        isFemaleUser(user) &&
        !isArenaBlockedUser(user) &&
        !isArenaReceivePausedUser(user)
    );

    if (!femaleUsers.length) {
      console.log("[scheduleArenaOffers] no eligible female users");
      return null;
    }

    for (const femaleUser of femaleUsers) {
      const femaleUid = getUserDocId(femaleUser);
      if (!femaleUid) continue;

      try {
        const offerRef = db.collection("arenaOffers").doc(femaleUid);
        const offerSnap = await offerRef.get();
        const offerData = offerSnap.exists ? offerSnap.data() || {} : {};
        const expiresAt = toDate(offerData?.expiresAt);
        const currentMaleUids = getOfferMaleUids(offerData);

        if (
          expiresAt &&
          expiresAt.getTime() > Date.now() &&
          currentMaleUids.length > 0
        ) {
          continue;
        }

        const [rejectedIds, matchedIds, interestedIds] = await Promise.all([
          getRejectedMaleIdsForFemale(db, femaleUid),
          getMatchedMaleIdsForFemale(db, femaleUid),
          getInterestedMaleIdsForFemale(db, femaleUid),
        ]);

        const excludedIds = [
          ...new Set([...rejectedIds, ...matchedIds, ...interestedIds]),
        ];

        const previouslyShownMaleUids = getShownMaleUids(offerData);
        const currentExpiredMaleUids = getOfferMaleUids(offerData);

        const rotationExcludedIds = [
          ...new Set([
            ...excludedIds,
            ...previouslyShownMaleUids,
            ...currentExpiredMaleUids,
          ]),
        ];

        const buildCandidates = (excludeIds = []) =>
          allUsers
            .filter((male) => {
              const uid = getUserDocId(male);
              const reportPolicy = getReportPenalty(male);

              return (
                uid &&
                uid !== femaleUid &&
                isMaleUser(male) &&
                !isArenaBlockedUser(male) &&
                !isArenaReceivePausedUser(male) &&
                !isAdminMatchExposureBlocked(male) &&
                !reportPolicy.blocked &&
                !excludeIds.includes(uid)
              );
            })
            .map((male) => ({
              male,
              score: buildMaleScore({ femaleUser, male }),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, OFFER_COUNT)
            .map((item) => item.male);

        let shouldResetShownHistory = false;
        let maleCandidates = buildCandidates(rotationExcludedIds);

        // 남자 후보가 너무 적어 shown history 때문에 아무도 못 뽑으면
        // 이미 보여준 기록만 리셋하고, 거절/매칭/호감 보낸 사람은 계속 제외한다.
        if (!maleCandidates.length) {
          shouldResetShownHistory = true;
          maleCandidates = buildCandidates(excludedIds);
        }

        const nextMaleUids = maleCandidates.map((item) => getUserDocId(item));
        const valueMatchPercentMap = maleCandidates.reduce((acc, male) => {
          acc[getUserDocId(male)] = getValueMatchPercent(femaleUser, male);
          return acc;
        }, {});

        const batchKey = new Date().toISOString();
        const nextExpiresAt = new Date(Date.now() + ARENA_DURATION_MS);

        await offerRef.set(
          {
            femaleUid,
            maleUid: nextMaleUids[0] || "",
            maleUids: nextMaleUids,
            count: nextMaleUids.length,
            status: nextMaleUids.length ? "offered" : "empty",
            valueMatchPercent: valueMatchPercentMap[nextMaleUids[0]] || 0,
            valueMatchPercentMap,
            expiresAt: nextExpiresAt,
            batchKey,
            shownMaleUids: nextMaleUids.length
              ? shouldResetShownHistory
                ? nextMaleUids
                : mergeRecentShownMaleUids(previouslyShownMaleUids, nextMaleUids)
              : previouslyShownMaleUids,
            shownHistoryResetAt:
              shouldResetShownHistory && nextMaleUids.length
                ? admin.firestore.FieldValue.serverTimestamp()
                : offerData?.shownHistoryResetAt || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        if (!nextMaleUids.length) {
          continue;
        }

        const phone = getPhoneNumber(femaleUser);
        if (!phone) {
          continue;
        }

        if (String(offerData?.lastOfferSmsBatchKey || "") === batchKey) {
          continue;
        }

        await sendLmsDirect(
          phone,
          buildSmsMessage([
            "새롭게 소개드릴 이성분들이 도착했어요.",
            "지금 매칭아레나에서 확인해보세요.",
          ]),
          "차밍수프 새로운 소개"
        );

        await offerRef.set(
          {
            lastOfferSmsBatchKey: batchKey,
            lastOfferSmsSentAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log("[scheduleArenaOffers] updated:", femaleUid, nextMaleUids);
      } catch (error) {
        console.error("[scheduleArenaOffers] error:", femaleUid, error);
      }
    }

    return null;
  }
);