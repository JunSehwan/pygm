import React from "react";
import Link from "next/link";

export default function LandingTopBar() {
  return (
    <div className="sticky top-0 z-40 -mb-[64px] px-4 py-3">
      <div className="flex items-center justify-end gap-2 bg-transparent">
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-full border border-white/70 px-4 text-[13px] font-bold text-white bg-[#697DE8] transition hover:bg-[#5369e4]"
        >
          로그인
        </Link>

        <Link
          href="/signup"
          className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-[13px] font-bold text-[#697DE8] transition hover:opacity-95"
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}