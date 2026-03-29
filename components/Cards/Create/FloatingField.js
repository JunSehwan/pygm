import React, { useState } from "react";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function FloatingField({
  label,
  value,
  onChange,
  maxLength,
  multiline = false,
  rows = 1,
  error,
  inputRef,
  required = false,
}) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || !!value;

  return (
    <div>
      <div
        className={cn(
          "relative rounded-md border bg-white shadow-[0_1px_6px_rgba(15,23,42,0.04)] transition",
          error
            ? "border-red-400"
            : focused
              ? "border-violet-300"
              : "border-slate-200"
        )}
      >
        <label
          className={cn(
            "pointer-events-none absolute left-4 transition-all duration-200",
            isActive
              ? "top-3 text-[12px] font-medium text-slate-500"
              : "top-1/2 -translate-y-1/2 text-[16px] font-medium text-slate-400"
          )}
        >
          {label}
          {required ? "" : ""}
        </label>

        {multiline ? (
          <textarea
            ref={inputRef}
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            rows={rows}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              "w-full resize-none appearance-none border-0 rounded-md bg-transparent px-4 pb-4 text-[16px] leading-6 text-slate-700 outline-none ring-0 shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none",
              isActive ? "pt-8" : "pt-6"
            )}
            style={{
              boxShadow: "none",
              outline: "none",
              border: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
            }}
          />
        ) : (
            <input
              ref={inputRef}
              value={value}
              onChange={onChange}
              maxLength={maxLength}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={cn(
                "h-[60px] w-full appearance-none border-0 rounded-md bg-transparent px-4 text-[16px] text-slate-700 outline-none ring-0 shadow-none focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none",
                isActive ? "pb-2 pt-5" : "pb-0 pt-0"
              )}
              style={{
                boxShadow: "none",
                outline: "none",
                border: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
              }}
            />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="min-h-[20px] text-[13px] leading-5 text-red-500">
          {error || ""}
        </div>
        <div className="shrink-0 text-[12px] font-medium text-slate-400">
          {value.length}/{maxLength}자
        </div>
      </div>
    </div>
  );
}