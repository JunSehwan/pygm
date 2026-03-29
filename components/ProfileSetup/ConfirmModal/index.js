import React from "react";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function ConfirmModal({
  open,
  title,
  desc,
  cancelText,
  confirmText,
  onCancel,
  onConfirm,
  confirmClassName,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-5 py-5">
          <h3 className="whitespace-pre-line text-[20px] font-black leading-tight text-slate-900">
            {title}
          </h3>
          {desc ? (
            <p className="mt-4 whitespace-pre-line text-[13px] leading-5 text-slate-600">
              {desc}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 bg-slate-400 text-[16px] font-bold text-white"
          >
            {cancelText || "취소"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "h-12 text-[16px] font-bold text-white",
              confirmClassName || "bg-[#ff4338]"
            )}
          >
            {confirmText || "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}