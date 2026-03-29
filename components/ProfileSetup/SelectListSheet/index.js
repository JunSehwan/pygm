import React from "react";
import BottomSheet from "../BottomSheet";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function SelectListSheet({
  open,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  labelKey = "label",
  valueKey = "value",
}) {
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      <div className="space-y-1">
        {options.map((opt, idx) => {
          const label = typeof opt === "string" ? opt : opt[labelKey];
          const value = typeof opt === "string" ? opt : opt[valueKey];
          const active = selectedValue === value;

          return (
            <button
              key={`${value}-${idx}`}
              type="button"
              onClick={() => onSelect(opt)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition",
                active
                  ? "bg-blue-500 text-white"
                  : "bg-slate-50 text-slate-800 hover:bg-slate-100"
              )}
            >
              <span className="text-[15px] font-semibold">{label}</span>
              {active ? <span className="text-[14px]">✓</span> : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}