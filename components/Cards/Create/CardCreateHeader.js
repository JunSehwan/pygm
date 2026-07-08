import React from "react";
import { FiArrowLeft, FiUser } from "react-icons/fi";

export default function CardCreateHeader({
  title,
  onBack,
  rightLabel = "여성 회원 전용",
}) {
  return (
    // <div className="relative flex items-center justify-center px-5 pt-4">
    //   <button
    //     type="button"
    //     onClick={onBack}
    //     className="absolute left-5 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
    //   >
    //     <FiArrowLeft className="text-[22px]" />
    //   </button>

    //   <h1 className="pt-1 text-[22px] font-semibold tracking-[-0.03em] text-charming-ink">
    //     {title}
    //   </h1>

    //   {/* <div className="absolute right-5 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#f3f0ff] px-3 py-1 text-[12px] font-medium text-charming-lavender">
    //     <FiUser className="text-[12px]" />
    //     {rightLabel}
    //   </div> */}
    // </div>

    <div className="border-b border-slate-200 bg-white shadow px-4 pb-3 pt-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[20px] font-extrabold tracking-[-0.03em] text-zinc-900">
            {title}
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
        >
          <FiArrowLeft className="text-[22px]" />
        </button>

      </div>
    </div>
  );
}