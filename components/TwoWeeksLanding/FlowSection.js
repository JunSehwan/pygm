import { motion } from "framer-motion";
import MobileFrame from "./MobileFrame";
import SectionTitle from "./SectionTitle";
import { FLOW_STEPS } from "./constants";
import { reveal } from "./motionConfig";

export default function FlowSection() {
  return (
    <section className="min-h-[100svh] bg-black md:min-h-screen md:snap-start">
      <MobileFrame className="flex min-h-[100svh] flex-col justify-center py-16 md:min-h-screen md:py-20">
        <div className="grid gap-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <motion.div {...reveal("left")}>
            <SectionTitle
              eyebrow="process"
              title="이렇게 진행됩니다"
              desc={"체계적인 6단계 프로세스로\n안전하고 효율적인 만남을 경험하세요."}
              light
            />
          </motion.div>

          <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {FLOW_STEPS.map((step, idx) => {
              const direction = idx % 3 === 0 ? "left" : idx % 3 === 2 ? "right" : "up";

              return (
                <motion.div
                  key={step.no}
                  {...reveal(direction, idx * 0.055)}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.22 } }}
                  className="group rounded-[22px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm transition md:rounded-[28px] md:p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black tracking-[-0.04em] text-white/25 transition group-hover:text-orange-500/45 md:text-3xl">
                      {step.no}
                    </div>
                    <div className="text-xl text-orange-400 transition group-hover:scale-110 md:text-2xl">
                      {step.icon}
                    </div>
                  </div>

                  <div className="mt-4 text-lg font-bold tracking-[-0.03em] text-white md:mt-5 md:text-2xl">
                    {step.title}
                  </div>

                  <div className="mt-2.5 whitespace-pre-line break-keep text-[13px] leading-6 text-zinc-300 md:mt-3 md:text-sm md:leading-7">
                    {step.desc}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </MobileFrame>
    </section>
  );
}
