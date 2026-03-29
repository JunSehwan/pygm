import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PiX } from "react-icons/pi";

export default function ArenaConfirmModal({
  open,
  onClose,
  icon,
  title,
  description,
  confirmText = "확인",
  cancelText = "",
  confirmClassName = "bg-violet-500 text-white",
  onConfirm,
  singleButton = false,
}) {
  const Icon = icon;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="absolute inset-0 z-[120] flex items-center justify-center bg-black/34 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[340px] overflow-hidden rounded-md bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-center justify-between border-solid border-b border-slate-200 px-5 py-4">
              <div className="text-[17px] font-extrabold tracking-[-0.03em] text-zinc-900">
                {title}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400"
                style={{ cursor: "pointer" }}
              >
                <PiX className="text-[20px]" />
              </button>
            </div>

            <div className="px-6 py-6 text-center">
              {Icon ? (
                <div className="mb-4 flex justify-center">
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-50">
                    <Icon className="text-[40px] text-rose-500" />
                  </div>
                </div>
              ) : null}

              <div className="whitespace-pre-line break-keep text-[14px] font-medium leading-5 text-zinc-900">
                {description}
              </div>
            </div>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={onConfirm}
                className={`flex h-[48px] w-full items-center justify-center rounded-md text-[16px] font-bold ${confirmClassName}`}
                style={{ cursor: "pointer" }}
              >
                {confirmText}
              </button>

              {!singleButton && cancelText ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-1 flex h-[48px] w-full items-center justify-center bg-white hover:bg-slate-100 text-[14px] font-semibold text-slate-500"
                  style={{ cursor: "pointer" }}
                >
                  {cancelText}
                </button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}