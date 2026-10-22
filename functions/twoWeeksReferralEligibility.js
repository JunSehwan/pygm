"use strict";
// Pure, conservative eligibility predicate shared by automatic trigger and admin backfill.
function assessFirstMeeting(matches = []) {
  const timeValue = value => {
    if (value?.toMillis) return value.toMillis();
    if (value?.seconds) return value.seconds * 1000;
    if (typeof value === "string") return Date.parse(value) || 0;
    return 0;
  };
  const ordered = [...matches].sort((a, b) => timeValue(a.createdAt || a.createdAtClient) - timeValue(b.createdAt || b.createdAtClient));
  const first = ordered.find(m => m.status === "completed" || m.feedbackStatus === "completed" || m.feedbackStatus === "reviewed");
  if (!first) return { status: "meeting_pending", matchId: "", reason: "첫 실제 만남 완료 확인 전" };
  if (first.noShowReviewStatus || first.noShowStatus || first.feedbackSummary?.needsAdminReview) {
    return { status: "needs_review", matchId: first.id, reason: "노쇼·불참·분쟁 등 관리자 확인 필요" };
  }
  const summary = first.feedbackSummary || {};
  const positive = first.feedbackStatus === "completed" && Number(summary.submittedCount || 0) >= 2 && Number(summary.metCount || 0) >= 2 && Number(summary.discomfortCount || 0) === 0;
  return { status: positive ? "eligible" : "needs_review", matchId: first.id, reason: positive ? "양측 실제 만남 피드백 확인" : "첫 실제 만남 여부 추가 확인 필요" };
}
module.exports = { assessFirstMeeting };
