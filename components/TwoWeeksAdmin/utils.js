import { DEFAULT_ROUND_ID, STATUS_LABELS } from "./constants";
import { calculateMatchingCompatibility } from "../TwoWeeksShared/matchingCompatibility";
import { isDepositParticipationEligible } from "../TwoWeeksShared/depositPolicy";
import { isTwoWeeksTestPhone } from "../TwoWeeksShared/testAuth";
import {
  getTwoWeeksProfilePhotoCount,
  hasLegacyApprovedTwoWeeksProfilePhotoException,
  hasMatchingEligibleTwoWeeksProfilePhotos,
} from "../TwoWeeksShared/profilePhotoPolicy";

export const getProfilePhotoCount = getTwoWeeksProfilePhotoCount;
export const hasLegacyApprovedProfilePhotoException = hasLegacyApprovedTwoWeeksProfilePhotoException;
export const hasMatchingEligibleProfilePhotos = hasMatchingEligibleTwoWeeksProfilePhotos;

export function getHardMatchingBlockers(score = {}) {
  return normalizeArray(score.hardBlockers);
}

export function getAdvisoryMatchingConflicts(score = {}) {
  return normalizeArray(score.compatibilityConflicts || score.blockers).filter((item) =>
    !getHardMatchingBlockers(score).some((hard) => hard?.code === item?.code)
  );
}

export function getUnacknowledgedMatchingConflicts(score = {}, acknowledgedCodes = []) {
  const acknowledged = new Set(normalizeArray(acknowledgedCodes));
  return getAdvisoryMatchingConflicts(score).filter((item) => !acknowledged.has(item?.code));
}

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function getBasic(application = {}) {
  return application?.basic || {};
}

export function getIdentity(application = {}) {
  return application?.identity || {};
}

export function normalizeOrganizationName(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\(\s*주\s*\)/g, "")
    .replace(/주식회사|유한회사|합자회사|합명회사|사단법인|재단법인|의료법인|학교법인/g, "")
    .replace(/[^a-z0-9가-힣]/g, "");
}

export function getSameCompanyConflict(left = {}, right = {}) {
  const leftName = String(getIdentity(left)?.organizationName || "").trim();
  const rightName = String(getIdentity(right)?.organizationName || "").trim();
  const leftKey = normalizeOrganizationName(leftName);
  const rightKey = normalizeOrganizationName(rightName);
  const blocked = Boolean(leftKey && rightKey && leftKey === rightKey);

  return {
    blocked,
    leftName,
    rightName,
    normalizedOrganizationName: blocked ? leftKey : "",
  };
}

export function isSameCompanyPair(left = {}, right = {}) {
  return getSameCompanyConflict(left, right).blocked;
}

export function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function normalizeTimeSlotLabel(value = "") {
  if (value === "평일 저녁") return "금요일 저녁";
  return value || "";
}

export function normalizeTimeSlotLabels(values = []) {
  return Array.from(new Set(normalizeArray(values).map(normalizeTimeSlotLabel).filter(Boolean)));
}

