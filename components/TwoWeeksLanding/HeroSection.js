import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import MatrixRain from "./MatrixRain";
import LogoMark from "./LogoMark";
import { HERO_POLICY_NOTES, HERO_PROCESS_ITEMS, REGISTER_URL } from "./constants";
import { EASE, reveal, staggerCard, staggerContainer } from "./motionConfig";

function HeroProcessCard() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
      <LogoMark
        variant="dark"
        className="absolute -right-7 -top-7 h-28 w-28 opacity-25 md:h-36 md:w-36"
        imgClassName="scale-125"
      />

      <div className="relative">
        <h3 className="text-lg font-bold text-white md:text-xl">투윅스 진행 핵심</h3>

        <div className="mt-5 space-y-3.5 md:mt-6 md:space-y-4">
          {HERO_PROCESS_ITEMS.map((item, idx) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.12 + idx * 0.08, ease: EASE }}
              viewport={{ once: true }}
              className="flex items-center gap-3 md:gap-4"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 text-xs font-semibold text-orange-400 md:h-9 md:w-9 md:text-sm">
                0{idx + 1}
              </div>
              <div className="break-keep text-[13px] leading-6 text-zinc-200 md:text-base md:leading-7">
                {item}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, -42]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0.22]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100svh] overflow-hidden bg-black md:min-h-screen md:snap-start"
    >
      <motion.div style={{ opacity: bgOpacity }}>
        <MatrixRain />
      </motion.div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,102,0,0.20),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,102,0,0.10),transparent_28%)]" />
      <div className="absolute bottom-[-20%] left-[-10%] h-[460px] w-[460px] rounded-full border border-orange-500/10 blur-[1px]" />
      <LogoMark
        variant="dark"
        className="pointer-events-none absolute bottom-[-120px] right-[-110px] hidden h-[360px] w-[360px] opacity-[0.08] md:block"
        imgClassName="scale-125"
      />

      <MobileFrame className="relative flex min-h-[100svh] flex-col justify-center pb-12 pt-28 md:min-h-screen md:pt-32">
        <div className="grid items-center gap-8 md:gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.div style={{ y: heroTextY }} className="max-w-3xl">
            <motion.div
              {...reveal("down", 0)}
              className="mb-4 inline-flex items-center rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-orange-300 md:text-xs"
            >
              2WEEKS
            </motion.div>

            <motion.h1
              {...reveal("left", 0.06)}
              className="text-[44px] font-black leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl md:text-7xl"
            >
              2주에 한 번,
              <br />
              <span className="text-orange-500">새로운 만남</span>이
              <br />
              시작됩니다
            </motion.h1>

            <motion.p
              {...reveal("left", 0.16)}
              className="mt-6 max-w-2xl break-keep text-[15px] leading-7 text-zinc-300 md:text-lg md:leading-8"
            >
              투윅스 1기 모집 · 오프라인 만남보장, 짧은(바이트) 소개팅
              <br className="hidden md:block" />
              신원 인증 기반의 검증된 매칭, 복잡한 앱 채팅보다 실제 만남에 집중합니다.
            </motion.p>

            <motion.div {...reveal("scale", 0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={REGISTER_URL}
                className="group inline-flex items-center justify-center rounded-full bg-orange-500 px-7 py-4 text-base font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-400"
              >
                투윅스 1기에 신청하기
                <FiArrowRight className="ml-2 transition group-hover:translate-x-1" />
              </Link>

              <a
                href="#faq"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 text-base font-semibold text-white/90 transition hover:border-orange-400 hover:text-orange-300"
              >
                운영 정책 보기
              </a>
            </motion.div>
          </motion.div>

          <motion.div {...reveal("right", 0.18)} className="lg:justify-self-end">
            <HeroProcessCard />
          </motion.div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 grid gap-3 md:mt-12 md:grid-cols-3"
        >
          {HERO_POLICY_NOTES.map((text) => (
            <motion.div
              key={text}
              variants={staggerCard}
              className="rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-4 text-sm leading-6 text-zinc-200 backdrop-blur"
            >
              <span className="mr-2 text-orange-400">●</span>
              {text}
            </motion.div>
          ))}
        </motion.div>
      </MobileFrame>
    </section>
  );
}
