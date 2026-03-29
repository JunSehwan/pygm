import React, { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import FloatingField from "./FloatingField";

export default function StepTwoQuestionForm({
  form,
  errors,
  refs,
  onChange,
  maxTitleLength,
  maxBodyLength,
  maxGuideLength,
  exampleText,
}) {
  const [guideOpen, setGuideOpen] = useState(false);

  const guideItems = [
    { label: "제목", value: exampleText.title },
    { label: "본문", value: exampleText.body },
    { label: "보조설명", value: exampleText.subbody },
    { label: "가이드", value: exampleText.guide },
  ];

  return (
    <div className="w-full space-y-2">
      <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
        <button
          type="button"
          onClick={() => setGuideOpen((prev) => !prev)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-semibold text-slate-700">
              작성 가이드
            </div>
            <div className="rounded-md bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600">
              예시
            </div>
          </div>

          <motion.div
            animate={{ rotate: guideOpen ? 180 : 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="text-slate-500"
          >
            <FiChevronDown className="text-[20px]" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {guideOpen ? (
            <motion.div
              key="guide-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] },
                opacity: { duration: 0.2, ease: "easeOut" },
              }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ y: -6 }}
                animate={{ y: 0 }}
                exit={{ y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mt-4 space-y-3 border-t border-slate-100 pt-4"
              >
                {guideItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="mt-[8px] h-2 w-2 shrink-0 rounded-full bg-violet-300" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-slate-700">
                        {item.label}
                      </div>
                      <p className="mt-1 text-[14px] leading-5 text-slate-500">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
        <div className="space-y-2">
          <FloatingField
            label="질문 제목"
            value={form.title}
            onChange={(e) => onChange("title", e.target.value.slice(0, maxTitleLength))}
            maxLength={maxTitleLength}
            error={errors.title}
            inputRef={refs.titleRef}
            required
          />

          <FloatingField
            label="질문 내용"
            value={form.body}
            onChange={(e) => onChange("body", e.target.value.slice(0, maxBodyLength))}
            maxLength={maxBodyLength}
            multiline
            rows={6}
            error={errors.body}
            inputRef={refs.bodyRef}
            required
          />

          <FloatingField
            label="보조 설명 (선택)"
            value={form.guide}
            onChange={(e) => onChange("guide", e.target.value.slice(0, maxGuideLength))}
            maxLength={maxGuideLength}
            multiline
            rows={4}
            error={errors.guide}
            inputRef={refs.guideRef}
          />
        </div>
      </div>
    </div>
  );
}