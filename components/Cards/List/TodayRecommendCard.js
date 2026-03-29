import React from "react";
import { FiStar } from "react-icons/fi";
import { CARD_CATEGORY_LABEL, CARD_TYPE_LABEL } from "./cardListMeta";

export default function TodayRecommendCard({ card, onClick }) {
  if (!card) return null;

  return (
    <div className="px-4 pt-3">
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-md border border-violet-200 bg-white px-4 py-4 text-left shadow-[0_1px_8px_rgba(15,23,42,0.04)]"
      >
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[12px] font-medium text-violet-700">
          <FiStar className="text-[13px]" />
          오늘의 추천 카드
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-300 bg-slate-100 px-3 py-[6px] text-[12px] font-medium text-slate-500">
            {CARD_CATEGORY_LABEL[card.category] || "카테고리"}
          </span>
          <span className="rounded-md border border-slate-300 bg-slate-100 px-3 py-[6px] text-[12px] font-medium text-slate-500">
            {CARD_TYPE_LABEL[card.questionType] || "작성형"}
          </span>
        </div>

        <div className="text-[17px] font-semibold leading-7 tracking-[-0.02em] text-slate-800">
          {card.title}
        </div>
        <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-slate-600">
          {card.body || card.guide || ""}
        </p>
      </button>
    </div>
  );
}