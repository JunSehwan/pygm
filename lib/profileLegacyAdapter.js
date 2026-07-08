import hangjungdong from "components/Common/Address";

const CURRENT_RELIGION_OPTIONS = [
  "무교",
  "기독교",
  "천주교",
  "불교",
  "원불교",
  "유교",
  "이슬람교",
  "기타",
];

const LEGACY_RELIGION_OPTIONS = [
  "무교",
  "기독교",
  "천주교",
  "불교",
  "원불교",
  "유교",
  "대종교",
  "천도교",
  "대순리진회",
  "이슬람교",
  "힌두교",
  "유대교",
  "기타",
];

const CURRENT_SALARY_OPTIONS = [
  "2,000만원 이하",
  "2,000 - 2,500만원",
  "2,500 - 3,000만원",
  "3,000 - 3,500만원",
  "3,500 - 4,000만원",
  "4,000 - 4,500만원",
  "4,500 - 5,000만원",
  "5,000 - 5,500만원",
  "5,500 - 6,000만원",
  "6,000 - 7,000만원",
  "7,000 - 8,000만원",
  "8,000 - 9,000만원",
  "9,000만원 이상",
  "1억원 이상",
];

const LEGACY_JOB_OPTIONS = [
  "대기업",
  "중견기업",
  "공기업",
  "공무원",
  "공공기관",
  "외국계",
  "전문직",
  "금융권",
  "교육계",
  "프리랜서",
  "사업가",
  "기타",
];

const CURRENT_JOB_OPTIONS = [
  "대기업",
  "중견기업",
  "공기업",
  "공무원",
  "공공기관",
  "외국계",
  "전문직",
  "금융권",
  "교육계",
  "프리랜서",
  "사업가",
  "기타",
];

const LEGACY_EDUCATION_OPTIONS = [
  "고등학교 졸업",
  "전문대 재학",
  "전문대 졸업",
  "4년제 재학",
  "4년제 졸업",
  "석사 재학",
  "석사 졸업",
  "박사 재학",
  "박사 졸업",
];

const CURRENT_EDUCATION_OPTIONS = [
  "고등학교 졸업",
  "전문대 재학",
  "전문대 졸업",
  "4년제 재학",
  "4년제 졸업",
  "석사학위",
  "박사학위",
  "기타/비공개",
];

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function isNumericCode(value) {
  return typeof value === "string" && /^[0-9]+$/.test(value.trim());
}

function decodeByOptions(value, options = []) {
  if (isBlank(value)) return "";
  if (!isNumericCode(value)) return value;

  const index = Number(value) - 1;
  if (index < 0 || index >= options.length) return value;

  return options[index];
}

function decodeEducation(value) {
  if (isBlank(value)) return "";
  if (!isNumericCode(value)) return value;

  const index = Number(value) - 1;

  if (index >= 0 && index < LEGACY_EDUCATION_OPTIONS.length) {
    const legacyLabel = LEGACY_EDUCATION_OPTIONS[index];

    if (legacyLabel === "석사 재학" || legacyLabel === "석사 졸업") {
      return "석사학위";
    }

    if (legacyLabel === "박사 재학" || legacyLabel === "박사 졸업") {
      return "박사학위";
    }

    return legacyLabel;
  }

  return value;
}

function decodeSidoName(sidoCode) {
  if (isBlank(sidoCode)) return "";
  const found = (hangjungdong?.sido || []).find(
    (item) => String(item.sido) === String(sidoCode)
  );
  return found?.codeNm || String(sidoCode);
}

function decodeSigugunName(sidoCode, sigugunCode) {
  if (isBlank(sigugunCode)) return "";
  const found = (hangjungdong?.sigugun || []).find(
    (item) =>
      String(item.sido) === String(sidoCode) &&
      String(item.sigugun) === String(sigugunCode)
  );
  return found?.codeNm || String(sigugunCode);
}

function buildAddressObject(sidoCode, sigugunCode, fallback = {}) {
  const finalSidoCode = String(sidoCode || fallback?.sidoCode || "").trim();
  const finalSigugunCode = String(sigugunCode || fallback?.sigugunCode || "").trim();

  const sidoName =
    fallback?.sido && !isNumericCode(fallback.sido)
      ? fallback.sido
      : decodeSidoName(finalSidoCode);

  const sigugunName =
    fallback?.sigugun && !isNumericCode(fallback.sigugun)
      ? fallback.sigugun
      : decodeSigugunName(finalSidoCode, finalSigugunCode);

  return {
    sido: sidoName || "",
    sigugun: sigugunName || "",
    sidoCode: finalSidoCode || "",
    sigugunCode: finalSigugunCode || "",
  };
}

function normalizeProfilePhotos(docData = {}) {
  if (Array.isArray(docData.profilePhotos) && docData.profilePhotos.length > 0) {
    return docData.profilePhotos.map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `legacy-profile-${index}`,
          url: item,
        };
      }

      return {
        id: item?.id || `profile-${index}`,
        url: item?.url || item?.src || "",
        ...item,
      };
    });
  }

  if (Array.isArray(docData.thumbimage) && docData.thumbimage.length > 0) {
    return docData.thumbimage
      .filter(Boolean)
      .map((url, index) => ({
        id: `legacy-thumb-${index}`,
        url,
      }));
  }

  return [];
}

function buildMbti(docData = {}) {
  if (docData?.mbti && String(docData.mbti).trim().length === 4) {
    return String(docData.mbti).trim().toUpperCase();
  }

  const mbti = [
    docData?.mbti_ei || "",
    docData?.mbti_sn || "",
    docData?.mbti_tf || "",
    docData?.mbti_jp || "",
  ]
    .map((v) => String(v || "").trim().toUpperCase())
    .join("");

  return mbti.length === 4 ? mbti : "";
}