export function formatTimeSlots(values = []) {
  return normalizeTimeSlotLabels(values).join(" · ");
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

export function getPenaltyStats(application = {}) {
  const stats = application?.penaltyStats || {};
  const proposalNoResponseCount = Number(stats.proposalNoResponseCount || 0);
  const scheduleNoResponseCount = Number(stats.scheduleNoResponseCount || 0);
  const totalNoResponseCount =
    Number(stats.totalNoResponseCount || 0) || proposalNoResponseCount + scheduleNoResponseCount;

  return {
    proposalNoResponseCount,
    scheduleNoResponseCount,
    totalNoResponseCount,
    lastPenaltyReason: stats.lastPenaltyReason || "",
    lastPenaltyAtClient: stats.lastPenaltyAtClient || stats.lastPenaltyAt || "",
    reviewStatus: stats.reviewStatus || application?.nextRoundStatus || "",
    lastMatchId: stats.lastMatchId || "",
    lastCounterpartOutcome: stats.lastCounterpartOutcome || "",
    clearedAt: stats.clearedAtClient || stats.clearedAt || "",
  };
}

export function getMatchingPauseReasonLabel(application = {}) {
  const nextRoundStatus = String(application?.nextRoundStatus || "");
  const pauseReason = String(application?.matchingPauseReason || "");

  const labels = {
    user_paused: "사용자가 직접 매칭을 일시정지함",
    contact_connected: "상호 연락처 공개 후 매칭 일시정지",
    top_up_required: "예치금 잔액 부족으로 추가 예치 필요",
    refund_requested: "예치금 반환 신청 처리 중",
    refunded: "예치금 반환 완료로 이용 종료",
    feedback_overdue: "만남 후 피드백 미제출",
    priority_review: "운영자 우선 검토",
    ready: "현재 매칭풀 대기 중",
  };

  if (nextRoundStatus === "admin_review") {
    const noResponseReasons = new Set(["proposal_no_response", "proposal_expired", "schedule_no_response", "schedule_expired", "schedule_first_choice", "schedule_counterpart_choice"]);
    if (noResponseReasons.has(pauseReason)) return `${getPenaltyReasonLabel(pauseReason)}로 운영자 검토 대기`;
    return "기타 운영자 검토 · 상세 원인 확인 필요";
  }

  if (labels[nextRoundStatus]) return labels[nextRoundStatus];
  if (String(application?.matchingStatus || "") === "paused") return "레거시 일시정지 · 원인 확인 필요";
  return "현재 매칭 정지 아님";
}

export function getNoResponseReviewState(application = {}) {
  const matchingStatus = String(application?.matchingStatus || "");
  const nextRoundStatus = String(application?.nextRoundStatus || "");
  const stats = getPenaltyStats(application);
  const isCurrentlyPaused = matchingStatus === "paused";
  const isAdminReviewPause = isCurrentlyPaused && nextRoundStatus === "admin_review";
  const pauseReason = String(application?.matchingPauseReason || "");
  const expiredReason = String(application?.currentProposal?.expiredReason || application?.schedule?.expiredReason || "");
  const noResponseReasons = new Set(["proposal_no_response", "proposal_expired", "schedule_no_response", "schedule_expired", "schedule_first_choice", "schedule_counterpart_choice"]);
  const hasLegacyNoResponseEvidence =
    noResponseReasons.has(expiredReason) ||
    ["proposal_expired", "schedule_expired", "counterpart_expired"].includes(String(application?.scheduleStatus || "")) ||
    (String(application?.penaltyStats?.lastAdminDecision || "") === "review_held" && stats.totalNoResponseCount > 0);
  const isCurrentAdminReview = isAdminReviewPause && (noResponseReasons.has(pauseReason) || hasLegacyNoResponseEvidence);
  const currentProposalStatus = String(application?.currentProposal?.status || application?.currentProposal?.response || "");
  const hasActiveProposal = Boolean(application?.currentProposal?.candidateApplicationId) &&
    !["expired", "declined", "cancelled", "completed"].includes(currentProposalStatus);

  let restoreBlockReason = "";
  if (!isCurrentAdminReview) restoreBlockReason = "현재 무응답 운영자 검토 정지 상태가 아닙니다.";
  else if (!isActiveApplication(application)) restoreBlockReason = "탈퇴·거절 등 이용 중지 상태입니다.";
  else if (!isFullyApprovedApplication(application)) restoreBlockReason = "프로필 승인 상태를 먼저 확인해야 합니다.";
  else if (!isIdentityVerifiedApplication(application)) restoreBlockReason = "본인인증을 먼저 완료해야 합니다.";
  else if (!isDepositConfirmed(application)) restoreBlockReason = "예치금 잔액 또는 상태를 먼저 정상화해야 합니다.";
  else if (hasActiveProposal) restoreBlockReason = "진행 중인 매칭 제안이 있어 바로 복귀할 수 없습니다.";

  let recommendation = "현재 제한은 없으며 과거 기록만 참고하면 됩니다.";
  if (isCurrentAdminReview) {
    if (restoreBlockReason) recommendation = restoreBlockReason;
    else if (stats.scheduleNoResponseCount >= 2 || stats.totalNoResponseCount >= 3) {
      recommendation = "반복 무응답입니다. 참여 의사와 응답 가능 여부를 직접 확인한 뒤 복귀를 권장합니다.";
    } else if (stats.scheduleNoResponseCount > 0) {
      recommendation = "일정조율 단계 무응답입니다. 실제 만남 가능 시간을 확인한 뒤 복귀를 권장합니다.";
    } else {
      recommendation = "첫 제안 무응답이라면 연락으로 참여 의사를 확인한 뒤 복귀할 수 있습니다.";
    }
  } else if (isCurrentlyPaused) {
    recommendation = "무응답 복귀 버튼으로 처리하면 안 됩니다. 표시된 정지 원인별 절차를 먼저 처리하세요.";
  }

  return {
    isCurrentlyPaused,
    isAdminReviewPause,
    isCurrentAdminReview,
    canRestore: isCurrentAdminReview && !restoreBlockReason,
    restoreBlockReason,
    pauseReasonLabel: getMatchingPauseReasonLabel(application),
    recommendation,
  };
}

export function getPenaltyReasonLabel(value = "") {
  const labels = {
    proposal_no_response: "제안 무응답",
    proposal_expired: "제안 기한초과",
    schedule_no_response: "일정 무응답",
    schedule_expired: "일정 기한초과",
    schedule_first_choice: "첫 일정 선택 무응답",
    schedule_counterpart_choice: "후선택 일정 무응답",
    counterpart_schedule_no_response: "상대 일정 미선택",
    counterpart_expired: "후선택자 기한초과",
    both_schedule_no_response: "양쪽 일정 미선택",
  };

  return labels[value] || value || "-";
}

export function getPenaltyCounterpartOutcomeLabel(value = "") {
  const labels = {
    counterpart_accepted: "상대는 제안을 수락함",
    counterpart_waited: "상대는 일정 선택을 완료하고 대기함",
    both_no_response: "양쪽 모두 기한 내 응답하지 않음",
  };

  return labels[value] || (value ? value : "기존 기록에는 저장되지 않음");
}

export function hasPenaltyRecord(application = {}) {
  return getPenaltyStats(application).totalNoResponseCount > 0;
}

export function getPenaltyTone(application = {}) {
  const total = getPenaltyStats(application).totalNoResponseCount;
  if (total >= 3) return "bad";
  if (total >= 1) return "warn";
  return "good";
}

export function getPenaltySummaryText(application = {}) {
  const stats = getPenaltyStats(application);
  if (!stats.totalNoResponseCount) return "기록 없음";

  return `총 ${stats.totalNoResponseCount}회 · 제안 ${stats.proposalNoResponseCount}회 · 일정 ${stats.scheduleNoResponseCount}회`;
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
  const reviewStatus = String(application?.reviewStatus || "");
  const status = String(application?.status || "");

  if ([reviewStatus, status].includes("rejected")) return false;
  if (reviewStatus === "approved" && status === "approved") return true;

  // 보안 강화 이전에 이미 신청완료 처리된 레거시 회원은
  // 승인값 둘 중 하나만 남아 있어도 완료 기록이 명확하면 승인 상태로 호환한다.
  return isApplicationCompleted(application) && (reviewStatus === "approved" || status === "approved");
}

export function isDepositConfirmed(application = {}) {
  return isDepositParticipationEligible(application?.deposit || {});
}

export function isTwoWeeksTestApplication(application = {}) {
  const basic = getBasic(application);
  const identity = application?.phoneIdentityVerification || {};
  const basicPhone = normalizePhone(basic?.phoneNormalized || basic?.phone || "");
  const verifiedPhone = normalizePhone(identity?.phone || "");

  return isTwoWeeksTestPhone(basicPhone || verifiedPhone);
}

export function isIdentityVerifiedApplication(application = {}) {
  const basic = getBasic(application);
  const identity = application?.phoneIdentityVerification || {};
  const basicPhone = normalizePhone(basic?.phoneNormalized || basic?.phone || "");
  const verifiedPhone = normalizePhone(identity?.phone || "");

  // 고정된 QA 번호 3개만 운영환경에서도 PortOne 본인인증 예외로 인정한다.
  if (isTwoWeeksTestApplication(application)) return true;

  return (
    identity?.verified === true &&
    basic?.phoneVerified === true &&
    basic?.phoneVerificationSkipped !== true &&
    Boolean(basicPhone) &&
    verifiedPhone === basicPhone
  );
}

export function getIdentityVerificationLabel(application = {}) {
  if (isTwoWeeksTestApplication(application)) return "테스트 번호 · 인증 예외";
  return isIdentityVerifiedApplication(application)
    ? "완료"
    : "미완료 · 승인/예치금 확인 불가";
}

export function isApplicationCompleted(application = {}) {
  const smsStatus = String(application?.applicationCompletedSms?.status || "");

  return Boolean(
    application?.applicationCompletedAt ||
    application?.applicationCompletedAtClient ||
    application?.applicationCompletedByUid ||
    smsStatus === "sent"
  );
}

export function getApplicationCompletionBlockReason(application = {}) {
  if (isApplicationCompleted(application)) return "이미 신청완료";
  if (!isIdentityVerifiedApplication(application)) return "본인인증 필요";
  if (!isApprovedApplication(application)) return "프로필 승인 필요";

  const depositStatus = String(application?.deposit?.status || "");
  if (["refund_requested", "refunded"].includes(depositStatus)) return "예치금 반환 상태";

  return "";
}

export function isApplicationCompletionEligible(application = {}) {
  return !getApplicationCompletionBlockReason(application);
}

export function isMatchAvailableApplication(application = {}) {
  const matchingStatus = String(application?.matchingStatus || "not_ready");
  const currentProposalStatus = String(application?.currentProposal?.status || application?.currentProposal?.response || "");
  const hasCurrentProposal = Boolean(application?.currentProposal?.candidateApplicationId) &&
    !["expired", "declined", "cancelled", "canceled", "completed"].includes(currentProposalStatus);

  return (
    isActiveApplication(application) &&
    isFullyApprovedApplication(application) &&
    isIdentityVerifiedApplication(application) &&
    isDepositConfirmed(application) &&
    !hasCurrentProposal &&
    matchingStatus === "not_started"
  );
}


export function getMatchingAvailabilityBlockReason(application = {}) {
  if (!isActiveApplication(application)) return "이용 중지 상태";
  if (!isFullyApprovedApplication(application)) return "프로필 승인 상태 확인 필요";
  if (!isIdentityVerifiedApplication(application)) return "본인인증 필요";
  if (!isDepositConfirmed(application)) return "예치금 확인 필요";
  const currentProposalStatus = String(application?.currentProposal?.status || application?.currentProposal?.response || "");
  const hasActiveProposal = Boolean(application?.currentProposal?.candidateApplicationId) &&
    !["expired", "declined", "cancelled", "canceled", "completed"].includes(currentProposalStatus);
  if (hasActiveProposal) return "진행 중인 매칭 제안 있음";

  if (String(application?.nextRoundStatus || "") === "admin_review") {
    return "무응답 운영자 검토 필요";
  }

  const matchingStatus = String(application?.matchingStatus || "not_ready");
  if (matchingStatus !== "not_started") {
    return `현재 상태: ${STATUS_LABELS[matchingStatus] || matchingStatus}`;
  }

  return "";
}

export function getMatchingDisplayStatus(application = {}) {
  if (!isActiveApplication(application)) return application?.matchingStatus || "cancelled";
  if (!isFullyApprovedApplication(application)) return "not_ready";
  if (!isIdentityVerifiedApplication(application)) return "not_ready";
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
  const aTimes = normalizeTimeSlotLabels(getBasic(a).availableTimeSlots);
  const bTimes = normalizeTimeSlotLabels(getBasic(b).availableTimeSlots);
  return aTimes.filter((time) => bTimes.includes(time));
}

export function getAgeDiff(male = {}, female = {}) {
  const maleAge = getFullAgeFromBasic(getBasic(male));
  const femaleAge = getFullAgeFromBasic(getBasic(female));
  if (!maleAge || !femaleAge) return null;
  return maleAge - femaleAge;
}

const DEFAULT_ADMIN_MATCHING_RATING = 3;

function normalizeAdminRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_ADMIN_MATCHING_RATING;
  return Math.min(5, Math.max(1, Math.round(numeric)));
}

