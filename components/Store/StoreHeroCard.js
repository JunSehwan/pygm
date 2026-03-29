import React from "react";
import { PiSparkleDuotone } from "react-icons/pi";

export default function StoreHeroCard() {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f5ff_100%)] shadow-sm">
      <div className="px-4 pb-4 pt-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-600">
          <PiSparkleDuotone className="text-[14px]" />
          Spoon Store
        </div>

        <div className="mt-3 text-[23px] font-black leading-[1.25] tracking-[-0.03em] text-slate-900">
          더 가볍게 시작하고,
          <br />
          마음이 가는 사람에게 다가가보세요
        </div>

        <div className="mt-2 break-keep text-[13px] leading-6 text-slate-600">
          필요한 만큼만 충전해서 사용할 수 있는
          <br />
          차밍수프의 스푼 상점이에요.
        </div>

        <div className="mt-4 rounded-md border border-violet-100 bg-violet-50 px-3 py-3">
          <div className="text-[13px] font-bold text-slate-900">
            부담 없이 시작할 수 있는 구조
          </div>
          <div className="mt-1 text-[12px] leading-5 text-slate-600">
            입금확인 후, 1일 이내에 순차적으로 스푼을 충전해드려요.
          </div>
        </div>
      </div>
    </section>
  );
}