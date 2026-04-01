import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { FiLock } from "react-icons/fi";
import { PiSparkleFill, PiUserCirclePlusDuotone } from "react-icons/pi";

export default function LoginRequiredGateModal({ open }) {
  const router = useRouter();

  const handleGoLogin = () => {
    router.push("/login");
  };

  const handleGoSignup = () => {
    router.push("/signup");
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[8px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[368px] overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="bg-gradient-to-b from-violet-50 via-white to-white px-5 pb-4 pt-5">
              <div className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                <PiSparkleFill className="text-[10px]" />
                로그인 필요
              </div>

              <div className="mt-3 text-[22px] font-black tracking-[-0.03em] text-slate-900">
                먼저 시작해볼까요?
              </div>

              <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-slate-500">
                이 화면은 로그인 후 이용할 수 있어요.
                {"\n"}
                로그인하거나 회원가입 후
                {"\n"}
                바로 이어서 이용할 수 있어요.
              </p>
            </div>

            <div className="px-5 pb-6 pt-2">
              <div className="mb-5 flex items-center justify-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <FiLock className="text-[26px]" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-violet-100">
                    <PiUserCirclePlusDuotone className="text-[16px] text-violet-500" />
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoLogin}
                  className="h-12 w-full rounded-md bg-violet-600 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] transition hover:bg-violet-700 active:scale-[0.99]"
                  style={{ cursor: "pointer" }}
                >
                  로그인하기
                </button>

                <button
                  type="button"
                  onClick={handleGoSignup}
                  className="h-12 w-full rounded-md border border-violet-200 bg-violet-50 text-[15px] font-bold text-violet-700 transition hover:bg-violet-100 active:scale-[0.99]"
                  style={{ cursor: "pointer" }}
                >
                  회원가입하기
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}