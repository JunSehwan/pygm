import { calculateMatchingCompatibility } from "../TwoWeeksShared/matchingCompatibility";
import {
  TWOWEEKS_MAX_PROFILE_PHOTOS,
  TWOWEEKS_MIN_PROFILE_PHOTOS,
} from "../TwoWeeksShared/profilePhotoPolicy";
export function normalizeTimeSlotLabel(value = "") {
  if (value === "평일 저녁") return "금요일 저녁";
  return value || "";
}

export function normalizeTimeSlotLabels(values = []) {
  const list = Array.isArray(values) ? values : [];
  return Array.from(new Set(list.map(normalizeTimeSlotLabel).filter(Boolean)));
}

export function formatTimeSlots(values = []) {
  return normalizeTimeSlotLabels(values).join(" · ");
}

export function normalizePhone(value = "") {
  const raw = String(value || "").trim();

  if (!raw) return "";

  let digits = raw.replace(/[^0-9]/g, "");

  if (digits.startsWith("8210") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  }

  if (digits.startsWith("82010") && digits.length >= 13) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("82") && digits.length >= 11 && !digits.startsWith("820")) {
    digits = `0${digits.slice(2)}`;
  }

  return digits;
}

export function formatPhone(value = "") {
  const digits = normalizePhone(value);

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value || "";
}

export function getSafeBasic(application = {}) {
  return application?.basic || {};
}

export function getGenderLabel(gender = "") {
  if (gender === "male") return "남성";
  if (gender === "female") return "여성";
  return "-";
}

export function getOppositeGender(gender = "") {
  if (gender === "male") return "female";
  if (gender === "female") return "male";
  return "";
}

export function formatBirthYearTwoDigits(birthYear) {
  const year = Number(birthYear);
  if (!year) return "-";
  return `${String(year).slice(-2)}년생`;
}

