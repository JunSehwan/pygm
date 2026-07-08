import { motion } from "framer-motion";
import MobileFrame from "./MobileFrame";
import SectionTitle from "./SectionTitle";
import LogoMark from "./LogoMark";
import { AUDIENCE_CARDS, FEATURE_CARDS } from "./constants";
import { reveal } from "./motionConfig";

export default function AudienceSection() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-white md:min-h-screen md:snap-start">
      <LogoMark
        variant="light"
        className="pointer-events-none absolute -right-16 top-16 hidden h-56 w-56 opacity-[0.06] md:block"
        imgClassName="scale-110"
      />

      <MobileFrame className="relative flex min-h-[100svh] flex-col justify-center py-16 md:min-h-screen md:py-20">
        <motion.div {...reveal("up")}>
          <SectionTitle
            eyebrow="overview"
            title="투윅스 1기 모집"
            desc="연령대와 활동 지역이 맞는 이성을 우선 소개하고, 첫 만남은 카페 1시간 바이트미팅으로 가볍게 시작합니다."
          />
        </motion.div>

        <div className="mt-8 grid grid-cols-2 gap-2.5 md:mt-12 md:grid-cols-3 md:gap-4 xl:grid-cols-6">
          {AUDIENCE_CARDS.map((card, idx) => (
            <motion.div
              key={card.title}
              {...reveal(idx % 2 === 0 ? "left" : "right", idx * 0.03)}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.22 } }}
              className="rounded-[20px] border border-zinc-200 bg-white p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition md:rounded-[28px] md:p-6"
            >
              <div className="text-[22px] text-zinc-900 md:text-2xl">{card.icon}</div>
              <div className="mt-3 text-[11px] font-semibold text-zinc-500 md:mt-5 md:text-sm">
                {card.title}
              </div>
              <div className="mt-1.5 whitespace-pre-line break-keep text-[13px] font-bold leading-5 tracking-[-0.025em] text-zinc-950 md:mt-2 md:text-base md:leading-7">
                {card.desc}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-7 grid gap-3 md:mt-10 md:grid-cols-3 md:gap-4">
          {FEATURE_CARDS.map((card, idx) => (
            <motion.div
              key={card.title}
              {...reveal(idx === 0 ? "left" : idx === 2 ? "right" : "up", idx * 0.08)}
              whileHover={{ y: -6, transition: { duration: 0.22 } }}
              className="rounded-[24px] border border-zinc-200 bg-[#faf8f6] p-5 transition md:rounded-[28px] md:p-7"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-xl text-orange-500 md:h-12 md:w-12">
                {card.icon}
              </div>
              <div className="mt-4 whitespace-pre-line break-keep text-lg font-bold leading-tight tracking-[-0.035em] text-zinc-950 md:mt-5 md:text-2xl">
                {card.title}
              </div>
              <div className="mt-2.5 whitespace-pre-line break-keep text-[13px] leading-6 text-zinc-500 md:mt-3 md:text-base md:leading-7">
                {card.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </MobileFrame>
    </section>
  );
}
