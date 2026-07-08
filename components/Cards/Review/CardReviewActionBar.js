import React from "react";
import { FiHeart, FiSkipForward, FiUser } from "react-icons/fi";
import { RiEmotionUnhappyLine } from "react-icons/ri";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function ActionButton({ icon, label, labelClassName, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md py-1 transition active:scale-[0.98]"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-slate-50 p-2 shadow-sm transition hover:bg-slate-100">
        {icon}
      </div>

      <div
        className={cn(
          "max-w-full truncate text-[11px] font-semibold leading-4 text-slate-600",
          labelClassName
        )}
      >
        {label}
      </div>
    </button>
  );
}

export default function CardReviewActionBar({
  onDislike,
  onPass,
  onProfile,
  onLike,
}) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-3 pt-2 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-10px_24px_rgba(15,23,42,0.05)]">
      <div className="mx-auto grid max-w-[390px] grid-cols-4 gap-1.5">
        <ActionButton
          icon={<RiEmotionUnhappyLine className="text-[25px] text-slate-600" />}
          label="읽씹각"
          onClick={onDislike}
        />

        <ActionButton
          icon={<FiSkipForward className="text-[25px] text-slate-700" />}
          label="패스하기"
          onClick={onPass}
        />

        <ActionButton
          icon={<FiUser className="text-[25px] text-[#6a73ff]" />}
          label="프로필보기"
          labelClassName="text-[#6a73ff]"
          onClick={onProfile}
        />

        <ActionButton
          icon={<FiHeart className="text-[25px] text-[#ff4338]" />}
          label="심쿵"
          labelClassName="text-[#ff4338]"
          onClick={onLike}
        />
      </div>
    </div>
  );
}