function parseBirthDate(value = "") {
  const digits = String(value || "").replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

export function getFullAgeFromBasic(basic = {}) {
  const parsed = parseBirthDate(basic.birthDate || basic.birth || "");
  const birthYear = Number(basic.birthYear || 0);
  const now = new Date();

  if (parsed) {
    let age = now.getFullYear() - parsed.year;
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    if (currentMonth < parsed.month || (currentMonth === parsed.month && currentDay < parsed.day)) {
      age -= 1;
    }

    return age;
  }

  if (birthYear) return now.getFullYear() - birthYear;

  return Number(basic.age || 0) || null;
}

export function formatFullAgeBasic(basic = {}) {
  const age = getFullAgeFromBasic(basic);
  return age ? `만 ${age}세` : "-";
}

export function getApplicationTimeValue(application = {}) {
  const candidates = [
    application?.submittedAt,
    application?.createdAt,
    application?.completedAtClient,
    application?.updatedAt,
  ];

  for (const value of candidates) {
    if (!value) continue;
    if (typeof value?.toMillis === "function") return value.toMillis();
    if (typeof value?.seconds === "number") return value.seconds * 1000;
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return 0;
}

function getPhotoPreviewUrl(photo = {}) {
  return photo?.securePreviewUrl || photo?.blurredUrl || photo?.previewUrl || photo?.thumbnailUrl || "";
}

export function getPhotoItems(application = {}) {
  const identity = application?.identity || {};
  const photos = [];

  if (identity.representativePhoto?.url || getPhotoPreviewUrl(identity.representativePhoto)) {
    photos.push({
      id: "representative",
      label: "대표",
      url: identity.representativePhoto?.url || "",
      previewUrl: getPhotoPreviewUrl(identity.representativePhoto),
      meta: identity.representativePhoto,
    });
  }

  const additional = Array.isArray(identity.additionalPhotos)
    ? identity.additionalPhotos
    : [];

  additional.forEach((photo, index) => {
    if (!photo?.url && !getPhotoPreviewUrl(photo)) return;
    photos.push({
      id: `additional_${index}`,
      label: `추가 ${index + 1}`,
      url: photo?.url || "",
      previewUrl: getPhotoPreviewUrl(photo),
      meta: photo,
    });
  });

  return photos.slice(0, 5);
}

export function getAreaOverlap(a = [], b = []) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  return left.filter((item) => right.includes(item));
}

export function getTimeOverlap(a = [], b = []) {
  const left = normalizeTimeSlotLabels(a);
  const right = normalizeTimeSlotLabels(b);
  return left.filter((item) => right.includes(item));
}

export function getAgePriority(viewer = {}, candidate = {}) {
  const viewerBasic = getSafeBasic(viewer);
  const candidateBasic = getSafeBasic(candidate);

  const viewerAge = getFullAgeFromBasic(viewerBasic);
  const candidateAge = getFullAgeFromBasic(candidateBasic);

  if (!viewerAge || !candidateAge) {
    return {
      score: 35,
      grade: "fallback",
      diffLabel: "나이 정보 확인 필요",
      detail: "나이 정보가 부족해 지역과 시간 가능성을 우선 검토합니다.",
      maleOlderDiff: null,
    };
  }

  const viewerGender = viewerBasic.gender;
  const candidateGender = candidateBasic.gender;

  const maleAge = viewerGender === "male" ? viewerAge : candidateGender === "male" ? candidateAge : null;
  const femaleAge = viewerGender === "female" ? viewerAge : candidateGender === "female" ? candidateAge : null;

  if (!maleAge || !femaleAge) {
    const diff = Math.abs(viewerAge - candidateAge);

    return {
      score: Math.max(20, 60 - diff * 5),
      grade: "fallback",
      diffLabel: `나이차 ${diff}세`,
      detail: "성별 기준 나이차를 계산하기 어려워 전체 나이차 기준으로 검토합니다.",
      maleOlderDiff: null,
    };
  }

  const maleOlderDiff = maleAge - femaleAge;

  if (maleOlderDiff >= 3 && maleOlderDiff <= 4) {
    return {
      score: 100,
      grade: "best",
      diffLabel: `남성이 ${maleOlderDiff}살 많음`,
      detail: "투윅스 우선 기준인 남성이 3~4살 많은 조합에 가장 가깝습니다.",
      maleOlderDiff,
    };
  }

  if ([2, 5].includes(maleOlderDiff)) {
    return {
      score: 88,
      grade: "good",
      diffLabel: `남성이 ${maleOlderDiff}살 많음`,
      detail: "우선 기준에 가까운 나이 조합으로 검토할 수 있습니다.",
      maleOlderDiff,
    };
  }

  if ([1, 6].includes(maleOlderDiff)) {
    return {
      score: 74,
      grade: "acceptable",
      diffLabel: `남성이 ${maleOlderDiff}살 많음`,
      detail: "우선 기준에서는 조금 벗어나지만 후보풀 상황에 따라 적합할 수 있습니다.",
      maleOlderDiff,
    };
  }

  if (maleOlderDiff === 0) {
    return {
      score: 62,
      grade: "acceptable",
      diffLabel: "동갑 조합",
      detail: "우선 기준은 아니지만 지역과 시간 조건이 맞으면 검토할 수 있습니다.",
      maleOlderDiff,
    };
  }

  if (maleOlderDiff < 0) {
    return {
      score: Math.max(25, 52 + maleOlderDiff * 5),
      grade: "fallback",
      diffLabel: `여성이 ${Math.abs(maleOlderDiff)}살 많음`,
      detail: "기본 우선순위에서는 후순위지만 후보풀이 부족할 때 검토할 수 있습니다.",
      maleOlderDiff,
    };
  }

  return {
    score: Math.max(20, 60 - Math.abs(maleOlderDiff - 4) * 5),
    grade: "fallback",
    diffLabel: `남성이 ${maleOlderDiff}살 많음`,
    detail: "기본 우선순위와 거리가 있어 지역과 시간 조건을 함께 보고 후순위로 검토합니다.",
    maleOlderDiff,
  };
}

export function scoreCandidate(viewer = {}, candidate = {}) {
  return calculateMatchingCompatibility(viewer, candidate);
}

export function isCandidateEligible(viewer = {}, candidate = {}) {
  if (!viewer?.id || !candidate?.id || viewer.id === candidate.id) return false;

  const viewerBasic = getSafeBasic(viewer);
  const candidateBasic = getSafeBasic(candidate);

  if (!viewerBasic.gender || !candidateBasic.gender) return false;
  if (candidateBasic.gender !== getOppositeGender(viewerBasic.gender)) return false;
  if (viewerBasic.phoneNormalized && candidateBasic.phoneNormalized === viewerBasic.phoneNormalized) return false;

  const blockedStatuses = ["cancelled", "withdrawn", "rejected"];
  if (blockedStatuses.includes(candidate.status)) return false;
  if (blockedStatuses.includes(candidate.matchingStatus)) return false;

  return true;
}

export function findBestCandidate(viewer = {}, applications = []) {
  const candidates = applications
    .filter((candidate) => isCandidateEligible(viewer, candidate))
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(viewer, candidate),
    }))
    .sort((a, b) => b.score.total - a.score.total);

  return candidates[0] || null;
}

