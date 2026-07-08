import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiUser,
} from "react-icons/fi";

const memberCards = [
  {
    gender: "female",
    profile: "30대 중반 · 여성 · 서울",
    job: "사무직",
    quote: "결혼 전 생활 방식과 대화 태도를 먼저 보고 싶어요.",
    question: "갈등이 생기면 바로 풀어야 할까요?",
    answer: "감정이 가라앉은 뒤 차분히 이야기하는 편이 좋아요.",
    tags: ["서울", "사무직", "대화태도"],
  },
  {
    gender: "male",
    profile: "30대 후반 · 남성 · 경기",
    job: "브랜드 마케터",
    quote: "사진보다 오래 대화가 되는 사람인지가 궁금해요.",
    question: "연락 빈도는 어느 정도가 적당할까요?",
    answer: "바쁠 때도 짧게라도 상황 공유는 필요하다고 봐요.",
    tags: ["경기", "마케팅", "연락관"],
  },
  {
    gender: "female",
    profile: "40대 초반 · 여성 · 인천",
    job: "전문직",
    quote: "가치관이 맞는지 확인하고 천천히 만나고 싶어요.",
    question: "결혼 후 경제관은 어떻게 생각하나요?",
    answer: "공동 목표는 같이 관리하되 개인 영역도 존중하고 싶어요.",
    tags: ["인천", "전문직", "결혼관"],
  },
  {
    gender: "male",
    profile: "30대 초반 · 남성 · 서울",
    job: "IT 기획",
    quote: "외모보다 일상 리듬과 관계 속도가 맞는지가 중요해요.",
    question: "주말은 각자 보내는 게 좋을까요?",
    answer: "각자의 시간도 좋지만, 함께 보내는 루틴이 조금은 필요해요.",
    tags: ["서울", "IT", "생활방식"],
  },
];

function Avatar({ gender }) {
  const isFemale = gender === "female";

  return (
    <div
      className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-[0_12px_24px_rgba(15,23,42,0.08)] ${
        isFemale
          ? "bg-gradient-to-br from-rose-100 via-white to-violet-100 text-[#0071e3]"
          : "bg-[#f5f5f7] text-slate-600"
      }`}
      aria-hidden="true"
    >
      <FiUser className="text-[25px]" />
      <span
        className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[12px] ${
          isFemale ? "bg-[#0071e3] text-white" : "bg-slate-900 text-white"
        }`}
      >
        {isFemale ? "♀" : "♂"}
      </span>
    </div>
  );
}

function MemberCard({ item }) {
  return (
    <motion.article
      key={item.profile}
      initial={{ opacity: 0, x: 26, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, scale: 0.985 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      className="min-h-[354px] rounded-[20px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(1,2,2,0.26)] ring-1 ring-black/[0.04]"
    >
      <div className="flex items-center gap-3">
        <Avatar gender={item.gender} />

        <div className="min-w-0">
          <p className="break-keep text-[16px] font-bold leading-[1.32] text-slate-950">
            {item.profile}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
            <FiBriefcase className="text-[13px]" />
            {item.job}
          </p>
        </div>
      </div>

      <p className="mt-4 break-keep rounded-2xl bg-white/90 px-3 py-3 text-[14px] font-semibold leading-[1.55] text-slate-700 shadow-sm">
        “{item.quote}”
      </p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-[#f5f5f7]/60 px-3 py-3">
        <p className="break-keep text-[12px] font-extrabold text-[#0071e3]">
          중요하게 보는 질문
        </p>
        <p className="mt-1 break-keep text-[14px] font-extrabold leading-[1.45] text-slate-900">
          {item.question}
        </p>
        <p className="mt-2 break-keep text-[13px] font-medium leading-[1.55] text-slate-600">
          답변: {item.answer}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-500"
          >
            #{tag}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

export default function LandingMembers() {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = memberCards.length;
  const activeMember = useMemo(() => memberCards[activeIndex], [activeIndex]);

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [total]);

  return (
    <section className="px-4 pb-3 pt-5">
      <div className="rounded-[28px] bg-white px-5 py-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              MEMBERS
            </p>
            <h2 className="mt-2 break-keep text-[25px] font-extrabold leading-[1.24] tracking-[-0.035em] text-slate-950">
              어떤 사람들이
              <br />
              가입하고 있을까요?
            </h2>
          </div>
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-[#0071e3] sm:flex">
            <FiMapPin className="text-[20px]" />
          </div>
        </div>

        <p className="mt-3 break-keep text-[15px] font-medium leading-[1.65] text-slate-600">
          일과 삶의 기준이 분명한 3040 회원들이, 사진보다 대화와 가치관을 먼저 확인하며 진지한 만남을 준비하고 있어요.
        </p>

        <div className="relative mt-5 overflow-hidden rounded-[20px] shadow">
          <AnimatePresence mode="wait">
            <MemberCard key={activeMember.profile} item={activeMember} />
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {memberCards.map((item, index) => (
              <button
                key={item.profile}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === index ? "w-6 bg-[#0071e3]" : "w-1.5 bg-slate-200"
                }`}
                aria-label={`${index + 1}번째 회원 카드 보기`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="이전 회원 카드"
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="다음 회원 카드"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-[13px] font-medium leading-[1.5] text-slate-600">
          <FiHeart className="shrink-0 text-rose-400" />
          실제 개인 정보는 노출하지 않으며, 프로필 승인 후 안전하게 매칭이 진행돼요.
        </div>
      </div>
    </section>
  );
}
