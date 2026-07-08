import React from "react";
import { FiArrowLeft } from "react-icons/fi";

export default function CardReviewEmptyState({
  card,
  getCardCategory,
  getQuestionType,
  getCardTitle,
  getCardBody,
  getViewCount,
  getAnswerCount,
  getLikeCount,
  hasAnyAnswers,
  onBack,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[24px] font-bold tracking-[-0.03em] text-slate-900">
            차밍카드
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-slate-700"
          >
            <FiArrowLeft className="text-[24px]" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-md bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-600">
              {getCardCategory(card)}
            </span>
            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-600">
              {getQuestionType(card)}
            </span>
          </div>

          <div className="mt-3 text-[18px] font-bold leading-7 text-slate-800">
            {getCardTitle(card)}
          </div>

          <div className="mt-2 whitespace-pre-line text-[15px] leading-6 text-slate-500">
            {getCardBody(card)}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[15px] text-slate-400">
            <span>조회 {Number(getViewCount(card) || 0).toLocaleString()}</span>
            <span>·</span>
            <span>답변 {Number(getAnswerCount(card) || 0).toLocaleString()}</span>
            <span>·</span>
            <span>좋아요 {Number(getLikeCount(card) || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
          <div className="text-[18px] font-semibold text-slate-800">
            {hasAnyAnswers
              ? "이 카드의 답변을 모두 확인했어요"
              : "아직 도착한 답변이 없어요"}
          </div>

          <div className="mt-2 whitespace-pre-line text-[14px] leading-6 text-slate-500">
            {hasAnyAnswers
              ? "답변은 모두 확인했지만, 차밍카드 내용은 계속 볼 수 있어요."
              : "새 답변이 도착하면 여기서 바로 확인할 수 있어요."}
          </div>

          <button
            type="button"
            onClick={onBack}
            className="mt-5 rounded-md bg-violet-500 px-4 py-3 text-[15px] font-bold text-white"
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}