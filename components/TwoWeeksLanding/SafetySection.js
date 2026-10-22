import { FiCheck, FiHelpCircle, FiShield } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import { SAFETY_QA_ITEMS } from "./constants";

export default function SafetySection() {
  return (
    <section id="safety" className="border-b border-slate-100 bg-[#f7f8fa] py-16 md:py-28">
      <MobileFrame>
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-[#d85b48] shadow-sm">
              <FiShield aria-hidden="true" />
            </span>
            <h2 className="mt-6 break-keep text-[34px] font-black leading-[1.15] tracking-[-0.055em] text-slate-950 md:text-5xl">
              처음 만나는 사이니까,
              <br />
              조금 더 신중하게.
            </h2>
            <p className="mt-5 break-keep text-base font-medium leading-8 text-slate-600">
              프로필 확인부터 연락처 공개까지, 두 사람이 안심하고 선택할 수 있는 순서로 진행합니다.
            </p>
          </div>

          <div className="grid gap-3">
            {SAFETY_QA_ITEMS.map((item) => (
              <article
                key={item.q}
                className="rounded-[24px] border border-slate-200 bg-white p-5 md:p-7"
              >
                <div className="flex gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-700">
                    <FiHelpCircle aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="break-keep text-lg font-black tracking-[-0.035em] text-slate-950 md:text-xl">
                      {item.q}
                    </h3>
                    <p className="mt-3 flex gap-2 break-keep text-sm font-medium leading-7 text-slate-600 md:text-base md:leading-8">
                      <FiCheck className="mt-1.5 shrink-0 text-[#d85b48]" aria-hidden="true" />
                      <span>{item.a}</span>
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </MobileFrame>
    </section>
  );
}
