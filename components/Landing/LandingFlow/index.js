import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiCheckCircle,
  FiHeart,
  FiLock,
  FiMessageCircle,
  FiUserPlus,
  FiZap,
} from "react-icons/fi";

const flowItems = [
  {
    icon: FiUserPlus,
    step: "01",
    title: "회원정보 입력",
    description:
      "본인인증과 기본 회원정보를 입력하면 차밍수프 이용을 시작할 수 있어요.",
  },
  {
    icon: FiCheckCircle,
    step: "02",
    title: "가입 완료",
    description:
      "가입 완료 후에는 테스트와 프로필 작성 등 가벼운 기능부터 이용할 수 있어요.",
  },
  {
    icon: FiMessageCircle,
    step: "03",
    title: "추가정보 입력",
    description:
      "프로필 사진, 기본정보, 성향·가치관 답변이 충분히 채워지면 매칭 검토가 가능해요.",
  },
  {
    icon: FiHeart,
    step: "04",
    title: "추천 확인과 호감 표시",
    description:
      "상대의 프로필과 차밍카드 답변을 보고, 서로 호감이 맞을 때만 연락처 공개 단계로 넘어가요.",
  },
];

const guideItems = [
  {
    icon: FiLock,
    label: "가입 완료 후",
    title: "바로 이용 가능",
    tone: "rose",
    description: "가볍게 둘러보고, 나를 표현하는 준비 단계예요.",
    services: ["연애스타일 테스트", "차밍카드"],
  },
  {
    icon: FiZap,
    label: "추가정보 입력 후",
    title: "매칭서비스 가능",
    tone: "violet",
    description: "프로필이 충분히 채워진 분부터 실제 매칭이 진행돼요.",
    services: ["이성 소개", "호감 보내기", "호감 확인", "매칭"],
  },
];

function ServiceCapsule({ children, tone }) {
  const toneClass =
    tone === "rose"
      ? "border-slate-200 bg-[#f5f5f7] text-[#0071e3]"
      : "border-slate-200 bg-[#f5f5f7] text-[#0071e3]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-extrabold leading-none shadow-[0_8px_16px_rgba(15,23,42,0.04)] ${toneClass}`}
    >
      {children}
    </span>
  );
}

function GuideCard({ item }) {
  const Icon = item.icon;
  const isRose = item.tone === "rose";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.34 }}
      className={`rounded-[22px] bg-[#f5f5f7] px-4 py-4 ring-1 ring-black/[0.04] ${
        isRose
          ? "border-transparent"
          : "border-transparent"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${
            isRose ? "text-[#0071e3]" : "text-[#0071e3]"
          }`}
        >
          <Icon className="text-[18px]" />
        </div>

        <div className="min-w-0">
          <p
            className={`text-[11px] font-extrabold tracking-[0.12em] ${
              isRose ? "text-slate-400" : "text-slate-400"
            }`}
          >
            {item.label}
          </p>
          <p className="mt-0.5 break-keep text-[16px] font-extrabold leading-[1.32] text-slate-950">
            {item.title}
          </p>
        </div>
      </div>

      <p className="mt-3 break-keep text-[13px] font-semibold leading-[1.55] text-slate-600">
        {item.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-0.5">
        {item.services.map((service) => (
          <ServiceCapsule key={service} tone={item.tone}>
            {service}
          </ServiceCapsule>
        ))}
      </div>
    </motion.div>
  );
}

export default function LandingFlow() {
  return (
    <section className="px-4 pb-3 pt-5">
      <div className="rounded-[28px] bg-white px-5 py-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
          HOW IT WORKS
        </p>

        <h2 className="mt-2 break-keep text-[25px] font-extrabold leading-[1.24] tracking-[-0.035em] text-slate-950">
          매칭은 신중하지만,
          <br />
          신속하게 진행돼요.
        </h2>

        <p className="mt-3 break-keep text-[15px] font-medium leading-[1.65] text-slate-600">
          차밍수프는 가입과 실제 매칭 단계를 분리해요. 프로필이 충분히 채워진 분부터 매칭서비스를 이용할 수 있어요.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {guideItems.map((item) => (
            <GuideCard key={item.title} item={item} />
          ))}
        </div>

        <div className="relative mt-6 space-y-3">
          <div className="absolute bottom-8 left-[21px] top-8 w-px bg-gradient-to-b from-violet-200 via-rose-100 to-violet-100" />

          {flowItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.38, delay: index * 0.06 }}
                className="relative flex gap-3 rounded-[20px] border border-solid border-slate-100 bg-gradient-to-br from-white via-white to-[#fff7fb] px-3 py-3"
              >
                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
                  <Icon className="text-[17px]" />
                </div>

                <div className="min-w-0 pt-0.5">
                  <p className="text-[11px] font-extrabold tracking-[0.14em] text-slate-400">
                    STEP {item.step}
                  </p>
                  <p className="mt-1 break-keep text-[17px] font-extrabold leading-[1.35] text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 break-keep text-[13px] font-medium leading-[1.58] text-slate-600">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <Link
          href="/signup"
          className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-[#0071e3] text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] transition hover:bg-[#0077ed]"
        >
          간단 회원가입
          <FiArrowRight className="text-[17px]" />
        </Link>
      </div>
    </section>
  );
}
