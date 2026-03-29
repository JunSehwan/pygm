import React from "react";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function RowField({
  label,
  value,
  placeholder,
  onClick,
  error,
  helper,
  required,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-b border-slate-200 py-4 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-700">
            {label} {required ? <span className="text-rose-500">*</span> : null}
          </p>
          <p
            className={cn(
              "mt-1 text-[15px] font-semibold",
              value ? "text-slate-900" : "text-slate-400"
            )}
          >
            {value || placeholder}
          </p>
          {helper ? (
            <p className="mt-1 text-[11px] text-slate-400">{helper}</p>
          ) : null}
          {error ? <p className="mt-1 text-[11px] text-rose-500">{error}</p> : null}
        </div>
        <span className="pt-5 text-slate-300">›</span>
      </div>
    </button>
  );
}