export function getAdminMatchingMeta(application = {}) {
  const meta = application?.adminMatchingMeta || {};
  return {
    profileAppeal: normalizeAdminRating(meta.profileAppeal),
    conditionCompetitiveness: normalizeAdminRating(meta.conditionCompetitiveness),
    matchingReliability: normalizeAdminRating(meta.matchingReliability),
    companyScaleVerified: meta.companyScaleVerified || "",
  };
}

function getSimilarityAdjustment(left, right, table) {
  const diff = Math.abs(normalizeAdminRating(left) - normalizeAdminRating(right));
  return table[diff] ?? 0;
}

function getInternalRankingAdjustment(male = {}, female = {}) {
  const maleMeta = getAdminMatchingMeta(male);
  const femaleMeta = getAdminMatchingMeta(female);
  const profileAdjustment = getSimilarityAdjustment(maleMeta.profileAppeal, femaleMeta.profileAppeal, [4, 2, 0, -2, -4]);
  const conditionAdjustment = getSimilarityAdjustment(maleMeta.conditionCompetitiveness, femaleMeta.conditionCompetitiveness, [3, 1, 0, -1, -3]);
  const averageReliability = (maleMeta.matchingReliability + femaleMeta.matchingReliability) / 2;
  const reliabilityAdjustment = Math.max(-2, Math.min(2, Math.round(averageReliability - 3)));
  const total = Math.max(-8, Math.min(8, profileAdjustment + conditionAdjustment + reliabilityAdjustment));

  return {
    total,
    profileAdjustment,
    conditionAdjustment,
    reliabilityAdjustment,
    male: maleMeta,
    female: femaleMeta,
  };
}

