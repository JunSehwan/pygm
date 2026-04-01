import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db, sendLms } from "firebaseConfig";
import { isBlockedTargetUser } from "./userBlockRules";

const ARENA_DURATION_MS = 72 * 60 * 60 * 1000;

const SIDO_LABEL_MAP = {
  "11": "서울",
  "26": "부산",
  "27": "대구",
  "28": "인천",
  "29": "광주",
  "30": "대전",
  "31": "울산",
  "36": "세종",
  "41": "경기",
  "42": "강원",
  "43": "충북",
  "44": "충남",
  "45": "전북",
  "46": "전남",
  "47": "경북",
  "48": "경남",
  "50": "제주",
};

const OLD_JOB_LABEL_MAP = {
  "1": "학생",
  "2": "전문직",
  "3": "공무원",
  "4": "교직",
  "5": "의료직",
  "6": "회사원",
  "7": "사업가",
  "8": "프리랜서",
  "9": "연구직",
  "10": "서비스직",
  "11": "예술·디자인",
  "12": "기타",
};

const OLD_WEDDING_LABEL_MAP = {
  "1": "미혼",
  "2": "미혼",
  "3": "돌싱",
  divorced: "돌싱",
  single: "미혼",
  unmarried: "미혼",
};

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

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function isArenaBlockedUser(user = {}) {
  return (
    user?.withdraw === true ||
    user?.sleep === true ||
    user?.date_sleep === true
  );
}

