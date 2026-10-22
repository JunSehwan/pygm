import { getProposalLifecycleState } from "./proposalLifecycle";

const ENDED = new Set(["declined", "cancelled", "canceled", "expired", "proposal_expired", "schedule_expired", "counterpart_expired", "failed"]);
const KST = "Asia/Seoul";

export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getSeoulDay(ms) {
  if (!ms) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}

export function getMeetingStart(bestMatch) {
  const match = bestMatch?.match || {};
  const schedule = match.schedule || bestMatch?.schedule || {};
  const finalMeeting = bestMatch?.finalMeeting || match.finalMeeting || schedule.finalMeeting || {};
  return toMillis(finalMeeting.startAtClient || finalMeeting.finalTimeChoice?.startAtClient || finalMeeting.timeChoice?.startAtClient || finalMeeting.selectedChoice?.startAtClient);
}

const state = (phase, title, description = "", opts = {}) => ({
  phase, title, description, step: 0, target: "candidate", cta: "", actionable: false, ...opts,
});

// Pure UI-only interpretation. Never changes match, schedule, deposit or feedback records.
export function resolveIntroJourney({
  application = {}, bestMatch = null, responseStatus = "", feedbackReady = false,
  scheduleActionRequired = false, scheduleOpen = false, proposalExpired = false,
  proposalDueAt = "", scheduleDueAt = "", nowMs = Date.now(),
 } = {}) {
  // During initial load/refresh the application can be null despite the default argument.
  // Do not interpret the missing object as an approved member or dereference its fields.
  if (!application || typeof application !== "object") {
    return state("loading", "소개 정보를 확인하고 있어요.", "잠시 후 현재 상태가 표시돼요.");
  }
  const review = String(application.reviewStatus || "pending");
  const matching = String(application.matchingStatus || "");
  const deposit = application.deposit || {};
  const match = bestMatch?.match || {};
  const matchId = String(match.id || bestMatch?.matchId || "");
  const currentMatchId = String(application.currentProposal?.matchId || "");
  const current = Boolean(matchId && currentMatchId === matchId && bestMatch?.candidate);
  const lifecycle = getProposalLifecycleState({ application, bestMatch: current ? bestMatch : null, responseStatus: current ? responseStatus : "" });
  const matchStatus = String(match.status || "");
  const schedule = match.schedule || bestMatch?.schedule || {};
  const scheduleStatus = String(match.scheduleStatus || schedule.status || "");
  const scheduleProgress = current && (scheduleOpen || lifecycle.scheduleOpen);
  const startMs = getMeetingStart(current ? bestMatch : null);
  const dateToday = getSeoulDay(nowMs);
  const dateMeeting = getSeoulDay(startMs);
  const isMeetingDay = Boolean(dateToday && dateMeeting === dateToday);
  const dateTomorrow = Boolean(startMs && getSeoulDay(nowMs + 86400000) === dateMeeting);
  const withinTwoHours = Boolean(startMs && startMs > nowMs && startMs - nowMs <= 7200000);
  const meetingConfirmed = current && scheduleProgress && (scheduleStatus === "confirmed" || matchStatus === "confirmed" || Boolean(match.finalMeeting || schedule.finalMeeting));

  if (["withdrawn", "cancelled", "rejected"].includes(application.status) || review === "rejected")
    return state("inactive", "현재 신청 상태를 확인해주세요.", "MY에서 자세한 내용을 확인할 수 있어요.", { target: "status" });
  if (matching === "paused" || application.nextRoundStatus === "user_paused")
    return state("paused", "소개를 잠시 쉬고 있어요.", "MY에서 언제든 매칭을 다시 시작할 수 있어요.", { target: "profile" });
  if (feedbackReady)
    return state("feedback", "오늘 만남은 어떠셨나요?", "만남 이야기를 들려주세요.", { step: 5, target: "feedback", cta: "피드백 남기기", actionable: true });
  // Previous completed match is not an active candidate or upcoming appointment.
  if (!current) {
    if (matchId && matchId === currentMatchId && ENDED.has(matchStatus))
      return state("ended", "이번 소개는 마무리되었어요.", "다음 소개가 준비되면 안내드릴게요.");
    if (matchId && matchStatus === "completed" && !["ready", "queued"].includes(String(application.nextRoundStatus || "")))
      return state("result", "이번 소개가 마무리되었어요.", "지난 소개에서 진행 결과를 확인할 수 있어요.", { step: 5, target: "result", cta: "지난 소개 확인", actionable: true });
    if (["pending", "reviewing"].includes(review))
      return state("review", "프로필을 검토하고 있어요.", "검토 후 소개를 준비해드릴게요.");
    if (deposit.status === "topup_required" || deposit.noShowResolution === "deducted_top_up_required")
      return state("deposit", "만남보증금 보충 안내가 있어요.", "MY에서 실제 부족 금액을 확인해주세요.", { target: "deposit", cta: "보증금 확인", actionable: true });
    if (deposit.requestStage === "requested" && deposit.status === "pending")
      return state("deposit", "만남보증금 안내가 도착했어요.", "요청한 입금 내용을 확인해주세요.", { target: "deposit", cta: "입금 안내 확인", actionable: true });
    return state("waiting", "잘 맞는 인연을 찾고 있어요.", "새로운 소개가 준비되면 문자로 알려드릴게요.");
  }
  if (lifecycle.terminal || ENDED.has(matchStatus))
    return state("ended", "이번 소개는 마무리되었어요.", "다음 소개가 준비되면 안내드릴게요.", { target: "result" });
  if (meetingConfirmed) {
    const arrivals = match.meetingArrival || {};
    const ownArrival = arrivals[application.id]?.status === "arrived";
    const counterpartId = application.id === match.maleApplicationId ? match.femaleApplicationId : match.maleApplicationId;
    const counterpartArrival = arrivals[counterpartId]?.status === "arrived";
    if (isMeetingDay && withinTwoHours && !counterpartArrival && !ownArrival) return state("meeting_soon", "곧 만나는 시간이에요.", "시간과 장소를 다시 확인해주세요.", { step: 4, target: "schedule", cta: "약속 확인하기", actionable: true, startMs });
    if (isMeetingDay)
      return state("meeting_day", counterpartArrival ? "상대방이 도착했어요." : "오늘은 만나는 날이에요!", "약속 장소와 도착 상태를 확인해주세요.", { step: 4, target: "schedule", cta: ownArrival ? "약속 자세히 보기" : "도착 확인하기", actionable: true, startMs });
    if (dateTomorrow) return state("meeting_tomorrow", "내일 만나는 날이에요!", "만날 시간과 장소를 확인해봐요.", { step: 4, target: "schedule", cta: "약속 다시 보기", actionable: true, startMs });
    return state("confirmed", "만날 준비가 됐어요 ☕", "확정된 약속을 확인해보세요.", { step: 4, target: "schedule", cta: "약속 자세히 보기", actionable: true, startMs });
  }
  if (scheduleProgress) {
    const firstSelector = String(schedule.firstSelectorApplicationId || "");
    const isFirst = firstSelector === String(application.id || "");
    if (scheduleActionRequired) {
      const title = scheduleStatus === "needs_final_choice" || (firstSelector && !isFirst) ? "이번에는 최종 약속을 정해주세요." : "만날 날짜와 장소를 골라주세요.";
      return state("schedule_action", title, "가능한 후보를 선택해 상대에게 전해주세요.", { step: 3, target: "schedule", cta: "일정 선택하기", actionable: true, dueAt: scheduleDueAt });
    }
    return state("schedule_wait", scheduleStatus === "place_pending" ? "장소를 확인하고 있어요." : "상대방의 일정 선택을 기다리고 있어요.", "선택한 내용은 아래에서 확인할 수 있어요.", { step: 3, target: "schedule", dueAt: scheduleDueAt });
  }
  if (lifecycle.bothAccepted) return state("mutual", "두 분 모두 만나보고 싶어해요! 🎉", "이제 약속을 준비할 차례예요.", { step: 2, target: "schedule" });
  if (lifecycle.waitingForCounterpart || responseStatus === "accepted")
    return state("accepted", "상대방의 답변을 기다리고 있어요.", "마음이 전달됐어요. 답변이 오면 안내드릴게요.", { step: 1, target: "candidate", dueAt: proposalDueAt });
  if (proposalExpired || (toMillis(proposalDueAt) > 0 && toMillis(proposalDueAt) <= nowMs))
    return state("expired", "이번 소개의 응답 시간이 지났어요.", "다음 안내를 기다려주세요.", { target: "candidate" });
  if (lifecycle.viewerResponse === "declined" || responseStatus === "declined")
    return state("ended", "이번 소개는 마무리되었어요.", "다음 소개가 준비되면 안내드릴게요.");
  if (lifecycle.counterpartDeclined)
    return state("ended", "이번 소개는 마무리되었어요.", "다음 소개가 준비되면 안내드릴게요.");
  return state("candidate", "새로운 소개가 도착했어요.", "이번 소개를 확인하고 답을 알려주세요.", { step: 1, target: "candidate", cta: "이번 소개 확인하기", actionable: true, dueAt: proposalDueAt });
}

export function summaryPastMatch(match = {}, viewerId = "") {
  const status = String(match.status || "");
  const meeting = match.finalMeeting || match.schedule?.finalMeeting || {};
  const time = toMillis(match.completedAtClient || meeting.startAtClient || match.updatedAtClient || match.createdAtClient || match.updatedAt || match.createdAt);
  const terminal = ENDED.has(status) || status === "completed";
  const feedbackStatus = String(match.feedbackStatus || "");
  if (!terminal || (status === "completed" && !["completed", "issue_reported", "timeout_processed"].includes(feedbackStatus))) return null;
  if (match.maleApplicationId !== viewerId && match.femaleApplicationId !== viewerId) return null;
  const label = status === "completed" ? "만남 완료" : status === "declined" ? "소개 종료" : status === "cancelled" || status === "canceled" ? "약속 취소" : status.includes("expired") ? "기한 만료" : "소개 종료";
  return { id: match.id, dateMs: time, label };
}
