import React from "react";
import ChoiceRadioCard from "./ChoiceRadioCard";

export default function StepOneTypeCategory({
  form,
  cardTypeOptions,
  categoryOptions,
  onChange,
}) {
  return (
    <div className="mx-auto max-w-full space-y-4">
      <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
        <div className="mb-4">
          <div className="text-[20px] font-semibold tracking-[-0.03em] text-slate-800">
            차밍카드 제작하기
          </div>
          <p className="mt-2 text-[15px] leading-6 text-slate-600">
            미리 알고 싶은 질문을 카드로 만들고,
            <br />
            답변이 오면 내용을 보고 상대를 확인할 수 있어요.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {cardTypeOptions.map((item) => (
            <ChoiceRadioCard
              key={item.value}
              active={form.questionType === item.value}
              title={item.label}
              desc={item.desc}
              compact
              onClick={() => onChange("questionType", item.value)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
        <div className="mb-3 text-[16px] font-semibold tracking-[-0.02em] text-slate-700">
          질문 카테고리
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categoryOptions.map((item) => (
            <ChoiceRadioCard
              key={item.value}
              active={form.category === item.value}
              title={item.label}
              compact
              onClick={() => onChange("category", item.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}