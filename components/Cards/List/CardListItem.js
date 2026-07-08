import React from "react";
import {
  FiCheck,
  FiChevronRight,
  FiEye,
  FiHeart,
  FiLock,
  FiMessageCircle,
} from "react-icons/fi";
import { CARD_CATEGORY_LABEL, CARD_TYPE_LABEL } from "./cardListMeta";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

const CARD_PRESS_CLASS =
  "transition-all duration-150 ease-out hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] active:translate-y-[1px] active:scale-[0.99] active:shadow-sm";

function GuestLockOverlay({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]"
    >
      <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-700">
          <FiLock className="text-slate-500" />
          로그인 후 전체 질문 보기
        </div>
      </div>
    </button>
  );
}

export default function CardListItem({
  card,
  answered,
  isLocked,
  actionMode,
  onCardClick,
  onLockedClick,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={isLocked ? onLockedClick : onCardClick}
        className={cn(
          "relative w-full rounded-md border border-slate-200 bg-white px-4 py-4 text-left shadow-[0_1px_8px_rgba(15,23,42,0.04)]",
          CARD_PRESS_CLASS
        )}
      >
        <div className={cn(isLocked ? "select-none blur-[1.5px]" : "")}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-slate-300 bg-slate-100 px-3 py-[7px] text-[13px] font-medium text-slate-500">
              {CARD_CATEGORY_LABEL[card.category] || "카테고리"}
            </span>

            <span className="rounded-md border border-slate-300 bg-slate-100 px-3 py-[7px] text-[13px] font-medium text-slate-500">
              {CARD_TYPE_LABEL[card.questionType] || "작성형"}
            </span>
          </div>

          <div className="text-[18px] font-semibold leading-7 tracking-[-0.02em] text-slate-800">
            {card.title}
          </div>

          <p className="mt-2 line-clamp-2 text-[15px] leading-6 text-slate-600">
            {card.body || card.guide || ""}
          </p>

          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiEye className="text-[14px]" />
                {(card.views || 0).toLocaleString()}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <FiMessageCircle className="text-[14px]" />
                {(card.answerCount || 0).toLocaleString()}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <FiHeart className="text-[14px]" />
                {(card.interestedCount || 0).toLocaleString()}
              </span>
            </div>

            <div className="shrink-0">
              {actionMode === "answered" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                  <FiCheck className="text-[18px]" />
                </div>
              ) : null}

              {actionMode === "write" ? (
                <div className="rounded-md bg-violet-600 px-4 py-2 text-[14px] font-semibold text-white">
                  작성하기
                </div>
              ) : null}

              {actionMode === "login" ? (
                <div className="rounded-md bg-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600">
                  로그인
                </div>
              ) : null}

              {actionMode === "view" ? (
                <div className="rounded-md bg-slate-100 px-4 py-2 text-[13px] font-medium text-slate-600">
                  둘러보기
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {!isLocked ? (
          <div className="pointer-events-none absolute right-3 top-3 text-slate-300">
            <FiChevronRight className="text-[18px]" />
          </div>
        ) : null}
      </button>

      {isLocked ? <GuestLockOverlay onClick={onLockedClick} /> : null}
    </div>
  );
}