import React from "react";
import Link from "next/link";

export default function LandingCTA() {
  return (
    <section className="px-4 pb-6">
      <div className="border-t border-slate-100 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[14px] font-bold text-slate-900 transition hover:bg-slate-50 active:translate-y-[1px]"
          >
            로그인
          </Link>

          <Link
            href="/signup"
            className="flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(244,63,94,0.22)] transition hover:opacity-95 active:translate-y-[1px]"
          >
            빠르게 시작하기
          </Link>
        </div>
      </div>
    </section>
  );
}