export function isApplicationProfileEditable(application = {}) {
  const status = String(application?.status || "");
  const matchingStatus = String(application?.matchingStatus || "");
  const scheduleStatus = String(application?.scheduleStatus || application?.meetingStatus || "");
  const proposalStatus = String(application?.currentProposal?.status || "");
  const response = String(application?.currentProposal?.response || "");

  const lockedStatuses = ["cancelled", "withdrawn", "rejected"];
  const activeMatchingStatuses = ["proposed", "pending", "accepted", "mutualAccepted", "confirmed", "meeting", "feedback_pending"];
  const activeScheduleStatuses = ["ready", "needs_first_choice", "waiting_counterpart", "needs_final_choice", "place_pending", "confirmed", "schedule_confirmed"];
  const terminalProposalStatuses = ["declined", "expired", "proposal_expired", "schedule_expired", "counterpart_expired", "cancelled", "canceled", "failed", "completed"];

  if (lockedStatuses.includes(status)) return false;
  if (activeMatchingStatuses.includes(matchingStatus)) return false;
  if (activeScheduleStatuses.includes(scheduleStatus)) return false;
  if (application?.currentProposal?.matchId && !terminalProposalStatuses.includes(proposalStatus) && activeMatchingStatuses.includes(matchingStatus)) return false;

  if (["accepted", "confirmed"].includes(response)) return false;

  return true;
}

export function getProfileEditLockReason(application = {}) {
  if (isApplicationProfileEditable(application)) {
    return "진행 중인 매칭이 없을 때 다음 매칭용 프로필을 수정할 수 있습니다.";
  }

  const matchingStatus = String(application?.matchingStatus || "");

  if (["confirmed", "completed"].includes(matchingStatus)) {
    return "매칭이 확정된 뒤에는 상대에게 전달된 정보가 바뀌지 않도록 프로필 수정이 제한됩니다.";
  }

  return "진행 중인 제안·일정·만남·피드백 처리가 끝난 뒤 수정할 수 있습니다.";
}

export function buildMyProfileRows(application = {}) {
  const basic = getSafeBasic(application);
  const identity = application?.identity || {};

  return [
    ["닉네임", basic.nickname || "-"],
    ["나이", `${formatFullAgeBasic(basic)}(${formatBirthYearTwoDigits(basic.birthYear)})`],
    ["직업군", identity.jobCategory || "-"],
    ["회사/학교", identity.organizationName || "운영자 인증용"],
    ["활동 지역", (basic.activityAreas || []).join(" · ") || "-"],
    ["가장 편한 지역", basic.preferredArea || "-"],
    ["가능 시간", formatTimeSlots(basic.availableTimeSlots) || "-"],
    ["키", basic.height ? `${basic.height}cm` : "미입력"],
    ["1줄 소개", basic.introduction || "-"],
  ];
}

