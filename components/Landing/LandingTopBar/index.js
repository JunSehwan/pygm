import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function LandingTopBar() {
  const barRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const node = barRef.current;
    if (!node) return undefined;

    const scrollParent = node.parentElement;
    if (!scrollParent) return undefined;

    const handleScroll = () => {
      setIsScrolled(scrollParent.scrollTop > 24);
    };

    handleScroll();
    scrollParent.addEventListener("scroll", handleScroll, { passive: true });

    return () => scrollParent.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={barRef}
      className={`sticky top-0 z-40 -mb-[64px] px-4 py-4 transition-all duration-300 ${
        isScrolled ? "bg-white/72 backdrop-blur-xl" : "bg-white/0"
      }`}
    >
      <div
        className={`flex items-center justify-end gap-2 transition-all duration-300 ${
          isScrolled ? "opacity-80 hover:opacity-100" : "opacity-100"
        }`}
      >
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 px-4 text-[14px] font-bold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] backdrop-blur-md transition hover:bg-white hover:text-slate-950"
        >
          로그인
        </Link>

        <Link
          href="/signup"
          className="inline-flex h-10 items-center justify-center rounded-full bg-[#0071e3] px-4 text-[14px] font-extrabold text-white shadow-[0_12px_24px_rgba(0,113,227,0.22)] transition hover:bg-[#0077ed]"
        >
          간단 회원가입
        </Link>
      </div>
    </div>
  );
}
