import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCoffee,
  FiMapPin,
} from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import { trackTwoWeeksEvent } from "lib/gtag";
import {
  GUIDE_URL,
  HERO_METRICS,
  RECRUITMENT_CONFIG,
  REGISTER_URL,
} from "./constants";

function CafeMeetingScene() {
  return (
    <div
      className="relative mx-auto aspect-[4/3] w-full max-w-[620px] overflow-hidden rounded-[32px] border border-slate-200 bg-[#f6f2eb] shadow-[0_34px_90px_rgba(39,48,58,0.16)] md:rounded-[44px]"
      aria-label="밝은 카페에서 한 사람과 60분 동안 대화하는 투윅스 만남 장면"
    >
      <Image
        src="/image/twoweeks/landing/hero-daylight.webp"
        alt="햇살이 들어오는 카페에서 마주 앉아 대화하는 두 사람"
        fill
        priority
        sizes="(max-width: 1023px) 100vw, 50vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-slate-950/5" />

      <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between gap-3 sm:inset-x-6 sm:top-6">
        <span className="rounded-full border border-white/60 bg-white/90 px-3 py-2 text-[11px] font-black text-slate-800 shadow-lg backdrop-blur-md sm:px-4 sm:text-xs">
          2주에 한 번 · 한 사람
        </span>
        <span className="flex items-center gap-2 rounded-full border border-white/40 bg-slate-950/[0.65] px-3 py-2 text-[11px] font-black text-white shadow-lg backdrop-blur-md sm:px-4 sm:text-xs">
          <FiBell aria-hidden="true" /> 새로운 소개 도착
        </span>
      </div>

      <div className="absolute inset-x-4 bottom-4 z-10 rounded-[24px] border border-white/40 bg-white/[0.92] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:rounded-[28px] sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-black text-[#d85b48] sm:text-xs">마음에 들 때만 선택</div>
            <div className="mt-1 break-keep text-xl font-black tracking-[-0.045em] text-slate-950 sm:text-2xl">
              한 사람과 카페에서 약 60분
            </div>
          </div>
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d85b48] text-xl text-white sm:flex">
            <FiCoffee aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-black text-slate-700 sm:text-xs">
          <span className="flex items-center gap-2 rounded-xl bg-slate-100/90 px-3 py-2.5">
            <FiCalendar className="text-[#d85b48]" aria-hidden="true" /> 일정 선택
          </span>
          <span className="flex items-center gap-2 rounded-xl bg-slate-100/90 px-3 py-2.5">
            <FiMapPin className="text-[#d85b48]" aria-hidden="true" /> 카페 선택
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-slate-100 bg-white pb-14 pt-[104px] text-slate-950 md:pb-24 md:pt-[132px]">
      <MobileFrame>
        <div className="grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {RECRUITMENT_CONFIG.enabled ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#d85b48] motion-reduce:animate-none" />
                {RECRUITMENT_CONFIG.cohortLabel} {RECRUITMENT_CONFIG.statusLabel}
                <span className="text-slate-300">·</span>
                {RECRUITMENT_CONFIG.deadlineLabel}
              </div>
            ) : null}

            <h1 className="mt-6 max-w-3xl break-keep text-[42px] font-black leading-[1.08] tracking-[-0.065em] sm:text-5xl md:text-[64px] lg:text-[70px]">
              반복되는 일상에,
              <br />
              <span className="text-[#d85b48]">2주에 한 번 작은 설렘.</span>
            </h1>

            <p className="mt-6 max-w-xl break-keep text-md font-medium leading-6 text-slate-600 md:text-md md:leading-7">
              연애할 때까지 지속적으로 만남을 제안해드립니다.<br/>
              상대방의 프로필을 확인하고 만남을 결정하세요. <br/>
              일정과 장소를 조율해 60분간 편하게 만나보세요.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
              {HERO_METRICS.map((item) => (
                <div
                  key={item.value}
                  className="rounded-2xl border shadow border-slate-200 bg-white px-2 py-4 text-center sm:px-4"
                >
                  <div className="break-keep text-[13px] font-black tracking-[-0.035em] text-slate-950 sm:text-base">
                    {item.value}
                  </div>
                  <div className="mt-1 hidden break-keep text-[11px] font-semibold leading-5 text-slate-500 sm:block">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={REGISTER_URL}
                onClick={() =>
                  trackTwoWeeksEvent("twoweeks_cta_click", {
                    location: "hero",
                    destination: "register",
                  })
                }
                className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-8 text-base font-black text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-[#d85b48] sm:w-auto"
              >
                투윅스 시작하기
                <FiArrowRight className="transition group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href={GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackTwoWeeksEvent("twoweeks_guide_open", {
                    location: "hero",
                    destination: "guide",
                  })
                }
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 text-base font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-950 sm:w-auto"
              >
                <FiBookOpen aria-hidden="true" />
                상세 이용안내
              </Link>
            </div>

            <div className="mt-6 max-w-2xl" aria-label="현재 모집 대상">
              <p className="text-xs font-black tracking-[-0.02em] text-slate-500">
                현재 모집 대상
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#fdf0ed] px-3.5 py-2 text-[11px] font-black text-[#b74636] sm:text-xs">
                  남성 · 1987~1999년생 중심
                </span>
                <span className="rounded-full bg-[#eef4fb] px-3.5 py-2 text-[11px] font-black text-[#385f82] sm:text-xs">
                  여성 · 연령 제한 없이 신청 가능
                </span>
              </div>
              <div className="mt-2 inline-flex max-w-full items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[11px] font-bold leading-5 text-slate-600 sm:text-xs">
                <FiMapPin className="mt-0.5 shrink-0 text-[#d85b48]" aria-hidden="true" />
                <span className="break-keep">
                  서울 남부 · 강남구/서초구/동작구/관악구/영등포구 활동지역 모집
                  <span className="ml-1.5 whitespace-nowrap text-slate-400">(추후 지역 확대 예정)</span>
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <CafeMeetingScene />
          </motion.div>
        </div>
      </MobileFrame>
    </section>
  );
}
