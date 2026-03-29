import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { PiLockKeyDuotone } from "react-icons/pi";

export default function AuthRequiredModal({
  open,
  onClose,
  redirect = "/",
  title = "로그인이 필요해요",
  description = "이 기능은 로그인 후 이용할 수 있어요.",
}) {
  const router = useRouter();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[190] flex items-center justify-center bg-black/45 px-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[340px] overflow-hidden rounded-[22px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 pb-5 pt-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
              <PiLockKeyDuotone className="text-[24px] text-violet-600" />
            </div>

            <div className="break-keep text-[22px] font-bold tracking-[-0.02em] text-zinc-900">
              {title}
            </div>

            <p className="mt-3 break-keep text-[15px] leading-6 text-zinc-500">
              {description}
            </p>
          </div>

          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={() =>
                router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
              }
              className="flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[16px] font-bold text-white shadow-sm"
            >
              로그인
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(`/signup?redirect=${encodeURIComponent(redirect)}`)
              }
              className="mt-3 flex h-12 w-full items-center justify-center rounded-md border border-zinc-200 bg-white text-[15px] font-semibold text-zinc-700"
            >
              회원가입
            </button>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 flex w-full items-center justify-center text-[14px] font-medium text-zinc-400"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}