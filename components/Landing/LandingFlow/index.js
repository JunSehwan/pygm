import React from "react";
import { FiMessageCircle, FiSearch, FiHeart } from "react-icons/fi";

const flowItems = [
  {
    id: 1,
    icon: FiMessageCircle,
    title: "차밍카드로 먼저 파악",
    description:
      "상황 질문에 대한 답변을 통해\n말투보다 진짜 반응과 선택을 먼저 확인합니다.",
  },
  {
    id: 2,
    icon: FiSearch,
    title: "가치관과 생각까지 탐색",
    description:
      "프로필만 빠르게 넘기는 방식이 아니라\n관계 기준과 생각의 결을 조금 더 자세히 봅니다.",
  },
  {
    id: 3,
    icon: FiHeart,
    title: "잘 통하는 사람과 연결",
    description:
      "조건만이 아니라 행동의 결까지 보고,\n티키타카가 되는 만남으로 이어집니다.",
  },
];

export default function LandingFlow() {
  return (
    <section className="bg-gradient-to-b from-[#7E90E9] via-[#95B3E9] to-[#B4D8E9] px-4 pb-8 pt-7">
      <div className="rounded-[24px] border border-white/25 bg-[#5E74E7]/24 px-2 py-6 backdrop-blur-md">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/72">
          HOW IT WORKS
        </p>

        <h2 className="mt-2 text-[30px] font-extrabold leading-[1.14] text-white">
          차밍수프 사용 흐름
        </h2>

        <p className="mt-3 text-[16px] leading-[1.68] text-white/86">
          부담은 줄이고,
          <br />
          더 잘 맞는 이성을 찾을 수 있게 도와드립니다.
        </p>

        <div className="mt-8 space-y-4">
          {flowItems.map((item, index) => {
            const Icon = item.icon;
            const step = `STEP 0${index + 1}`;

            return (
              <div
                key={item.id}
                className="rounded-[22px] border border-white/50 bg-white/30 px-4 py-4"
              >
                <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-4">
                  <div className="flex flex-col items-center gap-3 pt-0.5">
                    <div className="min-w-[54px]">
                      <div className="text-[11px] font-semibold tracking-[0.16em] text-white/58 text-center">
                        STEP
                      </div>
                      <div className="mt-1 text-[22px] font-extrabold leading-none tracking-[-0.03em] text-white text-center">
                        0{index + 1}
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#697DE8]">
                      <Icon size={17} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[18px] font-extrabold leading-[1.35] text-indigo-700">
                      {item.title}
                    </p>

                    <p className="mt-2 whitespace-pre-line text-[15px] leading-[1.45] text-white/84">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}