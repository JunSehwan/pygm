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
import hangjungdong from "components/Common/Address";

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

const SIGUGUN_LABEL_MAP = Array.isArray(hangjungdong?.sigugun)
  ? hangjungdong.sigugun.reduce((acc, item) => {
    const code = String(item?.sigugun || "").trim();
    const name = String(item?.codeNm || "").trim();
    if (code && name) acc[code] = name;
    return acc;
  }, {})
  : {};

function toDisplayText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
}

function isVisibleText(value) {
  const text = toDisplayText(value);
  if (!text) return false;
  if (text.toLowerCase() === "[object object]") return false;
  return true;
}

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

function firstText(...values) {
  for (const value of values) {
    const text = safeString(value);
    if (text) return text;
  }
  return "";
}

export function isWithdrawnUser(user = {}) {
  return (
    user?.withdraw === true ||
    user?.withdrawn === true ||
    user?.accountStatus === "withdrawn" ||
    user?.adminApprovalStatus === "withdrawn" ||
    user?.reviewStatus === "withdrawn" ||
    user?.pendingStatus === "withdrawn"
  );
}

export function isProfileReviewPendingUser(user = {}) {
  return (
    user?.pendingStatus === "reviewing" ||
    user?.date_pending === true ||
    user?.reviewStatus === "pending"
  );
}

export function isArenaBlockedUser(user = {}) {
  const rejected =
    user?.adminApprovalStatus === "rejected" ||
    user?.pendingStatus === "rejected" ||
    user?.reviewStatus === "rejected";

  if (isWithdrawnUser(user)) return true;

  if (user?.sleep === true || user?.date_sleep === true) {
    return true;
  }

  if (rejected) return true;

  // 신규/기존 승인 여부와 관계없이 프로필 재심사 대기 중이면 매칭/노출을 일시 정지합니다.
  if (isProfileReviewPendingUser(user)) return true;

  return user?.date_profile_finished !== true;
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
  return (
    user?.adminMatchExposureBlocked === true ||
    isWithdrawnUser(user) ||
    isProfileReviewPendingUser(user)
  );
}

export function getUserDocId(user = {}) {
  return user?.userID || user?.uid || user?.id || "";
}

export function getProfileImage(user = {}) {
  if (Array.isArray(user?.profilePhotos) && user.profilePhotos.length) {
    const first = user.profilePhotos[0];
    if (typeof first === "string" && safeString(first)) return first;
    if (first?.url && safeString(first.url)) return first.url;
    if (first?.path && safeString(first.path)) return first.path;
  }

  if (Array.isArray(user?.thumbimage) && user.thumbimage.length) {
    const firstThumb = user.thumbimage.find((item) => safeString(item));
    if (firstThumb) return firstThumb;
  }

  if (typeof user?.thumbimage === "string" && safeString(user.thumbimage)) {
    return user.thumbimage;
  }

  if (safeString(user?.photoURL)) return user.photoURL;
  if (safeString(user?.profileImage)) return user.profileImage;
  if (safeString(user?.image)) return user.image;

  return "/image/profile/default.png";
}

export function getDisplayName(user = {}) {
  return (
    user?.nickname ||
    user?.username ||
    user?.name ||
    user?.identity_name ||
    "회원"
  );
}

export function getAge(user = {}) {
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
  const candidates = [
    user?.styleTest?.resultTitle,
    user?.styleTest?.animalTitle,
    user?.styleTest?.title,
    user?.styleTest?.name,
    user?.styleTest?.typeTitle,
  ];

  return candidates.find(isVisibleText) ? candidates.find(isVisibleText).toString().trim() : "";
}

export function getStyleLabel(user = {}) {
  const code = getStyleCode(user);
  const title = getStyleTitle(user);

  if (!code && !title) return "스타일 진단 준비중";
  if (code && title) return `${code} ${title}`;
  return code || title;
}

