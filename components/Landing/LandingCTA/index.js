import React from "react";
import Link from "next/link";

export default function LandingCTA() {
  return (
    <section className="bg-[#B4D8E9] px-4 pb-8 pt-2">
      <div className="rounded-[28px] bg-white px-5 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <h3 className="text-[22px] font-extrabold leading-[1.24] tracking-[-0.03em] text-slate-950">
          이제,
          <br />
          잘 통하는 사람을 만나볼 차례예요
        </h3>

        <p className="mt-3 text-[14px] leading-[1.55] text-slate-600">
          차밍수프는 연애 상황 속 선택과 반응을 통해
          더 잘 맞는 이성을 연결합니다.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2">
          <Link
            href="/signup"
            className="flex h-12 items-center justify-center rounded-xl bg-[#697DE8] text-[15px] font-extrabold text-white transition hover:opacity-95"
          >
            회원가입하고 시작하기
          </Link>

          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[15px] font-extrabold text-slate-900 transition hover:bg-slate-50"
          >
            로그인
          </Link>
        </div>
      </div>
    </section>
  );
}