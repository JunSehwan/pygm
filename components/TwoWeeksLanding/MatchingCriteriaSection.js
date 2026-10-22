import {
  FiBriefcase,
  FiHeart,
  FiImage,
  FiMapPin,
} from "react-icons/fi";
import MobileFrame from "./MobileFrame";

const CRITERIA = [
  {
    icon: FiImage,
    title: "나이 · 사진 분위기",
    desc: "서로의 연령대와 프로필 인상을 함께 봅니다.",
  },
  {
    icon: FiBriefcase,
    title: "직업 · 생활 패턴",
    desc: "직업군과 평소 생활 방식을 확인합니다.",
  },
  {
    icon: FiMapPin,
    title: "거리 · 가능한 일정",
    desc: "가까운 생활권과 겹치는 시간을 우선합니다.",
  },
  {
    icon: FiHeart,
    title: "결혼관 · 생활 가치관",
    desc: "자녀 계획과 흡연·음주·종교 선호를 살핍니다.",
  },
];

export default function MatchingCriteriaSection() {
  return (
    <section id="matching" className="border-b border-slate-200 bg-white text-slate-950">
      <MobileFrame className="py-20 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-black tracking-[0.08em] text-[#ff5b4d] md:text-sm">
              한 사람을 고르는 기준
            </p>
            <h2 className="mt-5 max-w-3xl break-keep text-[38px] font-black leading-[1.12] tracking-[-0.055em] md:text-6xl">
              프로필을 먼저 보고,
              <br />
              <span className="text-slate-400">만날지는 내가 결정해요.</span>
            </h2>
            <p className="mt-6 max-w-2xl break-keep text-base font-medium leading-8 text-slate-600 md:text-lg md:leading-9">
              여러 조건을 함께 보고 운영자가 마지막으로 다시 확인한 뒤 한 사람을 제안합니다.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {CRITERIA.map(({ icon: Icon, title, desc }) => (
                <article key={title} className="rounded-[22px] border border-slate-200 bg-white p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0ec] text-[#ff5b4d]">
                    <Icon aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-black tracking-[-0.03em]">{title}</h3>
                  <p className="mt-2 break-keep text-sm font-medium leading-6 text-slate-600">{desc}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="flex min-h-[280px] items-center border-l-4 border-[#ff5b4d] pl-7 md:pl-10 lg:min-h-[420px]">
            <p className="max-w-xl break-keep text-[38px] font-black leading-[1.18] tracking-[-0.055em] text-slate-950 md:text-6xl">
              조건은 꼼꼼하게, <span className="text-[#ff5b4d]">만남 결정은 직접.</span>
            </p>
          </div>
        </div>
      </MobileFrame>
    </section>
  );
}
