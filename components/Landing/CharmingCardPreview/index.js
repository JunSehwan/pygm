import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMessageCircle,
  FiX,
} from "react-icons/fi";

const previewCards = [
  {
    badge: "연락",
    title: "연애할 때 연락 빈도는 어느 정도가 편한가요?",
    question: "바쁜 날에도 연락이 꼭 필요하다고 생각하나요?",
    answer:
      "매시간 연락보다, 바쁠 때 짧게라도 상황을 공유해주는 사람이 좋아요. 서로의 생활을 존중하는 연락이 편해요.",
    hearts: 18,
    tags: ["연락 빈도", "생활 리듬", "배려"],
  },
  {
    badge: "갈등",
    title: "의견이 다를 때 가장 중요하게 보는 태도는?",
    question: "다툼이 생기면 바로 풀어야 할까요, 시간을 둬야 할까요?",
    answer:
      "감정이 올라온 상태에서 몰아붙이기보다, 잠깐 정리한 뒤 차분히 대화하는 사람이 좋습니다.",
    hearts: 24,
    tags: ["대화 방식", "갈등 해결", "감정 조절"],
  },
  {
    badge: "결혼관",
    title: "결혼 후 돈 관리는 어떻게 하는 게 좋다고 생각하나요?",
    question: "공동관리와 각자관리 중 어떤 방식이 더 맞나요?",
    answer:
      "생활비와 공동 목표는 함께 관리하되, 서로의 개인 소비 영역도 존중되는 방식이 좋다고 생각해요.",
    hearts: 31,
    tags: ["결혼관", "경제관념", "생활 방식"],
  },
];

function HeartCount({ count }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[12px] font-extrabold text-[#0071e3]">
      <FiHeart className="fill-current text-[13px]" />
      {count}
    </div>
  );
}

function PreviewCard({ card, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block h-full w-full text-left outline-none"
      aria-label={`${card.badge} 차밍카드 미리보기`}
    >
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.42 }}
        className="flex h-full min-h-[430px] w-full flex-col rounded-[24px] border-solid border border-white/80 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.07)] ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.11)] sm:min-h-[410px] "
      >
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-bold text-slate-600">
            {card.badge} 질문
          </span>
          <HeartCount count={card.hearts} />
        </div>

        <h3 className="mt-3 min-h-[50px] break-keep text-[18px] font-extrabold leading-[1.36] tracking-[-0.02em] text-slate-950">
          {card.title}
        </h3>

        <div className="mt-3 min-h-[98px] rounded-2xl border border-solid border-slate-100 bg-slate-50/80 px-3 py-3">
          <div className="flex items-center gap-1.5 text-[12px] font-extrabold text-slate-500">
            <FiMessageCircle className="text-[14px]" />
            실제로 확인하는 질문
          </div>
          <p className="mt-1.5 break-keep text-[14px] font-bold leading-[1.5] text-slate-800">
            {card.question}
          </p>
        </div>

        <div className="mt-3 min-h-[132px] rounded-2xl bg-gradient-to-br from-violet-50 via-white to-[#f5f5f7] px-3 py-3">
          <div className="text-[12px] font-extrabold text-[#0071e3]">답변 예시</div>
          <p className="mt-1.5 break-keep text-[14px] font-medium leading-[1.62] text-slate-700">
            “{card.answer}”
          </p>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-solid border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      </motion.article>
    </button>
  );
}

function PreviewModal({ card, onClose }) {
  if (!card) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-[390px] rounded-[26px] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-bold text-slate-600">
              {card.badge} 차밍카드
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="미리보기 닫기"
            >
              <FiX />
            </button>
          </div>

          <h3 className="mt-4 break-keep text-[21px] font-extrabold leading-[1.34] tracking-[-0.03em] text-slate-950">
            {card.title}
          </h3>

          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-[12px] font-extrabold text-slate-500">질문</p>
            <p className="mt-1.5 break-keep text-[15px] font-bold leading-[1.5] text-slate-900">
              {card.question}
            </p>
          </div>

          <div className="mt-3 rounded-2xl bg-gradient-to-br from-violet-50 to-[#f5f5f7] px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-extrabold text-[#0071e3]">답변 예시</p>
              <HeartCount count={card.hearts} />
            </div>
            <p className="mt-2 break-keep text-[14px] font-medium leading-[1.65] text-slate-700">
              “{card.answer}”
            </p>
          </div>

          <Link
            href="/signup"
            className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-[15px] font-extrabold text-white shadow-[0_14px_28px_rgba(244,63,94,0.22)] transition hover:brightness-105"
          >
            가입하고 차밍카드 보기
            <FiArrowRight className="text-[17px]" />
          </Link>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CharmingCardPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const total = previewCards.length;

  const activeCard = useMemo(() => previewCards[activeIndex], [activeIndex]);

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [total]);

  return (
    <section className="overflow-hidden px-4 pb-6 pt-5">
      <div className="mb-4">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
          CHARMING CARD
        </p>
        <h2 className="mt-2 break-keep text-[25px] font-extrabold leading-[1.24] tracking-[-0.035em] text-slate-950">
          빠르게 만나기 전에,
          <br />
          상대를 더 면밀히 확인하세요.
        </h2>
        <p className="mt-3 break-keep text-[15px] font-medium leading-[1.65] text-slate-600">
          차밍카드는 연락, 갈등, 결혼관처럼 만나기 전 묻기 어려운 질문과 답변을 자연스럽게 확인하는 방식이에요.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[28px]">
        <div
          className="flex items-stretch transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {previewCards.map((card) => (
            <div key={card.title} className="h-full w-full shrink-0">
              <PreviewCard card={card} onClick={() => setSelectedCard(card)} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {previewCards.map((card, index) => (
            <button
              key={card.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index ? "w-6 bg-[#0071e3]" : "w-1.5 bg-slate-200"
              }`}
              aria-label={`${index + 1}번째 차밍카드 보기`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="이전 차밍카드"
          >
            <FiChevronLeft />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="다음 차밍카드"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* <button
        type="button"
        onClick={() => setSelectedCard(activeCard)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0071e3] text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] transition hover:bg-[#0077ed]"
      >
        차밍카드 미리보기
        <FiArrowRight className="text-[17px]" />
      </button> */}

      <PreviewModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </section>
  );
}
