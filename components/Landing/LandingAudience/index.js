import React from "react";
import { FiBriefcase, FiMapPin, FiUsers } from "react-icons/fi";

const audienceItems = [
  {
    icon: FiUsers,
    title: "30대 초반 ~ 40대 중반",
    description: "진지하게 만남을 고민하는 남성·여성 중심이에요. 비슷한 연령대 이성을 중심으로 추천해드립니다.",
  },
  {
    icon: FiBriefcase,
    title: "직장인·전문직·자영업·사업자",
    description: "직업 형태보다 서로의 생활 방식과 관계 태도를 더 중요하게 봅니다.",
  },
  {
    icon: FiMapPin,
    title: "수도권 회원 중심",
    description: "지방 거주자도 가입 가능하지만, 지역 상황에 따라 매칭이 조금 늦어질 수 있어요.",
  },
];

export default function LandingAudience() {
  return (
    <section className="px-4 pb-3 pt-5">
      <div className="rounded-[28px] bg-white px-5 py-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
          FOR WHOM
        </p>

        <h2 className="mt-2 break-keep text-[25px] font-extrabold leading-[1.24] tracking-[-0.035em] text-slate-950">
          멋지고 아름다운 남녀분들이
          <br />
          차밍수프를 시작하고 있어요.
        </h2>

        <p className="mt-3 break-keep text-[15px] font-medium leading-[1.65] text-slate-600">
          조건만 빠르게 훑기보다, 만나기 전 상대의 생각과 생활 방식을 먼저 보고 싶은 분들을 위한 매칭 서비스예요.
        </p>

        <div className="mt-5 space-y-3">
          {audienceItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-lg bg-[#f5f5f7] px-4 py-4 ring-1 ring-black/[0.04]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-[#0071e3]">
                  <Icon className="text-[19px]" />
                </div>

                <div className="min-w-0">
                  <p className="break-keep text-[16px] font-bold leading-[1.35] text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 break-keep text-[13px] font-medium leading-[1.55] text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
