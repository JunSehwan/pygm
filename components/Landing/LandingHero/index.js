import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const PROFILE_AUTO_MS = 5600;
const MEMBER_COUNT_FUNCTION_URL =
  "https://asia-northeast3-pygmalion-96c6f.cloudfunctions.net/getPublicMemberCount";

function normalizeMemberCount(value) {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? Math.floor(next) : null;
}

async function fetchPublicMemberCount() {
  const response = await fetch(MEMBER_COUNT_FUNCTION_URL, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`member count request failed: ${response.status}`);
  }

  const data = await response.json();
  return normalizeMemberCount(data?.count);
}

const profileSlides = [
  {
    id: "man",
    imageSrc: "/image/landing/profilecard_man.png",
    imageAlt: "차밍수프 남성 프로필 예시",
    label: "남성 프로필 예시",
    title: "결혼 전,\n확인해야 할 것을 보여줘요.",
    description:
      "사진과 기본정보를 넘어 생활 방식, 관계 태도, 결혼관까지 함께 확인합니다.",
  },
  {
    id: "woman",
    imageSrc: "/image/landing/profilecard_woman.png",
    imageAlt: "차밍수프 여성 프로필 예시",
    label: "여성 프로필 예시",
    title: "가볍지 않게,\n부담은 줄여요.",
    description:
      "연락처를 바로 주고받기 전, 상대의 생각과 결을 먼저 살펴볼 수 있어요.",
  },
];

function TrustChip({ children }) {
  return (
    <div className="inline-flex items-center rounded-full border border-rose-100 bg-white/82 px-3 py-1.5 text-[11px] font-semibold text-rose-600 shadow-sm backdrop-blur-md">
      <span className="break-keep">{children}</span>
    </div>
  );
}

function MemberCountBanner() {
  const [count, setCount] = useState(null);
  const [started, setStarted] = useState(false);
  const bannerRef = useRef(null);

  useEffect(() => {
    const target = bannerRef.current;
    if (!target || started) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    let cancelled = false;
    let frame = 0;

    const animateCount = (targetCount) => {
      const duration = 1150;
      const startTime = performance.now();

      const animate = (now) => {
        if (cancelled) return;

        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(targetCount * eased));

        if (progress < 1) {
          frame = requestAnimationFrame(animate);
        } else {
          setCount(targetCount);
        }
      };

      frame = requestAnimationFrame(animate);
    };

    const loadMemberCount = async () => {
      try {
        const targetCount = await fetchPublicMemberCount();

        if (cancelled) return;

        if (targetCount === null) {
          setCount(null);
          return;
        }

        animateCount(targetCount);
      } catch (error) {
        console.error("[LandingHero] member count load error:", error);
        if (!cancelled) setCount(null);
      }
    };

    loadMemberCount();

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
    };
  }, [started]);

  const countLabel =
    typeof count === "number" ? `${count.toLocaleString("ko-KR")}명 이상` : "가입자 집계 중";

  return (
    <motion.div
      ref={bannerRef}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.46, ease: "easeOut" }}
      className="relative mt-4 overflow-hidden rounded-[18px] border border-violet-100 bg-gradient-to-br from-white via-violet-50/70 to-rose-50/60 px-4 py-4 shadow-[0_16px_34px_rgba(124,58,237,0.12)]"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-violet-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-rose-300/20 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-rose-500 text-white shadow-[0_14px_26px_rgba(124,58,237,0.25)]">
          <div className="text-center leading-none">
            <p className="text-[18px] font-black">♡</p>
            <p className="mt-1 text-[10px] font-extrabold opacity-85">MATCH</p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="break-keep text-[20px] font-black leading-[1.34] tracking-[-0.04em] text-slate-950">
            <span className="text-violet-600">{countLabel}</span>의
            <br />
            진정성 있는 회원분들이
          </p>

          <p className="mt-0.5 break-keep text-[14px] font-semibold leading-[1.55] text-slate-600">
            신중한 만남을 준비하고 있어요.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-extrabold text-violet-600 shadow-sm">
              프로필 승인제
            </span>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-extrabold text-rose-500 shadow-sm">
              3040 진지한 만남
            </span>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-extrabold text-slate-500 shadow-sm">
              수도권 중심
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentProfile = useMemo(
    () => profileSlides[currentIndex],
    [currentIndex]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % profileSlides.length);
    }, PROFILE_AUTO_MS);

    return () => window.clearInterval(timer);
  }, []);

  const goTo = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative z-10 mt-4 px-1">
      <div className="overflow-hidden rounded-[28px] border py-2">
        <div className="relative h-[525px] overflow-hidden rounded-[23px] bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, x: 34, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -34, scale: 0.985 }}
              transition={{
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0"
            >
              <Image
                src={currentProfile.imageSrc}
                alt={currentProfile.imageAlt}
                fill
                priority={currentProfile.id === "man"}
                sizes="390px"
                className="object-cover object-top"
              />
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/20 via-white/8 to-transparent" />

          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentProfile.id}-text`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.38 }}
              className="absolute bottom-3 left-3 right-3"
            >
              {/* 이미지 자체가 프로필 예시 역할을 해서 오버레이 텍스트는 숨김 유지 */}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-4 pt-[74px]">
      <div className="pointer-events-none absolute -right-20 top-10 h-56 w-56 rounded-full bg-rose-100/80 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-52 h-64 w-64 rounded-full bg-violet-100/90 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-[230px] z-0 h-[260px] bg-gradient-to-b from-transparent via-white/50 to-transparent" />

      <div className="relative z-10 px-1">
        {/* 필요 시 다시 노출 가능 */}
        {/* <div className="flex flex-wrap gap-1.5">
          <TrustChip>3040 진지한 만남</TrustChip>
          <TrustChip>연락처 바로 공개 없음</TrustChip>
          <TrustChip>프로필 승인제</TrustChip>
        </div> */}

        <div className="mt-6">
          {/* <div className="inline-flex items-center rounded-full border border-rose-100 bg-white/82 px-3 py-1.5 text-[11px] font-bold text-rose-500 shadow-sm backdrop-blur-md">
            3040 이성소개
          </div> */}

          <h1 className="mt-4 break-keep text-[29px] font-bold leading-[1.13] text-slate-950">
            <span className="block text-slate-950">
              생각의 결까지 맞춰보는
            </span>

            <span className="mt-1 block bg-gradient-to-r from-violet-600 via-rose-500 to-violet-600 bg-clip-text leading-[1.04] text-transparent">
              3040 가장 핫한
            </span>

            <span className="mt-1 block text-slate-950">
              차밍수프 매칭시스템
            </span>
          </h1>

          <p className="mt-2 break-keep text-[15px] font-medium leading-[1.6] text-slate-600">
            만남 전 진짜 궁금한 생활 방식, 대화 태도, 관계관을 차밍카드로 먼저 확인하세요.
          </p>

          <MemberCountBanner />
        </div>
      </div>

      <ProfileShowcase />

      <div className="relative z-10 mt-5 px-1">
        <Link
          href="/signup"
          className="group flex h-[44px] items-center justify-center gap-2 rounded-full bg-violet-600 text-[15px] font-extrabold text-white shadow-[0_16px_32px_rgba(124,58,237,0.24)] transition hover:bg-violet-700"
        >
          빠르게 매칭시작
          <span className="transition group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </section>
  );
}