export function getStyleAxisLetters(user = {}) {
  const direct =
    toDisplayText(user?.styleTest?.axisLetters) ||
    toDisplayText(user?.styleTest?.axis) ||
    toDisplayText(user?.styleAxisLetters);

  if (direct && direct.toLowerCase() !== "[object object]") {
    return direct.toUpperCase();
  }

  const fallbackCode = getStyleCode(user);
  if (isVisibleText(fallbackCode)) {
    return String(fallbackCode).toUpperCase();
  }

  return "";
}
export function getStyleOneLine(user = {}) {
  const candidates = [
    user?.styleTest?.oneLine,
    user?.styleTest?.summary,
    user?.styleTest?.subTitle,
    user?.styleTest?.description,
  ];

  return candidates.find(isVisibleText) ? candidates.find(isVisibleText).toString().trim() : "";
}


export function getStyleTooltipText(user = {}) {
  const axis = getStyleAxisLetters(user);
  const title = getStyleTitle(user);
  const oneLine = getStyleOneLine(user);

  return [axis, title, oneLine].filter(Boolean).join(" · ");
}

export function getStyleDisplayLine(user = {}) {
  const axis = getStyleAxisLetters(user);
  const title = getStyleTitle(user);
  const oneLine = getStyleOneLine(user);

  if (title && oneLine) return `${title} · ${oneLine}`;
  if (axis && oneLine) return `${axis} · ${oneLine}`;
  if (title) return title;
  if (oneLine) return oneLine;
  if (axis) return axis;

  return "";
}

export function getJobLabel(user = {}) {
  if (isVisibleText(user?.duty)) return String(user.duty).trim();
  if (isVisibleText(user?.jobName)) return String(user.jobName).trim();
  if (isVisibleText(user?.jobLabel)) return String(user.jobLabel).trim();
  if (isVisibleText(user?.occupation)) return String(user.occupation).trim();
  if (isVisibleText(user?.jobTitle)) return String(user.jobTitle).trim();
  if (isVisibleText(user?.workTitle)) return String(user.workTitle).trim();

  const rawJob = toDisplayText(user?.job);
  if (!rawJob) return "직업 정보 준비중";

  if (OLD_JOB_LABEL_MAP[rawJob]) {
    return OLD_JOB_LABEL_MAP[rawJob];
  }

  if (!/^\d+$/.test(rawJob)) {
    return rawJob;
  }

  return "직업 정보 준비중";
}

