import {
  FiCalendar,
  FiCheckCircle,
  FiCoffee,
  FiEdit3,
  FiUser,
} from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import MobileSwipeCarousel from "./MobileSwipeCarousel";
import { QUICK_PROCESS_STEPS } from "./constants";

const ICONS = {
  profile: FiEdit3,
  ready: FiCheckCircle,
  proposal: FiUser,
  schedule: FiCalendar,
  meeting: FiCoffee,
};

function ProcessCard({ step }) {
  const Icon = ICONS[step.key] || FiCheckCircle;

  return (
    <article className="relative h-full rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)] md:min-h-[250px] md:p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black tracking-[0.12em] text-[#d85b48]">
          {step.number}
        </span>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2f5f7] text-lg text-slate-700">
          <Icon aria-hidden="true" />
        </span>
      </div>
      <h3 className="mt-8 break-keep text-xl font-black tracking-[-0.04em] text-slate-950">
        {step.title}
      </h3>
      <p className="mt-3 break-keep text-sm font-medium leading-7 text-slate-600">
        {step.desc}
      </p>
    </article>
  );
}

export default function QuickProcessSection() {
  return (
    <section id="how" className="border-b border-slate-100 bg-[#fbfbfa] py-16 md:py-24">
      <MobileFrame>
        <div className="max-w-2xl">
          <p className="text-xs font-black tracking-[0.08em] text-[#d85b48]">이용 방법</p>
          <h2 className="mt-3 break-keep text-[34px] font-black leading-[1.15] tracking-[-0.055em] text-slate-950 md:text-5xl">
            투윅스에서 어떻게 만날까요?
          </h2>
          <p className="mt-4 break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            가입해두고, 새로운 소개가 도착했을 때 확인하면 됩니다.
          </p>
        </div>

        <MobileSwipeCarousel label="투윅스 5단계 이용 과정" className="mt-9 md:hidden">
          {QUICK_PROCESS_STEPS.map((step) => (
            <ProcessCard key={step.number} step={step} />
          ))}
        </MobileSwipeCarousel>

        <div className="relative mt-12 hidden grid-cols-5 gap-3 md:grid">
          <div className="absolute left-[8%] right-[8%] top-[51px] h-px bg-slate-200" aria-hidden="true" />
          {QUICK_PROCESS_STEPS.map((step) => (
            <ProcessCard key={step.number} step={step} />
          ))}
        </div>

        <div className="mt-9 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-bold leading-6 text-slate-700 md:mt-10 md:text-base">
          만남 후 두 사람 모두 다시 만나고 싶을 때만 연락처가 공개됩니다.
        </div>
      </MobileFrame>
    </section>
  );
}
