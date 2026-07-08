import React from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiGift,
  FiLock,
  FiMessageCircle,
  FiShield,
} from "react-icons/fi";

const trustItems = [
  {
    icon: FiLock,
    text: "연락처는 서로 동의 후 공개돼요",
  },
  {
    icon: FiShield,
    text: "프로필은 승인 후 안전하게 노출돼요",
  },
  {
    icon: FiGift,
    text: "진지한 만남을 부담 낮게 시작해요",
  },
];

export default function LandingCTA() {
  return (
    <section className="bg-[#f5f5f7] px-4 pb-8 pt-5">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <div className="px-5 pb-5 pt-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-bold text-[#0071e3]">
            <FiGift className="text-[14px]" />
            3040 진지한 만남·무료 이성소개
          </div>

          <h3 className="mt-3 break-keep text-[25px] font-extrabold leading-[1.25] tracking-[-0.04em] text-slate-950">
            만남 전 확인하고 싶은 것,
            <br />
            이제는 먼저 보고 만나세요.
          </h3>

          <p className="mt-3 break-keep text-[15px] font-medium leading-[1.65] text-slate-600">
            차밍수프는 3040이 만남 전에 궁금해하는 생활 방식, 결혼관, 대화 태도를 차밍카드로 확인하게 합니다.
          </p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-[#f5f5f7]/60 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0071e3] shadow-sm">
                <FiMessageCircle className="text-[17px]" />
              </div>
              <div>
                <p className="break-keep text-[15px] font-extrabold leading-[1.45] text-slate-900">
                  가입하면 차밍카드와 프로필로 이성의 중요한 기준을 먼저 확인할 수 있어요.
                </p>
                <p className="mt-1 break-keep text-[12px] font-medium leading-[1.55] text-slate-500">
                  조건만 보거나 바로 연락하기보다, 서로의 생각을 먼저 보는 방식이에요.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5">
            {trustItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-[18px] bg-[#f5f5f7] px-3 py-3 ring-1 ring-black/[0.04]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-[#0071e3]">
                    <Icon className="text-[15px]" />
                  </span>
                  <span className="break-keep text-[13px] font-bold leading-[1.45] text-slate-600">
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2">
            <Link
              href="/signup"
              className="group flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#0071e3] text-[16px] font-extrabold text-white shadow-[0_12px_24px_rgba(124,58,237,0.24)] transition hover:bg-[#0077ed]"
            >
              나와 맞는 이성 만나기
              <FiArrowRight className="text-[18px] transition group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[15px] font-bold text-slate-700 transition hover:bg-slate-50"
            >
              로그인
            </Link>
          </div>

          <p className="mt-3 break-keep text-center text-[12px] font-medium leading-[1.5] text-slate-400">
            회원가입 후 프로필 승인 절차를 거쳐 안전하게 서비스 이용이 시작돼요.
          </p>
        </div>
      </div>
    </section>
  );
}