export function buildProfileEditInitialForm(application = {}) {
  const basic = getSafeBasic(application);
  const identity = application?.identity || {};
  const photos = getPhotoItems(application).map((photo, index) => ({
    source: "existing",
    id: photo.id || `existing_${index}`,
    label: photo.label || (index === 0 ? "대표" : `추가 ${index}`),
    url: photo.url,
    meta: photo.meta,
  }));

  const matchingPreferences = application?.matchingPreferences || basic?.matchingPreferences || {};

  return {
    nickname: basic.nickname || "",
    activityAreas: Array.isArray(basic.activityAreas) ? basic.activityAreas : [],
    preferredArea: basic.preferredArea || "",
    availableTimeSlots: normalizeTimeSlotLabels(basic.availableTimeSlots),
    height: basic.height ? String(basic.height) : "",
    introduction: basic.introduction || "",
    marriagePlan: matchingPreferences.marriagePlan || "",
    childrenPlan: matchingPreferences.childrenPlan || "",
    religion: matchingPreferences.religion || "",
    religionPreference: matchingPreferences.religionPreference || "",
    smoking: matchingPreferences.smoking || "",
    smokingPreference: matchingPreferences.smokingPreference || "",
    drinkingFrequency: matchingPreferences.drinkingFrequency || "",
    jobCategory: identity.jobCategory || "",
    companyScale: identity.companyScale || "",
    organizationName: identity.organizationName || "",
    educationLevel: identity.educationLevel || "",
    schoolName: identity.schoolName || "",
    mbti: application?.profileTraits?.mbti || "",
    interests: Array.isArray(application?.profileTraits?.interests) ? application.profileTraits.interests : [],
    preferredAgeMin: matchingPreferences.preferredAgeRange?.min ? String(matchingPreferences.preferredAgeRange.min) : "",
    preferredAgeMax: matchingPreferences.preferredAgeRange?.max ? String(matchingPreferences.preferredAgeRange.max) : "",
    preferredDrinking: matchingPreferences.drinkingPreference || "",
    preferredStyles: Array.isArray(matchingPreferences.preferredStyles) ? matchingPreferences.preferredStyles : [],
    preferredJobCategories: Array.isArray(matchingPreferences.preferredJobCategories) ? matchingPreferences.preferredJobCategories : [],
    additionalPreference: matchingPreferences.additionalPreference || "",
    photos,
  };
}

