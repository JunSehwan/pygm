import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiArrowUpRight, FiX } from "react-icons/fi";

const PERMANENT_DISMISS_KEY =
  "charmingsoup.twoweeksLaunchPopup.v2.dismissed";
const SESSION_DISMISS_KEY =
  "charmingsoup.twoweeksLaunchPopup.v2.sessionClosed";

function safelyRead(storage, key) {
  try {
    return storage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function safelyWrite(storage, key) {
  try {
    storage.setItem(key, "true");
  } catch {
    // 저장소가 차단된 환경에서는 현재 화면에서만 닫습니다.
  }
}

export default function TwoWeeksLaunchPopup() {
  const [visible, setVisible] = useState(false);
  const closeButtonRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (
      safelyRead(window.localStorage, PERMANENT_DISMISS_KEY) ||
      safelyRead(window.sessionStorage, SESSION_DISMISS_KEY)
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => setVisible(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        safelyWrite(window.sessionStorage, SESSION_DISMISS_KEY);
        setVisible(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  const closeForSession = () => {
    safelyWrite(window.sessionStorage, SESSION_DISMISS_KEY);
    setVisible(false);
  };

  const closePermanently = () => {
    safelyWrite(window.localStorage, PERMANENT_DISMISS_KEY);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/30 p-3 backdrop-blur-[2px] md:items-center md:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForSession();
          }}
        >
          <motion.section
            role="dialog"
            aria-labelledby="twoweeks-launch-title"
            aria-describedby="twoweeks-launch-description"
            initial={
              reduceMotion ? false : { opacity: 0, y: 40, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[390px] overflow-hidden rounded-[28px] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeForSession}
              aria-label="투윅스 출시 안내 닫기"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-950"
            >
              <FiX aria-hidden="true" />
            </button>

            <div className="relative overflow-hidden border-b border-rose-100 bg-[#fff7f5] px-6 pb-8 pt-7">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-rose-200/70" />
              <div className="pointer-events-none absolute -bottom-16 -left-12 h-36 w-36 rounded-full border border-rose-200/70" />

              <div className="relative">
                <div className="inline-flex rounded-full bg-[#ff5b4d] px-3 py-1.5 text-[11px] font-black tracking-[0.14em] text-white">
                  투윅스 1기 모집중
                </div>
                <img
                  src="/logo/2weeks_logo.png"
                  alt="2WEEKS"
                  className="mt-7 h-9 w-auto object-contain"
                />
                <h2
                  id="twoweeks-launch-title"
                  className="mt-5 break-keep text-[30px] font-black leading-[1.18] tracking-[-0.055em] text-slate-950"
                >
                  차밍수프의 새로운 만남,
                  <br />
                  투윅스가 시작됐어요.
                </h2>
                <p
                  id="twoweeks-launch-description"
                  className="mt-4 break-keep text-sm font-semibold leading-7 text-slate-600"
                >
                  2주에 한 번, 한 사람을 제안하고
                  <br />
                  카페 60분의 실제 만남까지 연결합니다.
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 pt-5">
              <div className="mb-5 grid grid-cols-3 rounded-2xl bg-slate-50 px-2 py-4 text-center">
                {[
                  ["2주", "한 번"],
                  ["1명", "집중 소개"],
                  ["60분", "카페 만남"],
                ].map(([value, label]) => (
                  <div
                    key={value}
                    className="border-r border-slate-200 last:border-r-0"
                  >
                    <div className="text-lg font-black text-slate-950">
                      {value}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold text-slate-500">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/2weeks"
                onClick={closeForSession}
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-slate-950 text-base font-black text-white transition hover:bg-[#ff5b4d]"
              >
                투윅스 둘러보기
                <FiArrowUpRight className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <button
                type="button"
                onClick={closePermanently}
                className="mt-4 w-full py-1 text-center text-xs font-bold text-slate-400 underline underline-offset-4 transition hover:text-slate-700"
              >
                이 안내 다시 보지 않기
              </button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
