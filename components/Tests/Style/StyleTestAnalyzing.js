import React from "react";
import { motion } from "framer-motion";
import { FiHeart } from "react-icons/fi";

export default function StyleTestAnalyzing() {
  return (
    <div className="flex h-screen min-h-screen flex-col items-center justify-center bg-white px-6 text-center md:h-[760px] md:min-h-[760px]">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-pink-200/60 blur-2xl" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.25, repeat: Infinity, ease: "linear" }}
          className="relative flex h-[96px] w-[96px] items-center justify-center rounded-full border-[6px] border-pink-100 border-t-pink-500"
        >
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-pink-50 text-pink-500"
          >
            <FiHeart className="text-[20px]" />
          </motion.div>
        </motion.div>
      </div>

      <h2 className="mt-8 text-[30px] font-black tracking-[-0.04em] text-slate-900">
        성향을 분석중입니다
      </h2>

      <p className="mt-3 whitespace-pre-line text-[15px] leading-6 text-slate-500">
        답변을 바탕으로
        {"\n"}
        가장 가까운 연애유형을 정리하고 있어요.
      </p>

      <div className="mt-8 w-full max-w-[240px]">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500"
            animate={{
              x: ["-40%", "100%"],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: "45%" }}
          />
        </div>

        <div className="mt-3 text-[12px] font-semibold text-slate-400">
          결과를 생성하는 중...
        </div>
      </div>
    </div>
  );
}