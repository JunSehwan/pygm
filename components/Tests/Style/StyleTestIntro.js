import React from "react";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiChevronRight,
  FiCheck,
  FiShare2,
  FiUserPlus,
  FiHeart,
  FiTarget,
  FiStar,
} from "react-icons/fi";
import { TOTAL_COMPLETED_COUNT } from "./StyleTestUtils";

function FloatingChip({ icon, label, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[12px] font-bold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur",
        className,
      ].join(" ")}
    >
      <span className="text-[13px] text-violet-500">{icon}</span>
      {label}
    </motion.div>
  );
}

function MiniInfoCard({ icon, title, desc, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-500">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-slate-900">{title}</div>
          <div className="mt-1 break-keep text-[12px] leading-5 text-slate-500">
            {desc}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function StyleTestIntro({
  totalQuestions,
  onStart,
  onBack,
  onShare,
  onSignup,
  isLoggedIn,
  totalAttempts,
}) {
  const completedCount = (
    totalAttempts || TOTAL_COMPLETED_COUNT
  ).toLocaleString();

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 pb-4 pt-5">
        <div className="flex w-full items-center justify-between">
          <div className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-[12px] font-bold text-pink-500">
            연애스타일 진단
          </div>

          <button
            type="button"
            onClick={onBack}
            style={{ cursor: "pointer" }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          >
            <FiArrowLeft className="text-[22px]" />
          </button>
        </div>

        <h1 className="mt-2 break-keep text-[24px] font-bold leading-[1.12] text-slate-900">
          연애스타일 진단테스트
        </h1>

        <p className="mt-2 break-keep text-[13px] leading-5 text-slate-500">
          다정함, 직진성, 주도성, 현실감각까지
          <br />
          16가지 연애유형 중 하나를 알려드려요.
        </p>
      </div>

      <div className="min-h-0 overflow-y-auto overscroll-contain bg-white px-4 pb-4 pt-4 sm:px-5">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-[18px] border border-pink-100 bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.14),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#fff7fb_100%)] p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.14, 0.22, 0.14] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-[46%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-200 blur-3xl"
            />

            <motion.div
              animate={{ rotate: [0, 8, 0, -8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[-10px] top-[-6px] text-pink-300/60"
            >
              <FiStar className="text-[74px]" />
            </motion.div>

            {/* <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-4 top-4"
            >
              <FloatingChip
                icon={<FiHeart />}
                label="다정함"
                delay={0.08}
              />
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
              }}
              className="absolute right-4 top-[58px]"
            >
              <FloatingChip
                icon={<FiTarget />}
                label="직진성"
                className="text-pink-600"
                delay={0.15}
              />
            </motion.div>

            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 3.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.7,
              }}
              className="absolute left-5 bottom-5"
            >
              <FloatingChip
                icon={<FiStar />}
                label="현실감각"
                className="text-violet-600"
                delay={0.22}
              />
            </motion.div> */}

            <p className="relative z-[2] mt-1 text-center break-keep text-[14px] leading-6 text-violet-500">
              내 태도와 행동 패턴을 분석해서 연애유형을 도출합니다.
            </p>

            <div className="relative my-6 flex items-center justify-center">
              <motion.div
                animate={{
                  y: [0, -8, 0],
                  scale: [1, 1.04, 1],
                  rotate: [0, 1.5, 0, -1.5, 0],
                }}
                transition={{
                  duration: 5.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative flex h-[176px] w-[176px] items-center justify-center overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_14px_34px_rgba(236,72,153,0.16)]"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.28, 0.18] }}
                  transition={{
                    duration: 4.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-[radial-gradient(circle,_rgba(244,114,182,0.18)_0%,_transparent_62%)]"
                />

                <img
                  src="/image/tests/test_style_intro.png"
                  alt="연애스타일 진단 인트로"
                  className="relative z-[2] h-full w-full object-cover"
                />
              </motion.div>
            </div>

            {/* <div className="grid grid-cols-1 gap-3">
              <MiniInfoCard
                icon={<FiHeart className="text-[17px]" />}
                title="내 연애 분위기 파악"
                desc="나는 다정한 편인지, 무심한 편인지부터 관계의 온도를 확인해요."
                delay={0.08}
              />

              <MiniInfoCard
                icon={<FiTarget className="text-[17px]" />}
                title="표현 방식 · 리드 성향 분석"
                desc="직진성, 주도성, 현실감각을 함께 봐서 더 입체적으로 결과를 알려드려요."
                delay={0.16}
              />
            </div> */}
          </motion.div>

          <div className="flex items-start gap-3 rounded-[13px] border border-blue-100 bg-blue-50/70 px-4 py-4">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
              <FiCheck className="text-[12px]" />
            </div>

            <div className="break-keep text-[14px] font-semibold leading-6 text-blue-600">
              총 {totalQuestions}문항 · 약 3~5분 소요
              <br />
              현재 {completedCount}명이 테스트에 참여했어요.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onShare}
              style={{ cursor: "pointer" }}
              className="flex h-[50px] items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white text-[14px] font-bold text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition hover:border-pink-200"
            >
              <FiShare2 className="text-[16px]" />
              테스트 공유
            </button>

            {!isLoggedIn ? (
              <button
                type="button"
                onClick={onSignup}
                style={{ cursor: "pointer" }}
                className="flex h-[50px] items-center justify-center gap-2 rounded-[16px] border border-pink-200 bg-pink-50 text-[14px] font-bold text-pink-600 shadow-[0_8px_18px_rgba(236,72,153,0.08)] transition hover:bg-pink-100"
              >
                <FiUserPlus className="text-[16px]" />
                회원가입
              </button>
            ) : (
              <div className="flex h-[50px] items-center justify-center rounded-[16px] border border-emerald-200 bg-emerald-50 text-[13px] font-bold text-emerald-600">
                로그인 중
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onStart}
          style={{ cursor: "pointer" }}
          className="flex h-[54px] w-full items-center justify-center rounded-lg bg-violet-500 text-[16px] font-black text-white transition hover:bg-violet-600"
        >
          테스트 바로시작
          <FiChevronRight className="ml-1 text-[16px]" />
        </button>
      </div>
    </div>
  );
}