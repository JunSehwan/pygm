import React, { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

export default function BottomSheet({ open, title, children, onClose }) {
  const [frameRect, setFrameRect] = useState(null);

  // ✅ 프레임(app-surface)의 위치/크기 측정
  const measure = () => {
    const el = document.getElementById("app-surface");
    if (!el) return null;
    const r = el.getBoundingClientRect();

    // 가끔 0폭/0높이로 잡히는 순간이 있어 방어
    if (!r.width || !r.height) return null;

    return {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    };
  };

  // ✅ 열릴 때마다 재측정 + 리사이즈/스크롤 시 보정
  useLayoutEffect(() => {
    if (!open) return;

    const update = () => setFrameRect(measure());
    update();

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true); // true: 내부 스크롤도 반영

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // ✅ 열려있을 때 body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof window === "undefined") return null;
  if (!open) return null;

  // 프레임이 안 잡히면(예: id 없거나 순간 측정 실패) -> 전체화면 fallback
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
          {/* ✅ backdrop: 프레임 영역만 덮음 */}
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/40"
          />

          {/* ✅ sheet: 프레임 바닥에서 올라오게 */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="
              absolute bottom-0 left-0 right-0
              rounded-t-[24px] bg-white
              shadow-[0_-24px_60px_rgba(15,23,42,0.20)]
              overflow-hidden
            "
            initial={{ y: 44, opacity: 0.98 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.22, ease: "easeOut" } }}
            exit={{ y: 44, opacity: 0.98, transition: { duration: 0.18, ease: "easeIn" } }}
          >
            {/* header */}
            <div className="sticky top-0 z-10 bg-white">
              <div className="px-4 pt-3 pb-2">
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
                <div className="flex items-center justify-between">
                  <h3 className="text-[18px] font-black text-slate-900">{title}</h3>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-2 py-1 text-[13px] font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    닫기
                  </button>
                </div>
              </div>
              <div className="h-px w-full bg-slate-100" />
            </div>

            {/* content scroll: 프레임 내부에서만 스크롤 */}
            <div
              className="px-4 pt-3 pb-4 overflow-y-auto"
              style={{
                // 프레임 높이를 기준으로 안전하게 (프레임의 70% 정도)
                maxHeight: frameRect ? `${Math.floor(frameRect.height * 0.72)}px` : "70vh",
                WebkitOverflowScrolling: "touch",
                paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  // ✅ body에 렌더하지만, 위치는 frameRect로 프레임 안에 고정
  return createPortal(ui, document.body);
}