import { FiCoffee, FiMessageCircle, FiUser } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import { BENEFIT_ITEMS } from "./constants";

const ICONS = {
  focus: FiUser,
  offline: FiMessageCircle,
  coffee: FiCoffee,
};

export default function BenefitSection() {
  return (
    <section id="why" className="border-b border-slate-100 bg-white py-16 md:py-28">
      <MobileFrame>
        <div className="max-w-3xl">
          <h2 className="break-keep text-[34px] font-black leading-[1.15] tracking-[-0.055em] text-slate-950 md:text-6xl">
            소개팅을 조금 더 편하게 만들었습니다.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:mt-16 md:grid-cols-3 md:gap-6">
          {BENEFIT_ITEMS.map((item, index) => {
            const Icon = ICONS[item.key] || FiUser;
            return (
              <article
                key={item.title}
                className="rounded-[28px] border border-solid border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(15,23,42,0.08)] md:min-h-[300px] md:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="text-sm font-black text-slate-300">0{index + 1}</span>
                </div>
                <h3 className="mt-12 text-2xl font-black tracking-[-0.045em] text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-4 break-keep text-base font-medium leading-8 text-slate-600">
                  {item.desc}
                </p>
              </article>
            );
          })}
        </div>
      </MobileFrame>
    </section>
  );
}
