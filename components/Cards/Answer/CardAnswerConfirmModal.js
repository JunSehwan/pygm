import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function CardAnswerConfirmModal({
  open,
  title,
  desc,
  cancelText = "취소",
  confirmText = "확인",
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="w-full max-w-[340px]">
            <motion.div
              className="overflow-hidden rounded-2xl bg-white shadow-2xl"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="px-5 py-6">
                <h3 className="text-[18px] font-bold leading-tight text-slate-900">
                  {title}
                </h3>

                <p className="mt-4 whitespace-pre-line text-[14px] leading-6 text-slate-600">
                  {desc}
                </p>
              </div>

              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={onConfirm}
                  className="h-12 w-full rounded-md bg-[#ff4338] text-[16px] font-bold text-white"
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>

            <motion.button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full bg-transparent text-center text-[16px] font-medium text-white/95"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: "easeOut", delay: 0.03 }}
            >
              {cancelText}
            </motion.button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}