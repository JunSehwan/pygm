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
    // ||
    // user?.test === true
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

  let finalSigugun = "";
  if (sigugunText && Number.isNaN(Number(sigugunText))) {
    finalSigugun = sigugunText;
  }

  return [finalSido, finalSigugun].filter(Boolean).join(" ");
}

function extractCode(user = {}, keys = []) {
  for (const key of keys) {
    const value = user?.[key];
    if (value === 0 || value) {
      const num = Number(String(value).replace(/[^0-9]/g, ""));
      if (!Number.isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

function getDistanceScore(female = {}, male = {}) {
  const femaleSido = extractCode(female, [
    "address_sido_code",
    "sido_code",
    "address_sido",
  ]);
  const femaleSigugun = extractCode(female, [
    "address_sigugun_code",
    "sigugun_code",
    "address_sigugun",
  ]);

  const maleSido = extractCode(male, [
    "address_sido_code",
    "sido_code",
    "address_sido",
  ]);
  const maleSigugun = extractCode(male, [
    "address_sigugun_code",
    "sigugun_code",
    "address_sigugun",
  ]);

  let score = 0;

  if (femaleSido && maleSido) {
    const diff = Math.abs(femaleSido - maleSido);
    score += Math.max(0, 24 - diff * 2);
  }

  if (femaleSigugun && maleSigugun) {
    const diff = Math.abs(femaleSigugun - maleSigugun);
    score += Math.max(0, 30 - diff * 0.12);
  }

  return score;
}

function getPreferenceBuckets(user = {}) {
  return [
    ...normalizeArray(user?.hobbyList),
    ...normalizeArray(user?.date_hobby),
    ...normalizeArray(user?.interests),
    ...normalizeArray(user?.romanceValues),
    ...normalizeArray(user?.marriageValues),
    ...normalizeArray(user?.lifeValues),
    ...normalizeArray(user?.valueTags),
    ...normalizeArray(user?.keywords),
    ...normalizeArray(user?.interest ? [user.interest] : []),
    ...normalizeArray(user?.hobby ? [user.hobby] : []),
    ...normalizeArray(user?.food_like ? [user.food_like] : []),
    ...normalizeArray(user?.tourpurpose ? [user.tourpurpose] : []),
  ];
}

export function getValueMatchPercent(female = {}, male = {}) {
  const a = Array.from(new Set(getPreferenceBuckets(female)));
  const b = Array.from(new Set(getPreferenceBuckets(male)));

  if (!a.length || !b.length) return 82;

  const bSet = new Set(b);
  const matched = a.filter((item) => bSet.has(item)).length;
  const base = Math.round((matched / Math.max(a.length, 1)) * 100);

  return Math.max(52, Math.min(96, base));
}

export function hasRecentAccess(user = {}) {
  const latest =
    toDate(user?.lastActiveAt) ||
    toDate(user?.lastLoginAt) ||
    toDate(user?.updatedAt) ||
    toDate(user?.loginAt) ||
    toDate(user?.timestamp);

  if (!latest) return false;
  return Date.now() - latest.getTime() <= ARENA_DURATION_MS;
}

export function getRemainingHours(expiresAt) {
  const end = toDate(expiresAt);
  if (!end) return 0;
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
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
    user?.arenaOfferCount ||
    user?.arenaOffersPerCycle ||
    user?.arenaVisibleCount ||
    2
  );

  if (Number.isNaN(raw)) return 2;
  return Math.max(1, Math.min(3, raw));
}

async function getActiveArenaOfferDocs(femaleUid) {
  if (!femaleUid) return [];

  const q = query(
    collection(db, "arenaOffers"),
    where("femaleUid", "==", femaleUid)
  );

  const snap = await getDocs(q);

  return snap.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .filter((item) => {
      const expiresAt = toDate(item?.expiresAt);
      const isActiveStatus = item?.status === "active";
      const hasMale = !!item?.maleUid;

      return (
        isActiveStatus &&
        hasMale &&
        expiresAt &&
        expiresAt.getTime() > Date.now()
      );
    })
    .sort((a, b) => {
      const aTime = toDate(a?.createdAt)?.getTime() || 0;
      const bTime = toDate(b?.createdAt)?.getTime() || 0;
      return bTime - aTime;
    });
}

async function buildArenaOfferCardsFromOffers(offers = []) {
  const sortedOffers = [...offers].sort((a, b) => {
    const aTime = toDate(a?.createdAt)?.getTime() || 0;
    const bTime = toDate(b?.createdAt)?.getTime() || 0;
    return bTime - aTime;
  });

  const maleDocs = await Promise.all(
    sortedOffers.map(async (offer) => {
      const maleSnap = await getDoc(doc(db, "users", offer.maleUid));
      if (!maleSnap.exists()) return null;

      return {
        offer,
        male: {
          id: maleSnap.id,
          userID: maleSnap.id,
          ...maleSnap.data(),
        },
        badgeInfo: offer?.badgeInfo || {},
      };
    })
  );

  return {
    offerCards: maleDocs.filter(Boolean),
  };
}

export async function getArenaOfferCardsByFemaleUid(femaleUid = "") {
  if (!femaleUid) {
    return { offerCards: [] };
  }

  const activeOffers = await getActiveArenaOfferDocs(femaleUid);
  return buildArenaOfferCardsFromOffers(activeOffers);
}

export async function selectArenaMaleForFemale(
  femaleUser = {},
  options = {}
) {
  const femaleUid = getUserDocId(femaleUser);
  const alreadyShownIds = Array.isArray(femaleUser?.arenaShownMaleUids)
    ? femaleUser.arenaShownMaleUids
    : [];

  const extraExcludedIds = Array.isArray(options?.excludeMaleUids)
    ? options.excludeMaleUids
    : [];

  const snap = await getDocs(collection(db, "users"));
  const allUsers = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    userID: docSnap.id,
    ...docSnap.data(),
  }));

  const maleCandidates = allUsers.filter((item) => {
    const uid = getUserDocId(item);
    const gender = safeString(item?.gender).toLowerCase();

    return (
      uid &&
      uid !== femaleUid &&
      !isArenaBlockedUser(item) &&
      !isArenaReceivePausedUser(item) &&
      !extraExcludedIds.includes(uid) &&
      !isBlockedTargetUser(femaleUser, item) &&
      (gender === "male" || gender === "m" || item?.gender === "남성")
    );
  });

  if (!maleCandidates.length) {
    return {
      selectedMale: null,
      allUsers,
      valueMatchPercent: 0,
      badgeInfo: { top1: false, top5: false },
    };
  }

  const ranked = maleCandidates
    .map((male) => {
      const { score, valuePercent } = buildMaleScore(
        femaleUser,
        male,
        [...alreadyShownIds, ...extraExcludedIds]
      );
      return { male, score, valuePercent };
    })
    .sort((a, b) => b.score - a.score);

  const selected = ranked[0];
  if (!selected) {
    return {
      selectedMale: null,
      allUsers,
      valueMatchPercent: 0,
      badgeInfo: { top1: false, top5: false },
    };
  }

  return {
    selectedMale: selected.male,
    allUsers,
    valueMatchPercent: selected.valuePercent,
    badgeInfo: getArenaBadgeInfo(selected.male, allUsers),
  };
}

