import { motion } from "framer-motion";
import MobileFrame from "./MobileFrame";
import SectionTitle from "./SectionTitle";
import { POLICY_CARDS } from "./constants";
import { reveal } from "./motionConfig";

export default function PolicySection() {
  return (
    <section className="min-h-[100svh] bg-[#fafafa] md:min-h-screen md:snap-start">
      <MobileFrame className="flex min-h-[100svh] flex-col justify-center py-16 md:min-h-screen md:py-20">
        <motion.div {...reveal("up")}>
          <SectionTitle
            eyebrow="policy"
            title="투윅스 운영 정책"
            desc="예치금, 사진 공개, 재매칭, 연락처 공개 기준까지 핵심 운영 정책을 투명하게 안내합니다."
          />
        </motion.div>

        <div className="mx-auto mt-8 grid w-full max-w-[390px] gap-3 sm:max-w-[520px] sm:grid-cols-2 md:mt-12 md:max-w-none xl:grid-cols-3">
          {POLICY_CARDS.map((card, idx) => (
            <motion.div
              key={card.title}
              {...reveal(idx % 2 === 0 ? "left" : "right", idx * 0.04)}
              whileHover={{ y: -5, transition: { duration: 0.22 } }}
              className="rounded-[22px] border border-zinc-200 bg-white p-5 transition md:rounded-[28px] md:p-6"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-xl text-orange-500 md:h-12 md:w-12">
                {card.icon}
              </div>
              <div className="mt-4 text-lg font-bold tracking-[-0.03em] text-zinc-950 md:mt-5 md:text-xl">
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
