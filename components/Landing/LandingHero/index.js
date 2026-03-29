import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingHero() {
  return (
    <section className="relative">
      {/* top tint background */}
      <div className="bg-gradient-to-b from-rose-100 via-[#eef8ff] to-white px-4 pt-4 pb-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            <span className="text-rose-500">C</span>harming&nbsp;<span className="text-rose-500">G</span>round
          </span>
          {/* <span className="text-[11px] font-medium text-slate-500">
            차밍그라운드
          </span> */}
        </div>

        <h1 className="text-3xl sm:text-2xl font-black leading-[1.12] text-slate-900">
          능력과 인성까지
          <br />
          <span className="text-rose-500">검증된 이성</span>매칭
        </h1>

        <p className="mt-2 text-[12px] leading-[1.45] text-slate-600">
          불편한 대화와 애매한 약속을 줄이기 위해,
          <br />
          매너 데이터를 먼저 확인합니다.
        </p>

      </div>

      {/* separator line to visually connect sections */}
      <div className="h-px bg-slate-100" />
    </section>
  );
}