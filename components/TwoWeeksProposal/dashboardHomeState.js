// Pure HOME state interpretation. Legacy schedule/deadline predicates are evaluated by ProposalDashboard.
const TERMINAL = new Set(["completed", "failed", "expired", "cancelled", "canceled", "proposal_expired", "schedule_expired"]);

export function profileCompletion(application = {}) {
  const basic = application.basic || {};
  const identity = application.identity || {};
  const traits = application.profileTraits || {};
  const prefs = application.matchingPreferences || {};
  const checks = [
    { key: "identity", label: "본인 확인", weight: 10, ok: basic.phoneVerified === true },
    { key: "intro", label: "닉네임과 자기소개", weight: 20, ok: Boolean(basic.nickname?.trim?.() && basic.introduction?.trim?.()) },
    { key: "height", label: "키와 기본정보", weight: 10, ok: Boolean(Number(basic.height) && basic.gender && basic.birthYear) },
    { key: "photos", label: "프로필 사진", weight: 20, ok: Boolean(identity.representativePhoto && (identity.additionalPhotos || []).length >= 2) },
    { key: "job", label: "직업과 학력", weight: 15, ok: Boolean(identity.jobCategory && identity.educationLevel && identity.schoolName) },
    { key: "meeting", label: "만날 지역과 시간", weight: 15, ok: Boolean((basic.activityAreas || []).length && (basic.availableTimeSlots || []).length) },
    { key: "traits", label: "관심사와 MBTI", weight: 5, ok: Boolean(traits.mbti && (traits.interests || []).length) },
    { key: "preferences", label: "원하는 상대 조건", weight: 5, ok: Boolean(prefs.preferredAgeRange?.min || (prefs.preferredStyles || []).length) },
  ];
  return {
    percent: checks.filter((item) => item.ok).reduce((sum, item) => sum + item.weight, 0),
    missing: checks.filter((item) => !item.ok).map((item) => item.label),
  };
}

export function resolveHomeState({ application = {}, bestMatch = null, responseStatus = "", feedbackReady = false, scheduleActionRequired = false, scheduleOpen = false, counterpartDeclined = false, proposalExpired = false, proposalDueAt = "", scheduleDueAt = "", nowMs = Date.now() } = {}) {
  const review = String(application.reviewStatus || "pending");
  const matching = String(application.matchingStatus || "");
  const match = bestMatch?.match || {};
  const matchStatus = String(match.status || "");
  const scheduleStatus = String(match.scheduleStatus || match.schedule?.status || "");
  const isActive = bestMatch && !TERMINAL.has(matchStatus);
  const deposit = application.deposit || {};
  const action = (title, description, label = "", tab = "", dueAt = "") => ({ title, description, label, tab, dueAt });
  if (["withdrawn", "cancelled", "rejected"].includes(application.status) || review === "rejected") {
    return action("신청 상태를 확인해주세요.", "자세한 내용은 내 신청정보에서 확인할 수 있어요.", "신청정보 확인", "status");
  }
  if (feedbackReady) return action("만남은 어떠셨나요?", "오늘의 만남 이야기를 들려주세요.", "피드백 남기기", "feedback");
  if (isActive && scheduleOpen && scheduleStatus === "confirmed") {
    const fm = bestMatch?.finalMeeting || match.finalMeeting || match.schedule?.finalMeeting || {};
    const startAt = fm.startAtClient || fm.finalTimeChoice?.startAtClient || fm.timeChoice?.startAtClient;
    const timestamp = startAt ? new Date(startAt).getTime() : 0;
    const sameDay = timestamp && new Date(timestamp).toDateString() === new Date(nowMs).toDateString();
    if (sameDay) return action("오늘은 만나는 날이에요!", "약속 장소와 도착 확인을 준비해주세요.", "약속 확인하기", "schedule");
  }
  if (isActive && scheduleOpen && scheduleActionRequired) return action("만날 날짜를 골라주세요.", "상대와 만날 시간을 함께 정해볼까요?", "일정 선택하기", "schedule", scheduleDueAt);
  if (isActive && bestMatch?.candidate && !counterpartDeclined && !["accepted", "declined"].includes(responseStatus) && !proposalExpired) return action("새로운 소개가 도착했어요!", "한 사람을 소개해드릴게요. 제안 기한을 확인해주세요.", "이번 소개 확인하기", "candidate", proposalDueAt);
  if (deposit.status === "topup_required" || deposit.noShowResolution === "deducted_top_up_required") return action("만남보증금 보충 안내가 있어요.", "다음 소개 전 필요한 금액을 확인해주세요.", "보증금 확인하기", "deposit");
  if (isActive && scheduleOpen && scheduleStatus === "confirmed") return action("설레는 만남이 기다리고 있어요!", "확정된 약속을 확인해보세요.", "약속 자세히 보기", "schedule");
  if (isActive && scheduleOpen) return action("만날 준비를 함께 하고 있어요.", "상대의 선택이나 장소 확정을 기다리고 있어요.", "일정 확인하기", "schedule");
  if (isActive && responseStatus === "accepted") return action("마음을 전했어요!", "상대의 답변을 기다리고 있어요.");
  if (isActive && proposalExpired) return action("이번 소개의 응답 기한이 지났어요.", "다음 소개가 준비되면 알려드릴게요.");
  if (deposit.requestStage === "requested" && deposit.status === "pending") return action("만남보증금 안내가 도착했어요.", "입금 요청 내용은 MY에서 확인할 수 있어요.", "보증금 확인하기", "deposit");
  if (["pending", "reviewing"].includes(review)) return action("프로필을 검토하고 있어요.", "검토에는 약 2~3일이 걸릴 수 있어요.");
  if (matching === "paused" || application.nextRoundStatus === "user_paused") return action("지금은 소개를 쉬고 있어요.", "준비되면 MY에서 매칭을 재개할 수 있어요.", "매칭 설정", "result");
  return action("잘 맞는 인연을 찾고 있어요.", "가까운 곳에서 편하게 만날 수 있는 한 사람을 살펴보고 있어요.");
}