export function isArenaReceivePausedUser(user = {}) {
  return user?.arenaReceivePaused === true;
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

export function isAdminMatchExposureBlocked(user = {}) {
  return user?.adminMatchExposureBlocked === true;
}

export function getUserDocId(user = {}) {
  return user?.userID || user?.uid || user?.id || "";
}

export function getProfileImage(user = {}) {
  if (Array.isArray(user?.profilePhotos) && user.profilePhotos.length) {
    const first = user.profilePhotos[0];
    if (typeof first === "string") return first;
    if (first?.url) return first.url;
  }

  if (Array.isArray(user?.thumbimage) && user.thumbimage.length) {
    return user.thumbimage[0];
  }

  if (typeof user?.thumbimage === "string" && user.thumbimage) {
    return user.thumbimage;
  }

  return "/image/profile/default.png";
}

export function getDisplayName(user = {}) {
  return user?.nickname || user?.username || user?.name || "회원";
}

export function getAge(user = {}) {
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
  return age > 0 ? age : "";
}

export function getStyleCode(user = {}) {
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

export function getStyleTitle(user = {}) {
  return (
    user?.styleTest?.resultTitle ||
    user?.styleTest?.animalTitle ||
    user?.styleTest?.title ||
    user?.styleTest?.name ||
    ""
  );
}

export function getStyleLabel(user = {}) {
  const code = getStyleCode(user);
  const title = getStyleTitle(user);

  if (!code && !title) return "스타일 진단 준비중";
  if (code && title) return `${code} ${title}`;
  return code || title;
}

export function getStyleAxisLetters(user = {}) {
  const axisLetters =
    user?.styleTest?.axisLetters ||
    user?.styleTest?.axis ||
    user?.styleAxisLetters ||
    "";

  if (!axisLetters) return "";
  return String(axisLetters).toUpperCase();
}

export function getStyleOneLine(user = {}) {
  return (
    user?.styleTest?.oneLine ||
    user?.styleTest?.summary ||
    user?.styleTest?.subTitle ||
    user?.styleTest?.description ||
    ""
  );
}

export function getStyleTooltipText(user = {}) {
  const axis = getStyleAxisLetters(user);
  const title =
    user?.styleTest?.resultTitle ||
    user?.styleTest?.animalTitle ||
    user?.styleTest?.title ||
    user?.styleTest?.name ||
    "";
  const oneLine = getStyleOneLine(user);

  return [axis, title, oneLine].filter(Boolean).join(" · ");
}

export function getStyleDisplayLine(user = {}) {
  const title =
    user?.styleTest?.resultTitle ||
    user?.styleTest?.animalTitle ||
    user?.styleTest?.title ||
    user?.styleTest?.name ||
    "";
  const oneLine = getStyleOneLine(user);

  if (title && oneLine) return `${title} · ${oneLine}`;
  if (title) return title;
  if (oneLine) return oneLine;

  return "";
}

export function getJobLabel(user = {}) {
  if (user?.duty) return user.duty;
  if (user?.jobName) return user.jobName;
  if (user?.jobLabel) return user.jobLabel;

  const rawJob = safeString(user?.job);
  if (!rawJob) return "직업 정보 준비중";

  if (OLD_JOB_LABEL_MAP[rawJob]) {
    if (user?.company_open === true && user?.company) {
      return `${OLD_JOB_LABEL_MAP[rawJob]} · ${user.company}`;
    }
    return OLD_JOB_LABEL_MAP[rawJob];
  }

  if (user?.company_open === true && user?.company && rawJob !== user.company) {
    return `${rawJob} · ${user.company}`;
  }

  return rawJob;
}

export function getJobTypeLabel(user = {}) {
  const raw = String(user?.job || "").trim();

  const map = {
    "1": "대기업",
    "2": "중견기업",
    "3": "공기업",
    "4": "공무원",
    "5": "전문직",
    "6": "자영업",
    "7": "프리랜서",
    "8": "중소기업",
    "9": "기타",
  };

  return map[raw] || "";
}

export function getArenaBadgeImage(badgeInfo = {}) {
  if (badgeInfo?.top1) return "/image/profile/badge/goldcard.png";
  if (badgeInfo?.top5) return "/image/profile/badge/silvercard.png";
  return "";
}

export function getArenaBadgeTooltip(badgeInfo = {}) {
  if (badgeInfo?.top1) return "가치관호감도 상위 1%";
  if (badgeInfo?.top5) return "가치관호감도 상위 5%";
  return "";
}

export function getMaritalLabel(user = {}) {
  const raw =
    safeString(user?.maritalStatus) ||
    safeString(user?.wedding) ||
    safeString(user?.married);

  if (!raw) return "미기재";
  if (OLD_WEDDING_LABEL_MAP[raw]) return OLD_WEDDING_LABEL_MAP[raw];
  if (raw.includes("돌싱") || raw.includes("이혼")) return "돌싱";
  if (raw.includes("미혼")) return "미혼";
  return raw;
}

const EDUCATION_LABEL_MAP = {
  "1": "고등학교 졸업",
  "2": "전문대 재학",
  "3": "전문대 졸업",
  "4": "4년제 재학",
  "5": "4년제 졸업",
  "6": "석사 재학",
  "7": "석사 졸업",
  "8": "박사 재학",
  "9": "4년제 졸업",
  "10": "박사 졸업",
};

export function getEducationLabel(user = {}) {
  const raw = safeString(user?.education);
  if (!raw) return "";

  if (EDUCATION_LABEL_MAP[raw]) {
    return EDUCATION_LABEL_MAP[raw];
  }

  if (raw.includes("대학원")) return raw;
  if (raw.includes("4년제")) return raw;
  if (raw.includes("전문대")) return raw;
  if (raw.includes("고졸")) return raw;

  return "";
}

export function getResidenceLabel(user = {}) {
  const sidoText =
    safeString(user?.residence?.sido) ||
    safeString(user?.address?.sido) ||
    safeString(user?.address_sido);

  const sigugunText =
    safeString(user?.residence?.sigugun) ||
    safeString(user?.address?.sigugun) ||
    safeString(user?.address_sigugun);

  const sidoCode =
    safeString(user?.address_sido_code) ||
    safeString(user?.sido_code) ||
    (SIDO_LABEL_MAP[sidoText] ? "" : sidoText);

  const finalSido =
    SIDO_LABEL_MAP[sidoText] ||
    SIDO_LABEL_MAP[sidoCode] ||
    (sidoText && sidoText.length > 1 ? sidoText : "");

  return [finalSido, sigugunText].filter(Boolean).join(" ");
}

export function getWorkAreaLabel(user = {}) {
  const workArea = safeString(user?.company_location_sigugun || user?.workArea);
  const workSido = safeString(user?.company_location_sido);
  return [workSido, workArea].filter(Boolean).join(" ");
}

export function getSalaryLabel(user = {}) {
  if (user?.salaryText) return user.salaryText;
  if (typeof user?.salary === "string" && user.salary.trim()) return user.salary.trim();
  if (typeof user?.salary === "number" && user.salary > 0) return `${user.salary}만원`;

  const raw = safeString(user?.annual);
  if (!raw) return "";
  return raw.includes("만") ? raw : `${raw}만원`;
}

export function getReligionLabel(user = {}) {
  return safeString(user?.religion);
}

export function getHeightLabel(user = {}) {
  const height = Number(user?.height || 0);
  return height > 0 ? `${height}cm` : "";
}

export function getInterestLabel(user = {}) {
  const values =
    normalizeArray(user?.hobbyList).length > 0
      ? normalizeArray(user?.hobbyList)
      : normalizeArray(user?.interest);

  return values.join(", ");
}

export function getContactOpenState(match = {}) {
  const openedAt = toDate(match?.contactOpenedAt);
  const closedAt = toDate(match?.contactClosedAt);
  const now = Date.now();

  if (closedAt && closedAt.getTime() <= now) {
    return {
      visible: false,
      status: "closed",
      dDayLabel: "공개 종료",
    };
  }

  if (openedAt) {
    const expiresAt = closedAt || new Date(openedAt.getTime() + ARENA_DURATION_MS);
    const remainMs = expiresAt.getTime() - now;

    if (remainMs <= 0) {
      return {
        visible: false,
        status: "closed",
        dDayLabel: "공개 종료",
      };
    }

    const remainHours = Math.max(1, Math.ceil(remainMs / (1000 * 60 * 60)));
    return {
      visible: true,
      status: "open",
      dDayLabel: `D-${remainHours}H`,
      openedAt,
      expiresAt,
      remainHours,
    };
  }

  return {
    visible: false,
    status: "waiting",
    dDayLabel: "",
  };
}

export function getProfileSummary(user = {}) {
  return {
    uid: getUserDocId(user),
    displayName: getDisplayName(user),
    age: getAge(user),
    jobLabel: getJobLabel(user),
    jobTypeLabel: getJobTypeLabel(user),
    maritalLabel: getMaritalLabel(user),
    educationLabel: getEducationLabel(user),
    residenceLabel: getResidenceLabel(user),
    workAreaLabel: getWorkAreaLabel(user),
    salaryLabel: getSalaryLabel(user),
    religionLabel: getReligionLabel(user),
    heightLabel: getHeightLabel(user),
    interestLabel: getInterestLabel(user),
    styleLabel: getStyleLabel(user),
    styleTooltipText: getStyleTooltipText(user),
    styleDisplayLine: getStyleDisplayLine(user),
    profileImage: getProfileImage(user),
  };
}

export async function getUserByUid(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    ...snap.data(),
  };
}

export async function getArenaInterestDocsByFemaleUid(femaleUid) {
  if (!femaleUid) return [];

  const q = query(
    collection(db, "arenaInterests"),
    where("femaleUid", "==", femaleUid)
  );

  const snap = await getDocs(q);
  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function getArenaInterestDocsByMaleUid(maleUid) {
  if (!maleUid) return [];

  const q = query(
    collection(db, "arenaInterests"),
    where("maleUid", "==", maleUid)
  );

  const snap = await getDocs(q);
  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function getArenaMatchesByUid(uid) {
  if (!uid) return [];

  const [femaleSnap, maleSnap] = await Promise.all([
    getDocs(query(collection(db, "arenaMatches"), where("femaleUid", "==", uid))),
    getDocs(query(collection(db, "arenaMatches"), where("maleUid", "==", uid))),
  ]);

  const map = new Map();

  femaleSnap.docs.forEach((item) => {
    map.set(item.id, { id: item.id, ...item.data() });
  });

  maleSnap.docs.forEach((item) => {
    map.set(item.id, { id: item.id, ...item.data() });
  });

  return Array.from(map.values());
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

function getDistancePenalty(femaleUser = {}, maleUser = {}) {
  const femaleResidence = getResidenceLabel(femaleUser);
  const maleResidence = getResidenceLabel(maleUser);

  if (!femaleResidence || !maleResidence) return 0;
  if (femaleResidence === maleResidence) return 0;

  const femaleSido = femaleResidence.split(" ")[0];
  const maleSido = maleResidence.split(" ")[0];

  if (femaleSido && maleSido && femaleSido === maleSido) return 4;
  return 11;
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

function getLikeScore(user = {}) {
  return (
    Number(user?.charmingCardLikeReceivedCount || 0) ||
    Number(user?.charmingCardReceivedLikeCount || 0) ||
    Number(user?.receivedLikeCount || 0) ||
    Number(user?.wink || 0) ||
    Number(user?.infoseen || 0) * 0.02
  );
}

export function getArenaBadgeInfo(targetUser = {}, allUsers = []) {
  const totalUsers = allUsers.length;
  if (!totalUsers) return { top1: false, top5: false };

  const ranked = [...allUsers].sort((a, b) => getLikeScore(b) - getLikeScore(a));
  const targetId = getUserDocId(targetUser);

  const index = ranked.findIndex((item) => getUserDocId(item) === targetId);
  if (index < 0) return { top1: false, top5: false };

  const rank = index + 1;
  const top1Cut = Math.max(1, Math.ceil(totalUsers * 0.01));
  const top5Cut = Math.max(1, Math.ceil(totalUsers * 0.05));

  return {
    top1: totalUsers >= 50 && rank <= top1Cut,
    top5: totalUsers >= 20 && rank <= top5Cut,
  };
}

export function getArenaDesiredCount(user = {}) {
  const raw = Number(
    user?.desiredArenaCount ||
    user?.desiredCount ||
    user?.arenaDesiredCount ||
    0
  );

  if (!raw || raw < 1) return 5;
  return Math.min(12, raw);
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



function buildMaleScore({
  femaleUser,
  male,
  alreadyShownIds = [],
}) {
  let score = 100;

  const valueSimilarity = getValueSimilarityScore(femaleUser, male);
  const valuePercent = Math.round(valueSimilarity * 100);

  score += valueSimilarity * 25;
  score += getMbtiMatchBonus(femaleUser, male);
  score += getPreferenceRateBonus(femaleUser, male);
  score -= getAgeDistancePenalty(femaleUser, male);
  score -= getDistancePenalty(femaleUser, male);

  if (alreadyShownIds.includes(getUserDocId(male))) score -= 55;

  const reportPolicy = getReportPenalty(male);
  score -= reportPolicy.penalty;

  return {
    score,
    valuePercent,
  };
}

export async function selectArenaMaleForFemale({
  femaleUser,
  allUsers = [],
  alreadyShownIds = [],
  extraExcludedIds = [],
}) {
  const femaleUid = getUserDocId(femaleUser);
  if (!femaleUid) return [];

  const maleCandidates = allUsers.filter((item) => {
    const uid = getUserDocId(item);
    const gender = String(item?.gender || item?.identity_gender || "").toLowerCase();
    const reportPolicy = getReportPenalty(item);

    return (
      uid &&
      uid !== femaleUid &&
      !isArenaBlockedUser(item) &&
      !isArenaReceivePausedUser(item) &&
      !isAdminMatchExposureBlocked(item) &&
      !reportPolicy.blocked &&
      !extraExcludedIds.includes(uid) &&
      !isBlockedTargetUser(femaleUser, item) &&
      (gender === "male" || gender === "m" || item?.gender === "남성")
    );
  });

  const scored = maleCandidates.map((male) => {
    const scoreInfo = buildMaleScore({
      femaleUser,
      male,
      alreadyShownIds,
    });

    return {
      user: male,
      score: scoreInfo.score,
      valuePercent: scoreInfo.valuePercent,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, getArenaDesiredCount(femaleUser)).map((item) => ({
    ...item.user,
    arenaValuePercent: item.valuePercent,
    arenaScore: item.score,
  }));
}

export async function createArenaInterest({
  femaleUser,
  maleUser,
  interestMessage = "",
}) {
  const femaleUid = getUserDocId(femaleUser);
  const maleUid = getUserDocId(maleUser);

  if (!femaleUid || !maleUid) {
    throw new Error("uid not found");
  }

  const createdAt = serverTimestamp();

  const docRef = await addDoc(collection(db, "arenaInterests"), {
    femaleUid,
    femaleNickname: getDisplayName(femaleUser),
    maleUid,
    maleNickname: getDisplayName(maleUser),
    interestMessage: safeString(interestMessage),
    status: "pending",
    createdAt,
    updatedAt: createdAt,
    expiresAt: new Date(Date.now() + ARENA_DURATION_MS),
  });

  return docRef.id;
}

export async function createArenaMatch({
  femaleUser,
  maleUser,
  sourceInterestId = "",
}) {
  const femaleUid = getUserDocId(femaleUser);
  const maleUid = getUserDocId(maleUser);

  if (!femaleUid || !maleUid) {
    throw new Error("uid not found");
  }

  const docRef = await addDoc(collection(db, "arenaMatches"), {
    femaleUid,
    femaleNickname: getDisplayName(femaleUser),
    maleUid,
    maleNickname: getDisplayName(maleUser),
    sourceInterestId,
    status: "matched",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function saveMatchContactOpen({
  matchId,
  name = "",
  phone = "",
}) {
  if (!matchId) throw new Error("matchId not found");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ARENA_DURATION_MS);

  await setDoc(
    doc(db, "arenaMatches", matchId),
    {
      contact: {
        name: safeString(name),
        phone: safeString(phone),
      },
      contactOpenedAt: now,
      contactClosedAt: expiresAt,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function getRemainingHours(expiresAt) {
  const end = toDate(expiresAt);
  if (!end) return 0;
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}