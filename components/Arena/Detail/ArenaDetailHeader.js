import React from "react";
import { PiArrowLeft } from "react-icons/pi";

export default function ArenaDetailHeader({ onBack }) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="flex h-[60px] items-center justify-between px-4">
        <div className="text-[20px] font-extrabold tracking-[-0.03em] text-zinc-900">
          매칭아레나
        </div>

        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-slate-100 "
          style={{ cursor: "pointer" }}
        >
          <PiArrowLeft className="text-[20px]" />
        </button>
      </div>
    </header>
  );
}