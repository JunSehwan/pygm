import { deleteField, serverTimestamp } from "firebase/firestore";
import { ActionButton, FieldRow, Section } from "./AdminCommon";
import {
  formatDate,
  getNoResponseReviewState,
  getPenaltyCounterpartOutcomeLabel,
  getPenaltyReasonLabel,
  getPenaltyStats,
  getPenaltySummaryText,
  getPenaltyTone,
  getStatusLabel,
  hasPenaltyRecord,
  hasLegacyApprovedProfilePhotoException,
  hasMatchingEligibleProfilePhotos,
} from "./utils";
import { TWOWEEKS_MIN_PROFILE_PHOTOS } from "../TwoWeeksShared/profilePhotoPolicy";

function buildReturnToPoolPatch() {
  const nowClient = new Date().toISOString();
  return {
    matchingStatus: "not_started",
    nextRoundStatus: "ready",
    matchingAvailability: "active",
    matchingPauseReason: deleteField(),
    scheduleStatus: "not_started",
    meetingStatus: "not_started",
    photoRevealStatus: "hidden",
    currentProposal: deleteField(),
    schedule: deleteField(),
    "penaltyStats.reviewStatus": "cleared",
    "penaltyStats.clearedAt": serverTimestamp(),
    "penaltyStats.clearedAtClient": nowClient,
    "penaltyStats.lastAdminDecision": "returned_to_pool",
    "penaltyStats.lastAdminDecisionAt": serverTimestamp(),
    "penaltyStats.lastAdminDecisionAtClient": nowClient,
    resumedAt: serverTimestamp(),
    resumedAtClient: nowClient,
    updatedAt: serverTimestamp(),
  };
}

export default function NoResponseReviewPanel({ application, onUpdate, busy = false }) {
  const stats = getPenaltyStats(application);
  const state = getNoResponseReviewState(application);
  const hasPenalty = hasPenaltyRecord(application);
  const profilePhotosReady = hasMatchingEligibleProfilePhotos(application);
  const legacyPhotoException = hasLegacyApprovedProfilePhotoException(application);
  const stateTone = state.isCurrentAdminReview
    ? "border-orange-200 bg-orange-50 text-orange-900"
    : state.isCurrentlyPaused
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <Section
      title="무응답 기록 · 현재 정지 판단"
      desc="과거 무응답 이력과 현재 매칭 제한을 분리해 표시합니다. 복귀 버튼은 실제 무응답 검토 정지 회원에게만 열립니다."
    >
      <div className={`mb-3 border px-4 py-3 ${stateTone}`}>
        <div className="text-xs font-black opacity-70">현재 판정</div>
        <div className="mt-1 text-base font-black">
          {state.isCurrentAdminReview ? "무응답으로 현재 운영자 검토 정지" : state.isCurrentlyPaused ? "다른 사유로 현재 일시정지" : "현재 매칭 정지 아님"}
        </div>
        <div className="mt-1 break-keep text-sm font-bold leading-6">{state.pauseReasonLabel}</div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="border border-zinc-200 bg-white p-3">
          <div className="text-xs font-bold text-zinc-400">총 무응답</div>
          <div className={`mt-1 text-2xl font-bold ${getPenaltyTone(application) === "bad" ? "text-rose-600" : hasPenalty ? "text-orange-600" : "text-emerald-600"}`}>
            {stats.totalNoResponseCount}
          </div>
        </div>
        <div className="border border-zinc-200 bg-white p-3">
          <div className="text-xs font-bold text-zinc-400">제안 무응답</div>
          <div className="mt-1 text-2xl font-bold text-zinc-950">{stats.proposalNoResponseCount}</div>
        </div>
        <div className="border border-zinc-200 bg-white p-3">
          <div className="text-xs font-bold text-zinc-400">일정 무응답</div>
          <div className="mt-1 text-2xl font-bold text-zinc-950">{stats.scheduleNoResponseCount}</div>
        </div>
        <div className="border border-zinc-200 bg-white p-3">
          <div className="text-xs font-bold text-zinc-400">검토 상태</div>
          <div className="mt-1 break-keep text-sm font-bold leading-6 text-zinc-800">
            {state.isCurrentAdminReview ? "복귀 판단 필요" : getStatusLabel(stats.reviewStatus || "-")}
          </div>
        </div>
      </div>

      <div className="mt-3 border border-zinc-200 bg-zinc-50 px-4">
        <FieldRow label="이력 요약" value={getPenaltySummaryText(application)} />
        <FieldRow label="마지막 사유" value={getPenaltyReasonLabel(stats.lastPenaltyReason)} />
        <FieldRow label="마지막 발생" value={stats.lastPenaltyAtClient ? formatDate(stats.lastPenaltyAtClient) : "-"} />
        <FieldRow label="최근 관련 매칭" value={stats.lastMatchId || "기존 기록 없음"} />
        <FieldRow label="상대 응답 영향" value={getPenaltyCounterpartOutcomeLabel(stats.lastCounterpartOutcome)} />
        <FieldRow label="현재 원시 상태" value={`${getStatusLabel(application.matchingStatus || "-")} / ${getStatusLabel(application.nextRoundStatus || "-")}`} />
        <FieldRow label="운영 판단 가이드" value={state.recommendation} />
        {stats.clearedAt ? <FieldRow label="이전 검토 해제" value={formatDate(stats.clearedAt)} /> : null}
      </div>

      {state.isCurrentAdminReview ? (
        <div className="mt-3">
          {state.restoreBlockReason ? (
            <div className="mb-2 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
              복귀 불가: {state.restoreBlockReason}
            </div>
          ) : null}
          {!profilePhotosReady ? (
            <div className="mb-2 border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
              복귀 불가: 프로필 사진 최소 {TWOWEEKS_MIN_PROFILE_PHOTOS}장 필요
            </div>
          ) : null}
          {legacyPhotoException ? (
            <div className="mb-2 border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
              기존 승인 프로필 예외 적용 · 사진 1~2장 상태로 매칭풀 복귀 가능
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <ActionButton
              disabled={busy || !state.canRestore || !profilePhotosReady}
              onClick={() => onUpdate(application.id, buildReturnToPoolPatch())}
              tone="good"
            >
              확인 완료 · 매칭풀 복귀
            </ActionButton>
            <ActionButton
              disabled={busy}
              onClick={() => onUpdate(application.id, {
                matchingStatus: "paused",
                nextRoundStatus: "admin_review",
                "penaltyStats.reviewStatus": "admin_review",
                "penaltyStats.lastAdminDecision": "review_held",
                "penaltyStats.lastAdminDecisionAt": serverTimestamp(),
                "penaltyStats.lastAdminDecisionAtClient": new Date().toISOString(),
                updatedAt: serverTimestamp(),
              })}
              tone="warn"
            >
              검토 유지
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-xs font-bold leading-5 text-zinc-500">
          {state.isCurrentlyPaused ? "이 회원은 무응답 검토 복귀 대상이 아닙니다. 정지 원인에 맞는 처리 후 상태를 변경하세요." : "과거 기록은 유지되지만 현재 매칭풀 복귀 조치는 필요하지 않습니다."}
        </div>
      )}
    </Section>
  );
}
