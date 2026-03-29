import React from "react";
import {
  PiPauseDuotone,
  PiPlayDuotone,
  PiSpinnerGapDuotone,
} from "react-icons/pi";

export default function ArenaReceivePauseBar({
  isPaused = false,
  saving = false,
  onToggle,
}) {
  const isReceiving = !isPaused;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20">
      <div className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-2.5 py-1.5 backdrop-blur-md shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-1">
          {isReceiving ? (
            <PiPlayDuotone className="text-[12px] text-violet-600" />
          ) : (
            <PiPauseDuotone className="text-[12px] text-slate-500" />
          )}

          <span
            className={`text-[10px] font-semibold tracking-[-0.01em] ${isReceiving ? "text-violet-700" : "text-slate-500"
              }`}
          >
            {isReceiving ? "매칭 진행중" : "매칭 일시정지"}
          </span>
        </div>

        {saving ? (
          <PiSpinnerGapDuotone className="animate-spin text-[11px] text-slate-400" />
        ) : null}

        <button
          type="button"
          role="switch"
          aria-checked={isReceiving}
          aria-label="소개 받기 토글"
          onClick={onToggle}
          disabled={saving}
          className={`relative h-[18px] w-8 shrink-0 rounded-full transition ${isReceiving ? "bg-violet-600" : "bg-slate-300"
            } disabled:opacity-60`}
          style={{ cursor: saving ? "default" : "pointer" }}
        >
          <span
            className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all ${isReceiving ? "left-[16px]" : "left-[2px]"
              }`}
          />
        </button>
      </div>
    </div>
  );
}