import React from "react";
import { motion } from "framer-motion";

export default function AnswererProfileStrip({
  show,
  profileImage,
  nickname,
  subtitle,
}) {
  return (
    <motion.div
      className="shrink-0 border-b border-slate-200 bg-white shadow"
      style={{ pointerEvents: show ? "auto" : "none" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <img
          src={profileImage}
          alt="프로필"
          className="h-12 w-12 rounded-full object-cover"
        />

        <div className="min-w-0">
          <div className="text-[18px] font-semibold text-slate-800">
            {nickname}
          </div>
          <div className="mt-1 text-[14px] text-slate-500">
            {subtitle || "기본 정보"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}