export function getPairScore(male = {}, female = {}) {
  const baseScore = calculateMatchingCompatibility(male, female);
  const sameCompany = getSameCompanyConflict(male, female);
  // 기본 조건 충돌은 관리자가 확인 후 수동으로 제안할 수 있지만,
  // 동일 회사는 명시적인 매칭 금지 조건으로 유지합니다.
  const compatibilityConflicts = baseScore.blockers || [];
  const hardBlockers = sameCompany.blocked
    ? [{ code: "SAME_COMPANY", label: "동일 회사" }]
    : [];
  const blockers = [...compatibilityConflicts, ...hardBlockers];
  const checkedScore = {
    ...baseScore,
    eligible: blockers.length === 0,
    manualEligible: Boolean(baseScore.complete && hardBlockers.length === 0),
    compatibilityConflicts,
    hardBlockers,
    blockers,
    sameCompany,
  };
  const adminRanking = getInternalRankingAdjustment(male, female);
  const rankingScore = checkedScore.complete ? Math.max(0, Math.min(108, (checkedScore.total || 0) + adminRanking.total)) : checkedScore.total || 0;

  return {
    ...checkedScore,
    rankingScore,
    internalAdjustment: adminRanking.total,
    adminRanking,
  };
}

export function buildHighScorePairs(applications = [], limitCount = 999, options = {}) {
  const males = applications.filter((item) => isMale(item) && isMatchAvailableApplication(item));
  const females = applications.filter((item) => isFemale(item) && isMatchAvailableApplication(item));
  const candidatePairs = [];
  const excludedPairKeys = options?.excludedPairKeys instanceof Set ? options.excludedPairKeys : new Set(options?.excludedPairKeys || []);

  males.forEach((male) => {
    females.forEach((female) => {
      // 수동 후보와 저장 단계에서 적용하는 동일 회차 조건을 자동 매칭에도 적용합니다.
      if (getRoundId(male) !== getRoundId(female)) return;
      if (excludedPairKeys.has(`${male.id}__${female.id}`)) return;
      const score = getPairScore(male, female);
      if (!score.complete || !score.eligible) return;
      candidatePairs.push({ male, female, score });
    });
  });

  candidatePairs.sort((a, b) => {
    const rankingDiff = (b.score?.rankingScore ?? b.score?.total ?? 0) - (a.score?.rankingScore ?? a.score?.total ?? 0);
    if (rankingDiff) return rankingDiff;

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
  const depositConfirmed = applications.filter(isDepositConfirmed).length;
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
