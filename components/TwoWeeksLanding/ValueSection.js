import { motion, useReducedMotion } from "framer-motion";
import MobileFrame from "./MobileFrame";
import { VALUE_ITEMS } from "./constants";

export default function ValueSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="about" className="border-b border-slate-200 bg-white  text-slate-950">
      <MobileFrame className="py-20 md:py-36">
        <div>
          <div>
            <p className="text-xs font-black tracking-[0.08em] text-[#ff5b4d] md:text-sm">
              투윅스는?
            </p>
            <h2 className="mt-5 break-keep text-[34px] font-black leading-[1.16] tracking-[-0.05em] sm:text-[40px] md:text-[48px] lg:text-[52px]">
              <span className="block xl:whitespace-nowrap">매칭만 해주는 서비스가 아니라,</span>
              <span className="mt-1 block text-slate-400 xl:whitespace-nowrap">실제 만남까지 이어지는 약속형 소개팅.</span>
            </h2>
          </div>
          <p className="mt-6 max-w-2xl break-keep text-base font-medium leading-8 text-slate-600 md:text-lg md:leading-9">
            제안에 응답하고, 일정을 정하고,
            <br className="hidden sm:block" />
            카페에서 60분 동안 만나는 과정까지 함께 운영합니다.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-solid border-slate-200 bg-slate-200 md:mt-20 md:grid-cols-3 md:rounded-[36px]">
          {VALUE_ITEMS.map((item, index) => (
            <motion.article
              key={item.number}
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.65,
                delay: reduceMotion ? 0 : index * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative min-h-[280px] overflow-hidden bg-white p-7 md:min-h-[360px] md:p-9"
            >
              <div className="absolute right-6 top-5 text-[64px] font-black leading-none tracking-[-0.08em] text-slate-900 transition group-hover:text-[#ff5b4d] md:text-[84px]">
                {item.number}
              </div>
              <div className="relative flex h-full flex-col">
                <p className="text-xs font-black tracking-[0.06em] text-[#ff5b4d]">
                  {item.label}
                </p>
                <div className="mt-auto pt-24">
                  <h3 className="break-keep text-[26px] font-black tracking-[-0.045em] md:text-[30px]">
                    {item.title}
                  </h3>
                  <p className="mt-4 break-keep text-sm font-medium leading-7 text-slate-600 md:text-base md:leading-8">
                    {item.desc}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </MobileFrame>
    </section>
  );
}
