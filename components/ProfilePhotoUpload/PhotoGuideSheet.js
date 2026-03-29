import React, { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

export default function PhotoGuideSheet({ open, onClose, onSelectPhoto }) {
  const [frameRect, setFrameRect] = useState(null);

  const measure = () => {
    const el = document.getElementById("app-surface");
    if (!el) return null;

    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;

    return {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    };
  };

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => setFrameRect(measure());
    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof window === "undefined") return null;

  const containerStyle = frameRect
    ? {
      position: "fixed",
      left: `${frameRect.left}px`,
      top: `${frameRect.top}px`,
      width: `${frameRect.width}px`,
      height: `${frameRect.height}px`,
      zIndex: 9999,
    }
    : {
      position: "fixed",
      left: 0,
      top: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 9999,
    };

  const ui = (
    <AnimatePresence>
      {open ? (
        <motion.div
          style={containerStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute bottom-0 left-0 right-0 flex max-h-[82%] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-24px_60px_rgba(15,23,42,0.20)]"
            initial={{ y: 42, opacity: 0.98 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.24, ease: "easeOut" } }}
            exit={{ y: 42, opacity: 0.98, transition: { duration: 0.18, ease: "easeIn" } }}
          >
            <div className="shrink-0 bg-white px-4 pt-3 pb-2">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />

              <h3 className="text-[23px] font-black leading-tight text-slate-900">
                내 얼굴이 잘 보이는
                <br />
                상반신 정면 사진
              </h3>

              <p className="mt-2 whitespace-pre-line text-[13px] leading-5 text-slate-500">
                자연스럽고 선명한 사진일수록
                {"\n"}
                더 좋은 인상을 줄 수 있어요.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-[84px_1fr] items-center gap-3 rounded-[18px] bg-blue-50 p-3">
                  <div className="h-[84px] w-[84px] rounded-lg bg-slate-300 overflow-hidden">
                    <img className="h-full w-full object-cover rounded-lg overflow-hidden" src="/image/photo_upload/photo_upload_1.png" alt="photo"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-[15px] font-black text-white">
                      ✓
                    </div>
                    <p className="text-[14px] font-bold leading-5 text-slate-800">
                      얼굴이 잘 보이는 자연스러운 사진
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-[84px_1fr] items-center gap-3 rounded-[18px] bg-rose-50 p-3">
                  <div className="h-[84px] w-[84px] rounded-lg bg-slate-300 overflow-hidden">
                    <img className="h-full w-full object-cover rounded-lg overflow-hidden" src="/image/photo_upload/photo_upload_2.png" alt="photo"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-[15px] font-black text-white">
                      ✕
                    </div>
                    <p className="text-[14px] font-bold leading-5 text-slate-800">
                      흐리거나 얼굴이 많이 가려진 사진
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-[84px_1fr] items-center gap-3 rounded-[18px] bg-rose-50 p-3">
                  <div className="h-[84px] w-[84px] rounded-lg bg-slate-300 overflow-hidden">
                    <img className="h-full w-full object-cover rounded-lg overflow-hidden" src="/image/photo_upload/photo_upload_3.png" alt="photo"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-[15px] font-black text-white">
                      ✕
                    </div>
                    <p className="text-[14px] font-bold leading-5 text-slate-800">
                      얼굴이 너무 작거나 측면 위주의 사진
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="shrink-0 border-t border-slate-100 bg-white px-4 pt-3"
              style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
            >
              <button
                type="button"
                onClick={onSelectPhoto}
                className="flex h-[54px] w-full items-center justify-center rounded-[16px] bg-[#6c7cff] text-[16px] font-extrabold text-white"
              >
                사진 선택하기(여러 장 가능)
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(ui, document.body);
}