export function validateProfileEditForm(form = {}) {
  const errors = {};
  const height = form.height ? Number(form.height) : null;

  if (!form.nickname?.trim()) errors.nickname = "닉네임을 입력해주세요.";
  if (form.nickname?.trim() && form.nickname.trim().length < 2) {
    errors.nickname = "닉네임은 2자 이상 입력해주세요.";
  }

  if (!Array.isArray(form.activityAreas) || form.activityAreas.length < 1) {
    errors.activityAreas = "활동 가능한 지역을 1개 이상 남겨주세요.";
  }

  if (!form.preferredArea) errors.preferredArea = "가장 편한 지역을 선택해주세요.";
  if (form.preferredArea && !form.activityAreas?.includes(form.preferredArea)) {
    errors.preferredArea = "가장 편한 지역은 선택한 활동지역 안에서 골라주세요.";
  }

  if (!Array.isArray(form.availableTimeSlots) || form.availableTimeSlots.length < 1) {
    errors.availableTimeSlots = "가능한 시간대를 1개 이상 남겨주세요.";
  }

  if (height && (height < 130 || height > 230)) {
    errors.height = "키는 130~230cm 범위로 입력해주세요.";
  }

  if (!form.introduction?.trim()) errors.introduction = "짧은 자기소개를 입력해주세요.";
  if (form.introduction?.trim() && form.introduction.trim().length > 80) {
    errors.introduction = "짧은 자기소개는 80자 이내로 입력해주세요.";
  }

  if (!form.marriagePlan) errors.marriagePlan = "결혼 의향을 선택해주세요.";
  if (!form.childrenPlan) errors.childrenPlan = "자녀 계획을 선택해주세요.";
  if (!form.religion) errors.religion = "현재 종교를 선택해주세요.";
  if (!form.religionPreference) errors.religionPreference = "상대방 종교에 대한 생각을 선택해주세요.";
  if (!form.smoking) errors.smoking = "흡연 여부를 선택해주세요.";
  if (!form.smokingPreference) errors.smokingPreference = "상대방 흡연 허용 범위를 선택해주세요.";
  if (!form.drinkingFrequency) errors.drinkingFrequency = "음주 빈도를 선택해주세요.";

  if (!form.jobCategory) errors.jobCategory = "직업군을 선택해주세요.";
  if (form.jobCategory === "회사원" && !form.companyScale) errors.companyScale = "회사 유형을 선택해주세요.";
  if (!form.organizationName?.trim()) errors.organizationName = "회사명 또는 학교명을 입력해주세요.";

  if (form.educationLevel && !form.schoolName?.trim()) errors.schoolName = "학교명을 입력해주세요.";
  if (form.interests?.length > 10) errors.interests = "관심사는 최대 10개까지 선택해주세요.";
  if (form.preferredStyles?.length > 3) errors.preferredStyles = "원하는 스타일은 최대 3개까지 선택해주세요.";
  if (form.preferredJobCategories?.length > 2) errors.preferredJobCategories = "선호 직업군은 최대 2개까지 선택해주세요.";
  if (form.preferredAgeMin || form.preferredAgeMax) {
    const min = Number(form.preferredAgeMin), max = Number(form.preferredAgeMax);
    if (!form.preferredAgeMin || !form.preferredAgeMax || !Number.isInteger(min) || !Number.isInteger(max) || min < 18 || max > 80 || min > max) {
      errors.preferredAgeRange = "희망 연령은 18~80세에서 최소·최대 값을 확인해주세요.";
    }
  }
  if ((form.additionalPreference || "").length > 300) errors.additionalPreference = "추가 희망조건은 300자 이내로 작성해주세요.";

  if (!Array.isArray(form.photos) || form.photos.filter(Boolean).length < TWOWEEKS_MIN_PROFILE_PHOTOS) {
    errors.photos = `프로필 사진은 대표사진 포함 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장을 유지해주세요.`;
  } else if (form.photos.filter(Boolean).length > TWOWEEKS_MAX_PROFILE_PHOTOS) {
    errors.photos = `프로필 사진은 최대 ${TWOWEEKS_MAX_PROFILE_PHOTOS}장까지 등록할 수 있습니다.`;
  }

  return errors;
}

export function buildPublicProfile(application = {}) {
  const basic = getSafeBasic(application);
  const identity = application?.identity || {};

  return {
    title: `${getGenderLabel(basic.gender)} / ${formatFullAgeBasic(basic)} / ${identity.jobCategory || "직장인"}`,
    subtitle: `${(basic.activityAreas || []).slice(0, 2).join(" · ") || "활동지역 확인중"} 가능 / ${
      formatTimeSlots((basic.availableTimeSlots || []).slice(0, 2)) || "시간대 확인중"
    }`,
    rows: [
      ["나이", `${formatFullAgeBasic(basic)}(${formatBirthYearTwoDigits(basic.birthYear)})`],
      ["직업군", identity.jobCategory || "-"],
      ["활동 지역", (basic.activityAreas || []).join(" · ") || "-"],
      ["가능 시간", formatTimeSlots(basic.availableTimeSlots) || "-"],
      ["키", basic.height ? `${basic.height}cm` : "미입력"],
      ["1줄 소개", basic.introduction || "소개 문구를 확인 중입니다."],
    ],
  };
}