export function adaptLegacyProfileDoc(docData = {}, firebaseUser = {}, userDocId = "") {
  const residence = buildAddressObject(
    docData?.residence?.sidoCode || docData?.address_sido,
    docData?.residence?.sigugunCode || docData?.address_sigugun,
    docData?.residence || {}
  );

  const workArea = buildAddressObject(
    docData?.workArea?.sidoCode || docData?.company_location_sido,
    docData?.workArea?.sigugunCode || docData?.company_location_sigugun,
    docData?.workArea || {}
  );

  const normalizedHeight =
    docData?.height === null || docData?.height === undefined
      ? ""
      : String(docData.height).replace(/[^0-9]/g, "");

  const companyVerified =
    !!docData?.companyVerified ||
    !!docData?.jobverified ||
    (Array.isArray(docData?.jobdocument) && docData.jobdocument.length > 0);

  const companyPublic =
    docData?.companyPublic !== undefined
      ? docData.companyPublic
      : docData?.company_open !== undefined
        ? docData.company_open
        : true;

  const educationPublic =
    docData?.educationPublic !== undefined
      ? docData.educationPublic
      : docData?.school_open !== undefined
        ? docData.school_open
        : true;

  const salaryPublic =
    docData?.salaryPublic !== undefined
      ? docData.salaryPublic
      : false;

  return {
    userID: firebaseUser?.uid || userDocId || "",
    username: docData.username || "",
    nickname: docData.nickname || "",
    name: docData.name || docData.realname || docData.username || "",
    email: docData.email || docData.email_using || firebaseUser?.email || "",
    birthday: docData.birthday || "",
    gender: docData.gender || "",
    phonenumber: docData.phonenumber || "",
    thumbimage: docData.thumbimage || [],
    profilePhotos: normalizeProfilePhotos(docData),

    date_sleep: docData.date_sleep ?? false,
    withdraw: docData.withdraw ?? false,
    date_profile_finished: docData.date_profile_finished ?? false,
    date_pending: docData.date_pending ?? false,

    maritalStatus: docData.maritalStatus || docData.status || "",
    mbti: buildMbti(docData),
    job: decodeByOptions(docData.job, LEGACY_JOB_OPTIONS) || "",
    education: decodeEducation(docData.education) || "",
    school: docData.school || "",
    schoolName: docData.schoolName || docData.educationSchoolName || docData.school || "",
    educationSchoolName:
      docData.educationSchoolName || docData.schoolName || docData.school || "",
    educationPublic,
    religion:
      decodeByOptions(docData.religion, LEGACY_RELIGION_OPTIONS) ||
      decodeByOptions(docData.religion, CURRENT_RELIGION_OPTIONS) ||
      "",
    salary: decodeByOptions(docData.salary, CURRENT_SALARY_OPTIONS) || "",
    salaryPublic,
    company: docData.company || "",
    companyPublic,
    companyVerified,
    companyEmail: docData.companyEmail || "",
    companyVerificationMethod: docData.companyVerificationMethod || "",
    companyVerifiedAt: docData.companyVerifiedAt || null,

    residence,
    workArea,

    address_sido: residence.sido,
    address_sigugun: residence.sigugun,
    address_sido_code: residence.sidoCode,
    address_sigugun_code: residence.sigugunCode,

    company_location_sido: workArea.sido,
    company_location_sigugun: workArea.sigugun,
    company_location_sido_code: workArea.sidoCode,
    company_location_sigugun_code: workArea.sigugunCode,

    height: normalizedHeight,
    styleTest: docData.styleTest || {},
    identityVerified: !!docData.identityVerified,
    identityVerifiedAt: docData.identityVerifiedAt || null,
    styleTestCompleted: !!docData?.styleTest?.typeCode,

    opfriend: docData.opfriend || "",
    friendmeeting: docData.friendmeeting || "",
    longdistance: docData.longdistance || "",
    datecycle: docData.datecycle || "",
    dateromance: docData.dateromance || "",
    contact: docData.contact || "",
    contactcycle: docData.contactcycle || "",
    passwordshare: docData.passwordshare || "",
    wedding: docData.wedding || "",
    wedding_dating: docData.wedding_dating || "",

    hobby: docData.hobby || "",
    hobbyList: Array.isArray(docData.hobbyList) ? docData.hobbyList : [],
    drink: docData.drink || "",
    health: docData.health || "",
    hotplace: docData.hotplace || "",
    tour: docData.tour || "",
    tourlike: docData.tourlike || "",
    tourpurpose: docData.tourpurpose || "",
    hobbyshare: docData.hobbyshare || "",
    interest: docData.interest || "",

    career_goal: docData.career_goal || "",
    living_weekend: docData.living_weekend || "",
    living_consume: docData.living_consume || "",
    living_pet: docData.living_pet || "",
    living_tatoo: docData.living_tatoo || "",
    living_smoke: docData.living_smoke || "",
    living_charming: docData.living_charming || "",

    religion_important: docData.religion_important || "",
    religion_visit: docData.religion_visit || "",
    religion_accept: docData.religion_accept || "",
    food_taste: docData.food_taste || "",
    food_like: docData.food_like || "",
    food_dislike: docData.food_dislike || "",
    food_vegetarian: docData.food_vegetarian || "",
    food_spicy: docData.food_spicy || "",
    food_diet: docData.food_diet || "",

    charmingCardLikeReceivedCount:
      docData.charmingCardLikeReceivedCount ||
      docData.charmingCardReceivedLikeCount ||
      docData.receivedLikeCount ||
      0,
  };
}