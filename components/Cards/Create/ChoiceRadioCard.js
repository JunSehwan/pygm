import React from "react";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function ChoiceRadioCard({
  active,
  title,
  desc,
  onClick,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md border text-left transition",
        compact ? "px-3 py-3" : "px-4 py-4",
        active
          ? "border-violet-300 bg-violet-50 shadow-[0_1px_6px_rgba(124,58,237,0.08)]"
          : "border-slate-200 bg-slate-100 hover:border-violet-200"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
            active ? "border-violet-300 bg-white" : "border-slate-400 bg-white"
          )}
        >
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full transition",
              active ? "bg-violet-300" : "bg-transparent"
            )}
          />
        </span>

        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-[-0.02em] text-slate-700">
            {title}
          </div>
          {desc ? (
            <div className="mt-1 text-[13px] leading-5 text-slate-500">
              {desc}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}