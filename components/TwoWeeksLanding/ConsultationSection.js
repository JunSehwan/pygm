import { motion, useReducedMotion } from "framer-motion";
import { FiArrowUpRight, FiMessageCircle } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import {
  CONSULTATION_CASES,
  KAKAO_INQUIRY_URL,
} from "./constants";

function ConsultationCard({ item, index, reduceMotion }) {
  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.6,
        delay: reduceMotion ? 0 : index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="w-[86vw] max-w-[420px] shrink-0 snap-center overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)] md:w-auto md:max-w-none"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fee500] text-base text-slate-950">
            <FiMessageCircle aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-950">투윅스 상담</div>
            <div className="mt-0.5 text-[11px] font-semibold text-slate-400">익명 문의</div>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-black text-slate-500">
          {item.topic}
        </span>
      </div>

      <div className="min-h-[330px] bg-white px-5 py-7">
        <div className="ml-auto max-w-[88%] rounded-[18px] rounded-tr-[5px] bg-[#fee500] px-4 py-3 text-sm font-semibold leading-6 text-[#191919]">
          {item.question}
        </div>

        <div className="mt-5 flex items-end gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-black text-[#ff5b4d]">
            2W
          </div>
          <div className="max-w-[84%] rounded-[18px] rounded-bl-[5px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
            {item.answer}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 pl-10 text-[11px] font-semibold text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          궁금한 내용을 먼저 확인한 뒤 신청하셔도 됩니다
        </div>
      </div>

      <div className="border-t border-slate-100 px-5 py-3 text-[11px] font-semibold text-slate-400">
        실제 문의 내용을 바탕으로 개인정보 없이 재구성했습니다.
      </div>
    </motion.article>
  );
}

export default function ConsultationSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="consultation" className="border-b border-slate-200 bg-white text-slate-950">
      <MobileFrame className="py-20 md:py-32">
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <div>
            {/* <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#fee500] text-xl text-slate-950">
              <FiMessageCircle aria-hidden="true" />
            </div> */}
            <p className="mt-6 text-xs font-black tracking-[0.08em] text-[#ff5b4d] md:text-sm">
              카카오톡 상담
            </p>
            <h2 className="mt-5 break-keep text-[38px] font-black md:text-6xl ">
              궁금한 점부터 확인하고
              <br />
              <span className="text-slate-500">그다음 신청하셔도 됩니다.</span>
            </h2>
          </div>

          <div className="lg:justify-self-end">
            <p className="max-w-xl break-keep text-base font-medium leading-8 text-slate-600 md:text-lg md:leading-9">
              모집 대상, 활동 지역, 프로필 공개 범위와 진행 방식까지
              <br className="hidden sm:block" /> 편하게 물어보시면 차근차근 안내해드립니다.
            </p>
            <a
              href={KAKAO_INQUIRY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#fee500] px-6 text-sm font-black text-[#191919] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(254,229,0,0.24)] md:text-base"
            >
              카카오톡으로 문의하기
              <FiArrowUpRight className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:mt-16">
          {CONSULTATION_CASES.map((item, index) => (
            <ConsultationCard
              key={item.topic}
              item={item}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </MobileFrame>
    </section>
  );
}
