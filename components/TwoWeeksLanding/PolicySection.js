import { FiCheck, FiShield } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import { TRUST_ITEMS } from "./constants";

export default function PolicySection() {
  return (
    <section className="bg-[#fff4ef] text-slate-950">
      <MobileFrame className="py-20 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-[#ff5b4d] shadow-sm">
              <FiShield aria-hidden="true" />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-[#ff5b4d] md:text-sm">
              Simple & Safe
            </p>
            <h2 className="mt-5 break-keep text-[38px] font-black leading-[1.12] tracking-[-0.055em] md:text-6xl">
              가볍게 시작해도,
              <br />
              <span className="text-slate-400">운영은 꼼꼼하게.</span>
            </h2>
          </div>

          <div className="grid gap-3">
            {TRUST_ITEMS.map((item) => (
              <article
                key={item.label}
                className="grid gap-3 rounded-[24px] border border-white bg-white/90 p-5 shadow-[0_12px_36px_rgba(124,45,18,0.06)] sm:grid-cols-[120px_150px_1fr] sm:items-center md:p-6"
              >
                <div className="flex items-center gap-2 text-sm font-black text-[#ff5b4d]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff5b4d] text-white">
                    <FiCheck aria-hidden="true" />
                  </span>
                  {item.label}
                </div>
                <div className="text-xl font-black tracking-[-0.035em] text-slate-950">
                  {item.value}
                </div>
                <p className="break-keep text-sm font-medium leading-7 text-slate-600">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </MobileFrame>
    </section>
  );
}