export async function ensureArenaOffers(femaleUser = {}) {
  const femaleUid = getUserDocId(femaleUser);
  if (!femaleUid) {
    return { offerCards: [] };
  }

  if (isArenaReceivePausedUser(femaleUser)) {
    return getArenaOfferCardsByFemaleUid(femaleUid);
  }

  const desiredCount = getArenaDesiredCount(femaleUser);
  const activeOffers = await getActiveArenaOfferDocs(femaleUid);

  let workingOffers = [...activeOffers];
  const activeMaleUids = workingOffers.map((item) => item.maleUid).filter(Boolean);

  const createdMaleUids = [];
  const createdMaleNames = [];

  while (workingOffers.length < desiredCount) {
    const { selectedMale, valueMatchPercent, badgeInfo } =
      await selectArenaMaleForFemale(femaleUser, {
        excludeMaleUids: [...activeMaleUids, ...createdMaleUids],
      });

    if (!selectedMale) break;

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ARENA_DURATION_MS);

    const payload = {
      femaleUid,
      maleUid: getUserDocId(selectedMale),
      status: "active",
      valueMatchPercent,
      recentAccess: hasRecentAccess(selectedMale),
      createdAt,
      expiresAt,
      badgeInfo,
    };

    const ref = await addDoc(collection(db, "arenaOffers"), payload);

    workingOffers.unshift({
      id: ref.id,
      ...payload,
    });

    createdMaleUids.push(getUserDocId(selectedMale));
    createdMaleNames.push(getDisplayName(selectedMale));
  }

  if (createdMaleUids.length) {
    const femaleRef = doc(db, "users", femaleUid);
    const mergedShownIds = Array.from(
      new Set([
        ...(Array.isArray(femaleUser?.arenaShownMaleUids)
          ? femaleUser.arenaShownMaleUids
          : []),
        ...createdMaleUids,
      ])
    );

    await setDoc(
      femaleRef,
      {
        arenaShownMaleUids: mergedShownIds,
        arenaLastOfferAt: new Date(),
      },
      { merge: true }
    );

    try {
      await addDoc(collection(db, "notifications"), {
        receiverId: femaleUid,
        type: "arena_new_offer",
        title: "새로운 이성 소개가 시작되었습니다",
        body:
          createdMaleNames.length > 1
            ? `${createdMaleNames.length}명의 새로운 소개가 도착했어요.`
            : `${createdMaleNames[0]}님 카드가 도착했어요.`,
        maleUids: createdMaleUids,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("[arena] notification error:", error);
    }

    try {
      if (femaleUser?.phonenumber) {
        const msg =
          "[차밍수프]\n" +
          "새로운 이성 소개가 시작되었습니다.\n" +
          "https://charmingsoup.com/arena";

        await sendLms(femaleUser.phonenumber, msg, "새로운 이성 소개 안내", {
          forceLms: true,
        });
      }
    } catch (error) {
      console.error("[arena] sendLms error:", error);
    }
  }

  return buildArenaOfferCardsFromOffers(workingOffers);
}

function buildMaleScore(female = {}, male = {}, alreadyShownIds = []) {
  let score = 0;

  const femaleMarital = getMaritalLabel(female);
  const maleMarital = getMaritalLabel(male);

  if (femaleMarital === "미혼" && maleMarital === "미혼") score += 34;
  else if (femaleMarital === maleMarital) score += 18;

  if (hasRecentAccess(male)) score += 22;

  if (male?.phone_verified || male?.identityVerified) score += 8;
  if (male?.company_verified || male?.job_verified || male?.companyVerified) score += 7;

  const valuePercent = getValueMatchPercent(female, male);
  score += valuePercent * 0.42;

  score += getDistanceScore(female, male);

  if (alreadyShownIds.includes(getUserDocId(male))) score -= 55;

  return {
    score,
    valuePercent,
  };
}



export async function ensureArenaOffer(femaleUser = {}) {
  const femaleUid = getUserDocId(femaleUser);
  if (!femaleUid) {
    return { offer: null, male: null, allUsers: [], badgeInfo: {} };
  }

  const offerRef = doc(db, "arenaOffers", femaleUid);
  const offerSnap = await getDoc(offerRef);

  if (offerSnap.exists()) {
    const currentOffer = offerSnap.data() || {};
    const expiresAt = toDate(currentOffer?.expiresAt);

    if (expiresAt && expiresAt.getTime() > Date.now() && currentOffer?.maleUid) {
      const maleSnap = await getDoc(doc(db, "users", currentOffer.maleUid));

      return {
        offer: { id: offerSnap.id, ...currentOffer },
        male: maleSnap.exists()
          ? { id: maleSnap.id, userID: maleSnap.id, ...maleSnap.data() }
          : null,
        allUsers: [],
        badgeInfo: currentOffer?.badgeInfo || {},
      };
    }
  }

  const { selectedMale, allUsers, valueMatchPercent, badgeInfo } =
    await selectArenaMaleForFemale(femaleUser);

  if (!selectedMale) {
    await setDoc(
      offerRef,
      {
        femaleUid,
        maleUid: "",
        status: "empty",
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + ARENA_DURATION_MS),
      },
      { merge: true }
    );

    return {
      offer: {
        femaleUid,
        maleUid: "",
        status: "empty",
        expiresAt: new Date(Date.now() + ARENA_DURATION_MS),
      },
      male: null,
      allUsers,
      badgeInfo: {},
    };
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ARENA_DURATION_MS);

  const nextOffer = {
    femaleUid,
    maleUid: getUserDocId(selectedMale),
    status: "active",
    valueMatchPercent,
    recentAccess: hasRecentAccess(selectedMale),
    createdAt,
    expiresAt,
    badgeInfo,
  };

  await setDoc(offerRef, nextOffer, { merge: true });

  const femaleRef = doc(db, "users", femaleUid);
  const mergedShownIds = Array.from(
    new Set([
      ...(Array.isArray(femaleUser?.arenaShownMaleUids)
        ? femaleUser.arenaShownMaleUids
        : []),
      getUserDocId(selectedMale),
    ])
  );

  await setDoc(
    femaleRef,
    {
      arenaShownMaleUids: mergedShownIds,
      arenaLastOfferAt: createdAt,
    },
    { merge: true }
  );

  try {
    await addDoc(collection(db, "notifications"), {
      receiverId: femaleUid,
      type: "arena_new_offer",
      title: "새로운 이성 소개가 시작되었습니다",
      body: `${getDisplayName(selectedMale)}님 카드가 도착했어요.`,
      maleUid: getUserDocId(selectedMale),
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[arena] notification error:", error);
  }

  try {
    if (femaleUser?.phonenumber) {
      await sendLms(
        femaleUser.phonenumber,
        `[차밍수프] 새로운 이성 소개가 시작되었습니다.\n지금 매칭아레나에서 확인해보세요.\nhttps://charmingsoup.com/arena`,
        "새로운 이성 소개 안내"
      );
    }
  } catch (error) {
    console.error("[arena] sendLms error:", error);
  }

  return {
    offer: nextOffer,
    male: selectedMale,
    allUsers,
    badgeInfo,
  };
}