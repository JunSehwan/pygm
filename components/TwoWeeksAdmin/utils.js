import { DEFAULT_ROUND_ID, STATUS_LABELS } from "./constants";

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function getBasic(application = {}) {
  return application?.basic || {};
}

export function getIdentity(application = {}) {
  return application?.identity || {};
}

export function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function normalizePhone(value = "") {
  let digits = String(value || "").replace(/[^0-9]/g, "");

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

  return value || "-";
}

export function getGenderLabel(value = "") {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  return value || "-";
}

export function getStatusLabel(value = "") {
  return STATUS_LABELS[value] || value || "-";
}

export function getTimestampMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function formatDate(value) {
  const ms = getTimestampMs(value);
  if (!ms) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function formatBirthYear(value) {
  const year = Number(value || 0);
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

export function formatFullAge(application = {}) {
  const basic = getBasic(application);
  const age = getFullAgeFromBasic(basic);
  return age ? `만 ${age}세` : "-";
}

export function formatAgeBirth(application = {}) {
  const basic = getBasic(application);
  const age = formatFullAge(application);
  const birth = formatBirthYear(basic.birthYear);
  return birth === "-" ? age : `${age}(${birth})`;
}

export function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "-";
  return `${amount.toLocaleString()}원`;
}

export function getApplicationSortValue(application = {}) {
  return (
    getTimestampMs(application?.submittedAt) ||
    getTimestampMs(application?.createdAt) ||
    getTimestampMs(application?.completedAtClient) ||
    getTimestampMs(application?.updatedAt)
  );
}

export function getApplicationName(application = {}) {
  const basic = getBasic(application);
  return basic.name || basic.nickname || application.id || "-";
}

export function getProfilePhoto(application = {}) {
  return getIdentity(application)?.representativePhoto?.url || "";
}

export function getRoundId(application = {}) {
  return application?.roundId || DEFAULT_ROUND_ID;
}

export function isActiveApplication(application = {}) {
  return !["cancelled", "withdrawn", "rejected"].includes(String(application?.status || ""));
}

export function isFemale(application = {}) {
  return getBasic(application)?.gender === "female";
}

export function isMale(application = {}) {
  return getBasic(application)?.gender === "male";
}

export function isApprovedApplication(application = {}) {
  return application?.reviewStatus === "approved" || application?.status === "approved";
}

export function isFullyApprovedApplication(application = {}) {
  return application?.reviewStatus === "approved" && application?.status === "approved";
}

export function isDepositConfirmed(application = {}) {
  return application?.deposit?.status === "confirmed";
}

export function isMatchAvailableApplication(application = {}) {
  const matchingStatus = String(application?.matchingStatus || "not_ready");
  const hasCurrentProposal = Boolean(application?.currentProposal?.candidateApplicationId);

  return (
    isActiveApplication(application) &&
    isFullyApprovedApplication(application) &&
    isDepositConfirmed(application) &&
    !hasCurrentProposal &&
    matchingStatus === "not_started"
  );
}

export function getMatchingDisplayStatus(application = {}) {
  if (!isActiveApplication(application)) return application?.matchingStatus || "cancelled";
  if (!isFullyApprovedApplication(application)) return "not_ready";
  if (!isDepositConfirmed(application)) return "not_ready";
  return application?.matchingStatus || "not_started";
}

export function getMatchingDisplayTone(application = {}) {
  const displayStatus = getMatchingDisplayStatus(application);

  if (displayStatus === "not_ready") return "default";
  if (displayStatus === "not_started") return "warn";
  if (["confirmed", "completed", "mutualAccepted"].includes(displayStatus)) return "good";
  if (["declined", "cancelled", "failed"].includes(displayStatus)) return "bad";
  if (["proposed", "accepted"].includes(displayStatus)) return "orange";

  return "default";
}

export function getAreaOverlap(a = {}, b = {}) {
  const aAreas = normalizeArray(getBasic(a).activityAreas);
  const bAreas = normalizeArray(getBasic(b).activityAreas);
  return aAreas.filter((area) => bAreas.includes(area));
}

export function getTimeOverlap(a = {}, b = {}) {
  const aTimes = normalizeArray(getBasic(a).availableTimeSlots);
  const bTimes = normalizeArray(getBasic(b).availableTimeSlots);
  return aTimes.filter((time) => bTimes.includes(time));
}

export function getAgeDiff(male = {}, female = {}) {
  const maleAge = getFullAgeFromBasic(getBasic(male));
  const femaleAge = getFullAgeFromBasic(getBasic(female));
  if (!maleAge || !femaleAge) return null;
  return maleAge - femaleAge;
}

export function getPairScore(male = {}, female = {}) {
  const ageDiff = getAgeDiff(male, female);
  const areaOverlap = getAreaOverlap(male, female);
  const timeOverlap = getTimeOverlap(male, female);

  let ageScore = 20;

  if ([3, 4].includes(ageDiff)) ageScore = 55;
  else if ([2, 5].includes(ageDiff)) ageScore = 45;
  else if ([1, 6].includes(ageDiff)) ageScore = 34;
  else if (ageDiff === 0) ageScore = 28;
  else if (ageDiff < 0) ageScore = 16;

  return {
    total: Math.min(100, ageScore + Math.min(areaOverlap.length, 3) * 10 + Math.min(timeOverlap.length, 3) * 5),
    ageDiff,
    areaOverlap,
    timeOverlap,
  };
}

export function buildHighScorePairs(applications = [], limitCount = 999) {
  const males = applications.filter((item) => isMale(item) && isMatchAvailableApplication(item));
  const females = applications.filter((item) => isFemale(item) && isMatchAvailableApplication(item));
  const candidatePairs = [];

  males.forEach((male) => {
    females.forEach((female) => {
      candidatePairs.push({
        male,
        female,
        score: getPairScore(male, female),
      });
    });
  });

  candidatePairs.sort((a, b) => {
    const scoreDiff = (b.score?.total || 0) - (a.score?.total || 0);
    if (scoreDiff) return scoreDiff;

    const areaDiff = (b.score?.areaOverlap?.length || 0) - (a.score?.areaOverlap?.length || 0);
    if (areaDiff) return areaDiff;

    return (b.score?.timeOverlap?.length || 0) - (a.score?.timeOverlap?.length || 0);
  });

  const usedMaleIds = new Set();
  const usedFemaleIds = new Set();
  const pairs = [];

  candidatePairs.forEach((pair) => {
    if (pairs.length >= limitCount) return;
    if (usedMaleIds.has(pair.male.id) || usedFemaleIds.has(pair.female.id)) return;

    usedMaleIds.add(pair.male.id);
    usedFemaleIds.add(pair.female.id);
    pairs.push(pair);
  });

  return pairs;
}

export function makeStats(applications = [], responses = [], matches = []) {
  const total = applications.length;
  const male = applications.filter(isMale).length;
  const female = applications.filter(isFemale).length;
  const approved = applications.filter(isApprovedApplication).length;
  const pendingReview = applications.filter((item) => ["pending", "reviewing", ""].includes(String(item.reviewStatus || ""))).length;
  const depositConfirmed = applications.filter((item) => item.deposit?.status === "confirmed").length;
  const proposed = applications.filter((item) => item.matchingStatus === "proposed" || item.currentProposal?.candidateApplicationId).length;
  const confirmed = applications.filter((item) => item.matchingStatus === "confirmed" || item.matchingStatus === "completed").length;

  return {
    total,
    male,
    female,
    approved,
    pendingReview,
    depositConfirmed,
    proposed,
    confirmed,
    acceptedResponses: responses.filter((item) => item.response === "accepted").length,
    declinedResponses: responses.filter((item) => item.response === "declined").length,
    matches: matches.length,
  };
}

export function getSearchText(application = {}) {
  const basic = getBasic(application);
  const identity = getIdentity(application);

  return [
    application.id,
    basic.name,
    basic.nickname,
    basic.phone,
    basic.phoneNormalized,
    basic.birthYear,
    basic.age,
    basic.gender,
    identity.jobCategory,
    identity.organizationName,
    normalizeArray(basic.activityAreas).join(" "),
    normalizeArray(basic.availableTimeSlots).join(" "),
    application.reviewStatus,
    application.matchingStatus,
    application.status,
    application.infoUploadStatus,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
