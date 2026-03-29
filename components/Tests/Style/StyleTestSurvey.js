import React, { useRef } from "react";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { likertScale } from "./StyleTestUtils";

function LikertRow({ selectedValue, onSelect }) {
  return (
    <div className="mt-4">
      <div className="mt-3 flex items-center justify-between gap-2">
        {likertScale.map((item) => {
          const active = selectedValue === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              className="flex flex-1 flex-col items-center justify-start"
              aria-label={`${item.value}점`}
            >
              <div
                className={`${item.size} rounded-full border-[2px] border-solid transition-all duration-200 ${active
                  ? `scale-110 ${item.active}`
                  : `bg-white ${item.inactive}`
                  }`}
              />

              <div className="mt-2 h-[16px] text-[11px] font-semibold text-slate-400">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StyleTestSurvey({
  questions,
  answers,
  onAnswer,
  onBack,
}) {
  const itemRefs = useRef([]);

  const answeredCount = answers.filter(Boolean).length;
  const progress = (answeredCount / questions.length) * 100;

  const handleSelect = (index, value) => {
    onAnswer(index, value);

    const nextIndex = index + 1;
    if (nextIndex < questions.length) {
      setTimeout(() => {
        itemRefs.current[nextIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 140);
    }
  };

  return (
    <div className="relative flex h-screen min-h-screen flex-col bg-white md:h-[760px] md:min-h-[760px]">
      <div className="px-5 pt-5 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <FiArrowLeft className="text-[22px]" />
        </button>

        <div className="mb-1 flex items-center justify-between">
          <div className="text-[12px] font-light text-pink-500">
            {answeredCount} / {questions.length}
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </div>

        <h2 className="mt-2 text-[13px] font-bold leading-[1.4] text-slate-500">
          아래 문항에 솔직하게 답변해주세요
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-4">
          {questions.map((question, index) => {
            const selectedValue = answers[index];
            const isAnswered = !!selectedValue;

            return (
              <motion.div
                key={question.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.15) }}
                className={`rounded-[24px] border px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition ${isAnswered
                  ? "border-pink-200 bg-pink-50/40"
                  : "border-slate-200 bg-white"
                  }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                    Q{index + 1}
                  </div>
                  {/* <div className="text-[11px] font-bold text-slate-400">
                    가중치 {question.weight}
                  </div> */}
                </div>

                <div className="mt-3 text-[16px] font-black leading-6 tracking-[-0.02em] text-slate-900">
                  {question.text}
                </div>

                <LikertRow
                  selectedValue={selectedValue}
                  onSelect={(value) => handleSelect(index, value)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}