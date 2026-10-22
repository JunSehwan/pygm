// UI-only status interpreter. The Callable Function remains the authority for pause/resume.
const ACTIVE = new Set(["proposed", "accepted", "mutualAccepted", "confirmed"]);
const BLOCK_NEXT = new Set(["refund_requested", "refunded", "feedback_overdue", "admin_review", "top_up_required", "sanction_restricted", "withdrawn", "withdrawal_scheduled", "admin_hold"]);
const ENDED = new Set(["completed", "declined", "cancelled", "canceled", "expired", "proposal_expired", "schedule_expired", "counterpart_expired", "failed"]);
export function getMyMatchingControl(application = {}) {
  if (!application || typeof application !== "object") return { active: false, inProgress: false, action: "", label: "확인 중", reason: "현재 상태를 불러오고 있어요." };
  const next = String(application.nextRoundStatus || "");
  const matching = String(application.matchingStatus || "");
  const proposal = application.currentProposal || {};
  // Match this guard to functions/twoWeeksMatchingAvailability.js: hasActiveMatch.
  const inProgress = ACTIVE.has(matching) || Boolean(proposal.matchId || proposal.candidateApplicationId);
  const pausedByUser = next === "user_paused" || (matching === "paused" && (next === "contact_connected" || application.matchingPauseReason === "user_choice"));
  const eligibleStatus = application.status === "approved" && application.reviewStatus === "approved";
  const disabledAccount = ["cancelled", "withdrawn", "rejected"].includes(String(application.status || "")) || application.withdrawal?.status === "completed";
  const blocked = disabledAccount || BLOCK_NEXT.has(next) || !eligibleStatus;
  // A previous meeting may be 'completed' while the next round has already become 'ready'.
  // Do not mistakenly show OFF simply because matchingStatus is not 'not_started'.
  const ready = !pausedByUser && !inProgress && !blocked && ["ready", "queued"].includes(next) &&
    (["not_started", "ready", "completed", "declined", "expired", "failed", "cancelled", "canceled", ""].includes(matching));
  const action = inProgress || blocked ? "" : pausedByUser ? "resume" : ready ? "pause" : "";
  const active = inProgress || ready || (!pausedByUser && !blocked && application.matchingAvailability === "active");
  let label = "변경 제한";
  let reason = "현재 상태를 확인해 주세요.";
  if (inProgress && ENDED.has(matching) && next === "ready") { label = "이전 소개 확인 필요"; reason = "종료된 소개 정보가 남아 있어 설정을 변경할 수 없어요. 운영자에게 확인해주세요."; }
  else if (inProgress) { label = "진행 중"; reason = "현재 소개가 마무리되면 설정을 변경할 수 있어요."; }
  else if (disabledAccount) { label = "이용 종료"; reason = "계정 상태를 확인해 주세요."; }
  else if (!eligibleStatus) { label = "승인 확인 중"; reason = "프로필 승인이 완료되면 소개를 시작할 수 있어요."; }
  else if (next === "top_up_required") { label = "보증금 확인 필요"; reason = "보증금 확인 후 다음 소개를 진행할 수 있어요."; }
  else if (BLOCK_NEXT.has(next)) { label = "운영 확인 중"; reason = "안내된 확인 절차가 끝나면 다시 설정할 수 있어요."; }
  else if (pausedByUser) { label = "쉬는 중"; reason = "다시 시작하면 새로운 소개를 받을 수 있어요."; }
  else if (ready) { label = "소개 대기 중"; reason = "새로운 소개를 준비하고 있어요."; }
  else if (active) { label = "소개 준비 중"; reason = "새로운 소개를 준비하고 있어요."; }
  else if (next === "not_ready") { label = "준비 확인 중"; reason = "관리자 확인 후 소개를 시작할 수 있어요."; }
  return { active, inProgress, action, label, reason };
}
