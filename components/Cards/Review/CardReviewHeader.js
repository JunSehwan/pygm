import React from "react";
import { FiArrowLeft, FiEye, FiHeart, FiMessageCircle } from "react-icons/fi";

export default function CardReviewHeader({
  title,
  categoryLabel,
  views = 0,
  answerCount = 0,
  likeCount = 0,
  remainingAnswerViewCount = 0,
  remainingProfileDetailCount = 0,
  showRemainingInfo = true,
  onBack,
}) {
  return (
    <div className="shrink-0 border-b border-solid border-slate-200 bg-white px-5 pb-4 pt-4">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md bg-transparent px-0 py-1 text-[14px] font-medium text-slate-500 transition hover:text-slate-700"
        >
          <FiArrowLeft className="text-[16px]" />
          되돌아가기
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
            {title}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <FiEye className="text-[15px]" />
              {views}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiMessageCircle className="text-[15px]" />
              {answerCount}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiHeart className="text-[15px]" />
              {likeCount}
            </span>
          </div>

          {showRemainingInfo && (
            <div className="mt-3 max-w-fit rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-[13px] leading-5 text-pink-700">
              카드답변 열람 {remainingAnswerViewCount}개 · 프로필 상세열람 {remainingProfileDetailCount}개 남음
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-md bg-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700">
          {categoryLabel}
        </div>
      </div>
    </div>
  );
}