import React from "react";
import Image from "next/image";
import { FiHeart, FiMessageCircle, FiStar } from "react-icons/fi";

function HeroPointCard({ icon: Icon, text }) {
  return (
    <div className="rounded-[15px] border border-white/20 bg-white/20 px-4 py-4 backdrop-blur-[8px]">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#697DE8]">
          {Icon ? <Icon size={17} /> : null}
        </div>

        <p className="text-[15px] font-semibold leading-[1.45] tracking-[-0.02em] text-violet-900">
          {text}
        </p>
      </div>
    </div>
  );
}

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#697DE8] via-[#89A3EA] to-[#B4D8E9] px-4 pb-8 pt-16">
      <div className="px-1 pt-5">
        <h1 className="whitespace-pre-line text-[38px] font-extrabold leading-[1.14] text-white">
          {/* 연애 행동 분석 기반,
          {"\n"} */}
          티키타카가 되는
          {"\n"}
          이성과의 만남
        </h1>

        <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.6] text-lime-100">
          차밍카드는 연애 상황 속 상대방의 선택과 반응을 통해
          {"\n"}
          대화의 결, 반응의 결이 맞는 사람을 연결합니다.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <Image
          src="/image/landing/landing.png"
          alt="차밍수프 랜딩 히어로 이미지"
          width={330}
          height={336}
          priority
          className="h-auto w-[316px] object-contain"
        />
      </div>

      <div className="mt-3 flex justify-start pl-3">
        <div className="text-[32px] leading-none text-white/80">↓</div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 px-1">
        <HeroPointCard
          icon={FiHeart}
          text="좋은 만남은 조건만으로 완성되지 않습니다."
        />
        <HeroPointCard
          icon={FiMessageCircle}
          text="이성의 진짜 매력은 행동과 생각에서 드러납니다."
        />
        <HeroPointCard
          icon={FiStar}
          text="차밍수프는 행동 분석으로 멋진 이성을 연결합니다."
        />
      </div>
    </section>
  );
}