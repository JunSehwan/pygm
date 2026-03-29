function normalizeString(value) {
  return String(value || "").trim();
}

function sanitizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => {
    if (typeof item === "string") return !!normalizeString(item);
    if (item && typeof item === "object") {
      return Object.values(item).some((v) => !!normalizeString(v));
    }
    return false;
  });
}

function hasAddress(address) {
  if (!address) return false;
  if (typeof address === "string") return !!normalizeString(address);
  return !!(normalizeString(address?.sido) && normalizeString(address?.sigugun));
}

function hasBirthday(birthday) {
  if (!birthday) return false;
  if (typeof birthday === "string") return !!normalizeString(birthday);
  return !!birthday?.year;
}

function hasEnoughPhotos(user) {
  const list = Array.isArray(user?.profilePhotos) ? user.profilePhotos : [];
  const valid = list.filter((item) => {
    if (!item) return false;
    if (typeof item === "string") return !!normalizeString(item);
    return !!normalizeString(item?.url);
  });
  return valid.length >= 3;
}

function getValueByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function hasAnyAnswered(user, aliases) {
  for (const key of aliases) {
    const value = getValueByPath(user, key);

    if (Array.isArray(value)) {
      if (sanitizeArray(value).length > 0) return true;
      continue;
    }

    if (typeof value === "object" && value !== null) {
      if (key.includes("birthday")) {
        if (hasBirthday(value)) return true;
      } else if (Object.values(value).some((v) => !!normalizeString(v))) {
        return true;
      }
      continue;
    }

    if (!!normalizeString(value)) return true;
  }

  return false;
}

export function getProfilePreviewImage(user) {
  if (Array.isArray(user?.thumbimage) && user.thumbimage[0]) {
    return user.thumbimage[0];
  }

  if (typeof user?.thumbimage === "string" && user.thumbimage) {
    return user.thumbimage;
  }

  if (Array.isArray(user?.profilePhotos) && user.profilePhotos.length > 0) {
    const first = user.profilePhotos.find((item) => {
      if (!item) return false;
      if (typeof item === "string") return !!normalizeString(item);
      return !!normalizeString(item?.url);
    });

    if (typeof first === "string") return first;
    if (first?.url) return first.url;
  }

  return "/image/profile/default_profile.png";
}

const BASIC_PROFILE_FIELDS = [
  { label: "닉네임", check: (user) => !!normalizeString(user?.nickname || user?.username) },
  { label: "이름", check: (user) => !!normalizeString(user?.name) },
  { label: "생년월일", check: (user) => hasBirthday(user?.birthday) },
  { label: "성별", check: (user) => !!normalizeString(user?.gender) },
  { label: "연락처", check: (user) => !!normalizeString(user?.phonenumber) },
  {
    label: "거주지역",
    check: (user) => hasAddress(user?.residence) || !!(user?.address_sido && user?.address_sigugun),
  },
  {
    label: "근무지역",
    check: (user) =>
      hasAddress(user?.workArea) || !!(user?.company_location_sido && user?.company_location_sigugun),
  },
  { label: "키", check: (user) => !!normalizeString(user?.height) },
  { label: "MBTI", check: (user) => !!normalizeString(user?.mbti) },
  { label: "종교", check: (user) => !!normalizeString(user?.religion) },
  { label: "연봉수준", check: (user) => !!normalizeString(user?.salary) },
  { label: "프로필사진", check: (user) => hasEnoughPhotos(user) },
];

/**
 * aliases 배열 안에 실제 저장될 수 있는 키 후보를 같이 넣음
 * 취미/여가 0% 문제 때문에 특히 hobbyList 쪽을 넓게 잡음
 */
const SURVEY_GROUPS = [
  {
    key: "romance",
    title: "연애/결혼관",
    fields: [
      ["opfriend"],
      ["friendmeeting"],
      ["longdistance"],
      ["datecycle"],
      ["dateromance"],
      ["contact"],
      ["contactcycle"],
      ["passwordshare"],
      ["wedding"],
      ["wedding_dating"],
    ],
  },
  {
    key: "hobby",
    title: "취미/여가",
    fields: [
      ["hobbyList", "hobbies", "profile.hobbyList", "survey.hobbyList", "think.hobbyList"],
      ["drinkingCycle", "drinkCycle"],
      ["exerciseCycle", "workoutCycle"],
      ["travelStyle", "travelPeriod"],
      ["weekendStyle", "living_weekend"],
      ["datePlaceStyle", "dateStyle"],
      ["cultureStyle"],
      ["foodStyle", "food_diet"],
      ["dietStyle"],
      ["shoppingStyle"],
    ],
  },
  {
    key: "career",
    title: "커리어/생활",
    fields: [
      ["career_goal"],
      ["living_weekend"],
      ["living_consume"],
      ["living_pet"],
      ["living_tatoo"],
      ["living_smoke"],
      ["living_charming"],
    ],
  },
  {
    key: "extra",
    title: "기타",
    fields: [
      ["religion_important"],
      ["religion_visit"],
      ["religion_accept"],
      ["food_diet"],
    ],
  },
];

function calcSection(fieldAliasGroups, user) {
  const total = fieldAliasGroups.length;
  const done = fieldAliasGroups.filter((aliases) => hasAnyAnswered(user, aliases)).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    total,
    done,
    percent,
  };
}

export function getProfileCompletionDetail(user) {
  const basicDone = BASIC_PROFILE_FIELDS.filter((item) => item.check(user)).length;
  const basicTotal = BASIC_PROFILE_FIELDS.length;
  const basicPercent = basicTotal > 0 ? Math.round((basicDone / basicTotal) * 100) : 0;

  const surveySections = SURVEY_GROUPS.map((group) => {
    const result = calcSection(group.fields, user);
    return {
      key: group.key,
      title: group.title,
      ...result,
    };
  });

  const totalDone =
    basicDone + surveySections.reduce((sum, section) => sum + section.done, 0);
  const totalCount =
    basicTotal + surveySections.reduce((sum, section) => sum + section.total, 0);
  const percent = totalCount > 0 ? Math.round((totalDone / totalCount) * 100) : 0;

  return {
    percent,
    doneCount: totalDone,
    totalCount,
    basic: {
      title: "기본프로필",
      done: basicDone,
      total: basicTotal,
      percent: basicPercent,
    },
    surveySections,
  };
}

export function isProfileCompleted(user) {
  return getProfileCompletionDetail(user).percent >= 100;
}