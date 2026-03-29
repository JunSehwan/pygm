import React from "react";
import { PiHeartDuotone, PiPhoneDuotone, PiXBold } from "react-icons/pi";

export default function MaleDetailActionBar({ onReject, onAccept }) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onReject}
          className="flex h-[54px] items-center justify-center gap-2 rounded-md bg-zinc-700 text-[15px] font-bold text-white"
          style={{ cursor: "pointer" }}
        >
          <PiXBold className="text-[20px]" />
          거절하기
        </button>

        <button
          type="button"
          onClick={onAccept}
          className="flex h-[54px] items-center justify-center gap-2 rounded-md bg-violet-600 text-[15px] font-bold text-white"
          style={{ cursor: "pointer" }}
        >
          <PiHeartDuotone className="text-[20px]" />
          승낙하기
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-slate-500">
        <PiPhoneDuotone className="text-[15px]" />
        승낙 시 양쪽 연락처가 공유돼요
      </div>
    </div>
  );
}