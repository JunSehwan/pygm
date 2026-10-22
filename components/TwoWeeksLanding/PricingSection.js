import { FiCheck, FiCoffee, FiRefreshCw } from "react-icons/fi";
import MobileFrame from "./MobileFrame";

const PRICE_ITEMS = [
  { label: "소개비", value: "0원", icon: FiCheck, accent: true },
  { label: "노쇼 방지 예치금", value: "30,000원", icon: FiRefreshCw },
  { label: "카페 이용", value: "각자 주문한 음료비", icon: FiCoffee },
];

export default function PricingSection() {
  return (
    <section id="price" className="border-b border-slate-100 bg-[#f7f8fa] py-16 md:py-28">
      <MobileFrame>
        <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)] md:rounded-[44px] md:p-12">
          <div className="grid gap-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-black tracking-[0.08em] text-[#d85b48]">이용 안내</p>
              <h2 className="mt-3 break-keep text-[38px] font-black leading-[1.12] tracking-[-0.06em] text-slate-950 md:text-6xl">
                오픈기념
                <br />
                매칭비 무료!
              </h2>
              <p className="mt-5 break-keep text-sm font-medium leading-7 text-slate-600 md:text-base md:leading-8">
                예치금은 서비스 이용료가 아니라 만남 약속을 위한 보증금입니다. 정상적으로 이용하는 동안 유지되며, 서비스 이용 종료 시 정책에 따라 반환됩니다.
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-[24px] border border-slate-200 px-0 md:px-7">
              {PRICE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between gap-5 py-5 md:py-6">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600 md:text-base">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Icon aria-hidden="true" />
                      </span>
                      {item.label}
                    </div>
                    <div className={`text-right text-base font-black tracking-[-0.035em] md:text-xl ${item.accent ? "text-[#d85b48]" : "text-slate-950"}`}>
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </MobileFrame>
    </section>
  );
}
