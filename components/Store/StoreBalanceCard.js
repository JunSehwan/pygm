import React from "react";
import Image from "next/image";
import { PiArrowRight } from "react-icons/pi";

function formatPrice(value = 0) {
  return Number(value || 0).toLocaleString("ko-KR");
}

export default function StoreBalanceCard({ spoonCount = 0, onPolicyClick }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-50">
            <Image
              src="/image/store/spoon/gold_spoon.png"
              alt="보유 스푼"
              width={38}
              height={38}
              unoptimized
              className="object-contain"
            />
          </div>

          <div>
            <div className="text-[12px] font-semibold text-slate-500">
              현재 보유 스푼
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[22px] font-black tracking-[-0.03em] text-slate-900">
                {formatPrice(spoonCount)}
              </span>
              <span className="text-[13px] font-bold text-violet-600">개</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onPolicyClick}
          style={{ cursor: "pointer" }}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:text-slate-900"
        >
          충전/환불 안내
          <PiArrowRight className="text-[14px]" />
        </button>
      </div>
    </section>
  );
}