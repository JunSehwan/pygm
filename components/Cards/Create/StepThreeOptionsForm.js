import React from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function StepThreeOptionsForm({
  options,
  errors,
  minOptions,
  maxOptions,
  maxOptionLength,
  onChangeOption,
  onAddOption,
  onRemoveOption,
}) {
  return (
    <div className="mx-auto max-w-full">
      <div className="rounded-[18px] border border-zinc-200 bg-white px-4 py-5">
        <div className="mb-5">
          <div className="text-[22px] font-semibold tracking-[-0.03em] text-charming-ink">
            어떤 답변을 원하세요?
          </div>
          <p className="mt-2 text-[14px] leading-6 text-zinc-600">
            남성 회원이 선택할 보기를 작성해주세요.
          </p>
        </div>

        <div className="space-y-5">
          {options.map((option, index) => (
            <div key={`option-${index}`}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div className="text-[16px] font-semibold tracking-[-0.02em] text-charming-ink">
                  보기 {index + 1}
                </div>
                <div className="text-[12px] font-medium text-zinc-400">
                  {option.length}/{maxOptionLength}자
                </div>
              </div>

              <input
                value={option}
                onChange={(e) =>
                  onChangeOption(index, e.target.value.slice(0, maxOptionLength))
                }
                className="h-[56px] w-full rounded-md border border-zinc-200 bg-white px-4 text-[16px] text-charming-ink outline-none transition focus:border-charming-lavender"
              />

              {errors[`option_${index}`] ? (
                <div className="mt-2 text-[13px] leading-5 text-red-500">
                  {errors[`option_${index}`]}
                </div>
              ) : (
                <div className="mt-2 min-h-[4px]" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onRemoveOption}
            className={cn(
              "flex h-[50px] w-[50px] items-center justify-center rounded-md text-white transition",
              options.length <= minOptions
                ? "bg-zinc-300"
                : "bg-zinc-400 hover:bg-zinc-500"
            )}
          >
            <FiMinus className="text-[24px]" />
          </button>

          <button
            type="button"
            onClick={onAddOption}
            className={cn(
              "flex h-[50px] w-[50px] items-center justify-center rounded-md text-white transition",
              options.length >= maxOptions
                ? "bg-charming-primary/40"
                : "bg-charming-primary hover:bg-charming-primaryDeep"
            )}
          >
            <FiPlus className="text-[24px]" />
          </button>
        </div>
      </div>
    </div>
  );
}