export function getJobTypeLabel(user = {}) {
  const raw = toDisplayText(user?.job);

  const map = {
    "1": "대기업",
    "2": "중견기업",
    "3": "공기업",
    "4": "공무원",
    "5": "공공기관",
    "6": "외국계",
    "7": "전문직",
    "8": "금융권",
    "9": "교육계",
    "10": "프리랜서",
    "11": "사업가",
    "12": "기타",
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
    toDisplayText(user?.maritalStatus) ||
    toDisplayText(user?.wedding) ||
    toDisplayText(user?.married) ||
    toDisplayText(user?.status);

  if (!raw) return "";

  if (OLD_WEDDING_LABEL_MAP[raw]) return OLD_WEDDING_LABEL_MAP[raw];
  if (raw.includes("돌싱") || raw.includes("이혼")) return "돌싱";
  if (raw.includes("미혼")) return "미혼";

  if (/^\d+$/.test(raw)) return "";

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
  const schoolName =
    toDisplayText(user?.educationSchoolName) ||
    toDisplayText(user?.schoolName) ||
    toDisplayText(user?.school);

  if (schoolName) return schoolName;

  const raw = toDisplayText(user?.education);
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
  const sidoRaw =
    toDisplayText(user?.residence?.sido) ||
    toDisplayText(user?.address?.sido) ||
    toDisplayText(user?.address_sido);

  const sigugunRaw =
    toDisplayText(user?.residence?.sigugun) ||
    toDisplayText(user?.address?.sigugun) ||
    toDisplayText(user?.address_sigugun);

  const finalSido =
    SIDO_LABEL_MAP[sidoRaw] ||
    (sidoRaw && !/^\d+$/.test(sidoRaw) ? sidoRaw : "");

  const finalSigugun =
    SIGUGUN_LABEL_MAP[sigugunRaw] ||
    (sigugunRaw && !/^\d+$/.test(sigugunRaw) ? sigugunRaw : "");

  return [finalSido, finalSigugun].filter(Boolean).join(" ");
}

export function getWorkAreaLabel(user = {}) {
  const sidoRaw = toDisplayText(user?.company_location_sido);
  const sigugunRaw = toDisplayText(user?.company_location_sigugun);

  const finalSido =
    SIDO_LABEL_MAP[sidoRaw] ||
    (sidoRaw && !/^\d+$/.test(sidoRaw) ? sidoRaw : "");

  const finalSigugun =
    SIGUGUN_LABEL_MAP[sigugunRaw] ||
    (sigugunRaw && !/^\d+$/.test(sigugunRaw) ? sigugunRaw : "");

  return [finalSido, finalSigugun].filter(Boolean).join(" ");
}

export function getSalaryLabel(user = {}) {
  if (user?.salaryText) return user.salaryText;

  const raw = safeString(user?.salary);
  const map = {
    "1": "2,000만원 미만",
    "2": "2,000~3,000만원",
    "3": "3,000~4,000만원",
    "4": "4,000~5,000만원",
    "5": "5,000~6,000만원",
    "6": "6,000~7,000만원",
    "7": "7,000~8,000만원",
    "8": "8,000~9,000만원",
    "9": "9,000만원~1억원",
    "10": "1억원~1억2,000만원",
    "11": "1억2,000만원 이상",
  };

  if (map[raw]) return map[raw];

  if (raw) {
    if (/^\d+$/.test(raw)) return `${raw}만원`;
    return raw.includes("만") ? raw : `${raw}만원`;
  }

  const annual = safeString(user?.annual);
  if (!annual) return "";
  return annual.includes("만") ? annual : `${annual}만원`;
}

export function isSalaryPublic(user = {}) {
  return isPublicFlag(user?.salaryPublic, false);
}

export function getVisibleSalaryLabel(user = {}) {
  if (!isSalaryPublic(user)) return "";
  return getSalaryLabel(user);
}

export function getReligionLabel(user = {}) {
  const raw = safeString(user?.religion);

  const map = {
    "1": "무교",
    "2": "기독교",
    "3": "천주교",
    "4": "불교",
    "5": "원불교",
    "6": "유교",
    "7": "이슬람교",
    "8": "기타",
  };

  return map[raw] || raw;
}

export function getHeightLabel(user = {}) {
  const height = Number(user?.height || 0);
  return height > 0 ? `${height}cm` : "";
}

export function getInterestLabel(user = {}) {
  const values =
    normalizeArray(user?.hobbyList).length > 0
      ? normalizeArray(user?.hobbyList)
      : normalizeArray(user?.interest || user?.hobby);

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



function isPublicFlag(value, fallback = true) {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return fallback;
}

function getSchoolNameLabel(user = {}) {
  return (
    safeString(user?.educationSchoolName) ||
    safeString(user?.schoolName) ||
    safeString(user?.school)
  );
}

function getCompanyNameLabel(user = {}) {
  return (
    safeString(user?.companyName) ||
    safeString(user?.company)
  );
}

function getEducationLevelLabel(user = {}) {
  const raw = safeString(user?.education);

  const map = {
    "1": "초등학교 졸업",
    "2": "중학교 졸업",
    "3": "고등학교 졸업",
    "4": "전문대 재학",
    "5": "전문대 졸업",
    "6": "특수/기타학교 재학",
    "7": "특수/기타학교 졸업",
    "8": "4년제대학 재학",
    "9": "4년제대학 졸업",
    "10": "대학원 재학",
    "11": "석사학위",
    "12": "박사학위",
  };

  return map[raw] || raw || "";
}

function compactRows(rows = []) {
  return rows.filter((row) => row && row.value);
}

export function getProfileSummary(user = {}) {
  const displayName = getDisplayName(user);
  const age = getAge(user);

  const jobLabel = getJobLabel(user);
  const jobTypeLabel = getJobTypeLabel(user);
  const salaryLabel = getVisibleSalaryLabel(user);

  const educationLabel = getEducationLevelLabel(user);
  const schoolName = getSchoolNameLabel(user);
  const companyName = getCompanyNameLabel(user);

  const companyVisible = isPublicFlag(user?.company_open, true);
  const schoolVisible = isPublicFlag(
    user?.educationPublic ?? user?.school_open,
    true
  );

  const residenceLabel = getResidenceLabel(user);
  const workAreaLabel = getWorkAreaLabel(user);

  const maritalLabel = getMaritalLabel(user);
  const religionLabel = getReligionLabel(user);
  const heightLabel = getHeightLabel(user);
  const interestLabel = getInterestLabel(user);
  const drinkLabel = getDrinkLabel(user);
  const smokeLabel = getSmokeLabel(user);
  const mbtiLabel = getMbtiLabel(user);

  const styleLabel = getStyleLabel(user);
  const styleTooltipText = getStyleTooltipText(user);
  const styleDisplayLine = getStyleDisplayLine(user);

  return {
    uid: getUserDocId(user),
    displayName,
    age,

    jobLabel,
    jobTypeLabel,
    salaryLabel,

    companyLabel: companyVisible ? companyName : "",
    companyVisible,

    educationLabel,
    schoolNameLabel: schoolVisible ? schoolName : "",
    schoolVisible,

    maritalLabel,
    residenceLabel,
    workAreaLabel,
    religionLabel,
    heightLabel,
    interestLabel,
    mbtiLabel,
    drinkLabel,
    smokeLabel,

    styleLabel,
    styleTooltipText,
    styleDisplayLine,
    profileImage: getProfileImage(user),

    jobInfoRows: compactRows([
      { label: "직업군", value: jobTypeLabel },
      { label: "직업", value: jobLabel },
      { label: "회사명", value: companyVisible ? companyName : "" },
      { label: "연봉", value: salaryLabel },
    ]),

    educationInfoRows: compactRows([
      { label: "학력", value: educationLabel },
      { label: "학교명", value: schoolVisible ? schoolName : "" },
    ]),

    livingInfoRows: compactRows([
      { label: "거주지", value: residenceLabel },
      { label: "근무지", value: workAreaLabel },
      { label: "키", value: heightLabel },
      { label: "음주", value: drinkLabel },
      { label: "흡연", value: smokeLabel },
    ]),

    etcInfoRows: compactRows([
      { label: "관심사", value: interestLabel },
      { label: "종교", value: religionLabel },
      { label: "결혼상태", value: maritalLabel === "미기재" ? "" : maritalLabel },
      { label: "MBTI", value: mbtiLabel },
    ]),
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

async function getMatchedMaleIdsForFemale(femaleUid) {
  if (!femaleUid) return [];

  const snap = await getDocs(
    query(collection(db, "arenaMatches"), where("femaleUid", "==", femaleUid))
  );

  return snap.docs
    .map((item) => item.data() || {})
    .map((item) => String(item?.maleUid || "").trim())
    .filter(Boolean);
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

export function getValueMatchPercent(viewer = {}, targetUser = {}) {
  const similarity = getValueSimilarityScore(viewer, targetUser);
  const percent = Math.round(similarity * 100);
  return Number.isFinite(percent) && percent > 0 ? percent : 85;
}

function getArenaOfferMaleUids(offerData = {}) {
  const fromArray = Array.isArray(offerData?.maleUids)
    ? offerData.maleUids.map((item) => safeString(item)).filter(Boolean)
    : [];

  const legacyMaleUid = safeString(offerData?.maleUid);

  return [...new Set([...fromArray, legacyMaleUid].filter(Boolean))];
}

function getArenaShownMaleUids(offerData = {}) {
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

async function buildArenaOfferCards({
  femaleUser = {},
  femaleUid = "",
  offerId = "",
  offerData = {},
  allUsers = [],
}) {
  const maleUids = getArenaOfferMaleUids(offerData);
  if (!maleUids.length) {
    return [];
  }

  const maleList = (
    await Promise.all(maleUids.map((uid) => getUserByUid(uid)))
  ).filter(Boolean);

  if (!maleList.length) {
    return [];
  }

  return maleList.map((male) => {
    const maleUid = getUserDocId(male);
    const valueMatchPercent =
      Number(offerData?.valueMatchPercentMap?.[maleUid] || 0) ||
      Number(offerData?.valueMatchPercent || 0) ||
      getValueMatchPercent(femaleUser || { userID: femaleUid }, male);

    return {
      male,
      offer: {
        id: offerId,
        ...offerData,
        maleUid,
        maleUids,
        count: maleUids.length,
        valueMatchPercent,
      },
      badgeInfo: getArenaBadgeInfo(male, allUsers),
    };
  });
}

export async function getArenaOfferCardsByFemaleUid(femaleUid) {
  if (!femaleUid) {
    return { offerCards: [] };
  }

  const [offerSnap, femaleUser, allUsersSnap] = await Promise.all([
    getDoc(doc(db, "arenaOffers", femaleUid)),
    getUserByUid(femaleUid),
    getDocs(collection(db, "users")),
  ]);

  if (!offerSnap.exists()) {
    return { offerCards: [] };
  }

  const offerData = offerSnap.data() || {};
  const allUsers = allUsersSnap.docs.map((item) => ({
    userID: item.id,
    ...item.data(),
  }));

  const offerCards = await buildArenaOfferCards({
    femaleUser: femaleUser || { userID: femaleUid },
    femaleUid,
    offerId: offerSnap.id,
    offerData,
    allUsers,
  });

  return {
    offerCards,
  };
}

export async function ensureArenaOffers(femaleUser = {}) {
  const femaleUid = getUserDocId(femaleUser);
  if (!femaleUid) {
    return { offerCards: [] };
  }

  const allUsersSnap = await getDocs(collection(db, "users"));
  const allUsers = allUsersSnap.docs.map((item) => ({
    userID: item.id,
    ...item.data(),
  }));

  const rejectsSnap = await getDocs(collection(db, "arenaRejects"));
  const rejectedIds = rejectsSnap.docs
    .map((item) => item.data() || {})
    .filter((item) => String(item?.femaleUid || "") === String(femaleUid))
    .map((item) => String(item?.maleUid || "").trim())
    .filter(Boolean);

  const matchedIds = await getMatchedMaleIdsForFemale(femaleUid);
  const previousInterestDocs = await getArenaInterestDocsByFemaleUid(femaleUid);
  const interestedIds = previousInterestDocs
    .map((item) => String(item?.maleUid || "").trim())
    .filter(Boolean);

  const excludedIds = [
    ...new Set([...rejectedIds, ...matchedIds, ...interestedIds]),
  ];

  const offerRef = doc(db, "arenaOffers", femaleUid);
  const currentOfferSnap = await getDoc(offerRef);
  const now = Date.now();

  const currentOfferDataForHistory = currentOfferSnap.exists()
    ? currentOfferSnap.data() || {}
    : {};

  const previouslyShownMaleUids = getArenaShownMaleUids(
    currentOfferDataForHistory
  );

  if (currentOfferSnap.exists()) {
    const currentOfferData = currentOfferSnap.data() || {};
    const currentExpiresAt = toDate(currentOfferData?.expiresAt);
    const currentMaleUids = getArenaOfferMaleUids(currentOfferData);

    const validCurrentMales = currentMaleUids
      .map((uid) => allUsers.find((item) => getUserDocId(item) === uid))
      .filter(Boolean)
      .filter((currentMale) => {
        const currentMaleUid = getUserDocId(currentMale);
        const currentGender = String(
          currentMale?.gender || currentMale?.identity_gender || ""
        ).toLowerCase();

        const currentReportPolicy = currentMale
          ? getReportPenalty(currentMale)
          : { blocked: true };

        return (
          !!currentExpiresAt &&
          currentExpiresAt.getTime() > now &&
          !isArenaBlockedUser(currentMale) &&
          !isArenaReceivePausedUser(currentMale) &&
          !isAdminMatchExposureBlocked(currentMale) &&
          !currentReportPolicy.blocked &&
          !excludedIds.includes(currentMaleUid) &&
          !isBlockedTargetUser(femaleUser, currentMale) &&
          (currentGender === "male" ||
            currentGender === "m" ||
            currentMale?.gender === "남성")
        );
      });

    if (validCurrentMales.length) {
      const nextMaleUids = validCurrentMales.map((item) => getUserDocId(item));
      const valueMatchPercentMap = nextMaleUids.reduce((acc, uid) => {
        acc[uid] =
          Number(currentOfferData?.valueMatchPercentMap?.[uid] || 0) ||
          getValueMatchPercent(
            femaleUser,
            validCurrentMales.find((item) => getUserDocId(item) === uid) || {}
          );
        return acc;
      }, {});

      const shouldSyncDoc =
        nextMaleUids.length !== currentMaleUids.length ||
        currentMaleUids.some((uid, index) => uid !== nextMaleUids[index]);

      if (shouldSyncDoc) {
        await setDoc(
          offerRef,
          {
            femaleUid,
            maleUid: nextMaleUids[0] || "",
            maleUids: nextMaleUids,
            count: nextMaleUids.length,
            status: "offered",
            valueMatchPercent: valueMatchPercentMap[nextMaleUids[0]] || 0,
            valueMatchPercentMap,
            recentAccess: true,
            expiresAt: currentExpiresAt,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      return {
        offerCards: validCurrentMales.map((male) => {
          const maleUid = getUserDocId(male);
          return {
            male,
            offer: {
              id: currentOfferSnap.id,
              ...currentOfferData,
              maleUid,
              maleUids: nextMaleUids,
              count: nextMaleUids.length,
              valueMatchPercent:
                valueMatchPercentMap[maleUid] ||
                getValueMatchPercent(femaleUser, male),
              recentAccess: true,
              expiresAt: currentExpiresAt,
            },
            badgeInfo: getArenaBadgeInfo(male, allUsers),
          };
        }),
      };
    }
  }

  const currentExpiredMaleUids = currentOfferSnap.exists()
    ? getArenaOfferMaleUids(currentOfferSnap.data() || {})
    : [];

  const rotationExcludedIds = [
    ...new Set([
      ...excludedIds,
      ...previouslyShownMaleUids,
      ...currentExpiredMaleUids,
    ]),
  ];

  let selected = await selectArenaMaleForFemale({
    femaleUser,
    allUsers,
    extraExcludedIds: rotationExcludedIds,
  });

  let shouldResetShownHistory = false;

  // 후보 풀이 너무 적어서 새 사람을 못 찾는 경우에만
  // shownMaleUids를 리셋하고 다시 뽑는다.
  if (!selected.length) {
    shouldResetShownHistory = true;

    selected = await selectArenaMaleForFemale({
      femaleUser,
      allUsers,
      extraExcludedIds: excludedIds,
    });
  }

  const nextMales = selected.slice(0, 2);

  if (!nextMales.length) {
    await setDoc(
      offerRef,
      {
        femaleUid,
        maleUid: "",
        maleUids: [],
        count: 0,
        status: "empty",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { offerCards: [] };
  }

  const nextMaleUids = nextMales.map((item) => getUserDocId(item));
  const valueMatchPercentMap = nextMales.reduce((acc, male) => {
    acc[getUserDocId(male)] =
      Number(male?.arenaValuePercent || 0) || getValueMatchPercent(femaleUser, male);
    return acc;
  }, {});

  const expiresAt = new Date(Date.now() + ARENA_DURATION_MS);
  const batchKey = new Date().toISOString();

  await setDoc(
    offerRef,
    {
      femaleUid,
      maleUid: nextMaleUids[0] || "",
      maleUids: nextMaleUids,
      count: nextMaleUids.length,
      status: "offered",
      valueMatchPercent: valueMatchPercentMap[nextMaleUids[0]] || 0,
      valueMatchPercentMap,
      recentAccess: true,
      expiresAt,
      batchKey,
      shownMaleUids: shouldResetShownHistory
        ? nextMaleUids
        : mergeRecentShownMaleUids(previouslyShownMaleUids, nextMaleUids),
      shownHistoryResetAt: shouldResetShownHistory
        ? serverTimestamp()
        : currentOfferDataForHistory?.shownHistoryResetAt || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    offerCards: nextMales.map((male) => {
      const maleUid = getUserDocId(male);
      return {
        male,
        offer: {
          id: femaleUid,
          femaleUid,
          maleUid,
          maleUids: nextMaleUids,
          count: nextMaleUids.length,
          status: "offered",
          valueMatchPercent:
            valueMatchPercentMap[maleUid] || getValueMatchPercent(femaleUser, male),
          recentAccess: true,
          expiresAt,
          batchKey,
        },
        badgeInfo: getArenaBadgeInfo(male, allUsers),
      };
    }),
  };
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
  if (diff <= 0) return 0;

  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60)));
}