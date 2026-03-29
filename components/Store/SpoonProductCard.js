import React from "react";
import Image from "next/image";
import { PiCheckCircleFill } from "react-icons/pi";

function formatPrice(value = 0) {
  return Number(value || 0).toLocaleString("ko-KR");
}

export default function SpoonProductCard({
  item,
  selected = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      className={`relative w-full rounded-md border bg-white px-4 py-4 text-left shadow-sm transition ${selected
          ? "border-violet-500 ring-2 ring-violet-100 bg-violet-50"
          : "border-slate-200"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50">
          <Image
            src={item?.image || ""}
            alt={item?.title || "스푼 상품"}
            width={50}
            height={50}
            unoptimized
            className="object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="break-keep text-[16px] font-bold text-slate-900">
                {item?.title}
              </div>
              <div className="mt-0.5 text-[12px] text-slate-500">
                {item?.subLabel}
              </div>
            </div>

            {selected ? (
              <PiCheckCircleFill className="mt-0.5 shrink-0 text-[18px] text-violet-600" />
            ) : null}
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium text-slate-400 line-through">
                {formatPrice(item?.originalPrice || 0)}원
              </div>
              <div className="mt-0.5 text-[18px] font-black tracking-[-0.02em] text-slate-900">
                {formatPrice(item?.price || 0)}원
              </div>
            </div>

            <div className="text-right">
              <div className="text-[12px] font-semibold text-rose-500">
                {item?.discountRate || 0}% 할인
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}