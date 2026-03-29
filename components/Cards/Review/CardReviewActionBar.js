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
      className="flex flex-1 flex-col items-center justify-center gap-1"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-50 p-2 shadow hover:bg-slate-100">
        {icon}
      </div>
      <div className={cn("text-[13px] font-medium text-slate-600", labelClassName)}>
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
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
      <div className="grid grid-cols-4 gap-2">
        <ActionButton
          icon={<RiEmotionUnhappyLine className="text-[28px] text-slate-600" />}
          label="읽씹각"
          onClick={onDislike}
        />

        <ActionButton
          icon={<FiSkipForward className="text-[28px] text-slate-700" />}
          label="패스하기"
          onClick={onPass}
        />

        <ActionButton
          icon={<FiUser className="text-[28px] text-[#6a73ff]" />}
          label="프로필보기"
          labelClassName="text-[#6a73ff]"
          onClick={onProfile}
        />

        <ActionButton
          icon={<FiHeart className="text-[28px] text-[#ff4338]" />}
          label="심쿵"
          labelClassName="text-[#ff4338]"
          onClick={onLike}
        />
      </div>
    </div>
  );
}