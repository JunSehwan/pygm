import React from "react";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiChevronRight,
  FiCheck,
  FiShare2,
  FiUserPlus,
} from "react-icons/fi";
import { TOTAL_COMPLETED_COUNT } from "./StyleTestUtils";

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
      {/* 상단 고정 */}
      <div className="border-b border-slate-200 bg-white px-5 pb-4 pt-5">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            style={{ cursor: "pointer" }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          >
            <FiArrowLeft className="text-[22px]" />
          </button>

          <div className="inline-flex items-center rounded-full bg-pink-50 px-3 py-1 text-[12px] font-bold text-pink-500">
            연애스타일 진단
          </div>
        </div>

        <h1 className="mt-4 break-keep text-[28px] font-bold leading-[1.12] text-slate-900">
          연애스타일 진단테스트
        </h1>

        <p className="mt-2 break-keep text-[13px] leading-5 text-slate-500">
          다정함, 직진성, 주도성, 현실감각까지
          <br />
          16가지 연애유형 중 하나를 알려드려요.
        </p>
      </div>

      {/* 본문만 스크롤 */}
      <div className="min-h-0 overflow-y-auto bg-white px-4 pb-4 pt-4 sm:px-5">
        <div className="space-y-4">
          <div className="rounded-[13px] bg-gradient-to-b from-slate-50 to-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
            <p className="mt-1 text-center break-keep text-[14px] leading-6 text-violet-500">
              내 태도와 행동 패턴을 분석해서 연애유형을 도출합니다.
            </p>

            <div className="relative my-6 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-[18px] shadow-[0_3px_6px_rgba(236,72,153,0.35)]"
              >
                <img
                  src="/image/tests/test_style_intro.png"
                  alt="연애스타일 진단 인트로"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </div>
          </div>

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
                가입하고 결과등록
              </button>
            ) : (
              <div className="flex h-[50px] items-center justify-center rounded-[16px] border border-emerald-200 bg-emerald-50 text-[13px] font-bold text-emerald-600">
                로그인 중
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* 시작 버튼 고정 */}
      <div className="border-t border-slate-200 bg-white px-4 pb-3 pt-3">
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