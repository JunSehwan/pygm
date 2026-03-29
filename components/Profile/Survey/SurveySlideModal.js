import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import {
  buildSurveyPatch,
  getFieldValue,
  getQuestionAnsweredCount,
  sanitizeMultiArray,
} from "./SurveyConfig";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function getFieldKey(field = {}) {
  return field?.key || field?.field || "";
}

function isMbtiField(field = {}) {
  return field?.type === "mbti" || getFieldKey(field) === "mbti";
}

function InlineToast({ open, message }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="absolute left-1/2 top-4 z-[130] -translate-x-1/2"
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="rounded-full border border-black/10 bg-black px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
            {message}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MbtiCard({ value, onChange }) {
  const current = value && typeof value === "object" ? value : {};

  const groups = [
    { key: "ei", title: "에너지 방향", options: ["E", "I"] },
    { key: "sn", title: "인식 방식", options: ["S", "N"] },
    { key: "tf", title: "판단 방식", options: ["T", "F"] },
    { key: "jp", title: "생활 방식", options: ["J", "P"] },
  ];

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
      <div className="mb-2 text-[16px] font-bold leading-6 text-slate-800">
        MBTI를 선택해주세요
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((group) => {
          const selected = current?.[group.key] || "";

          return (
            <div key={group.key}>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((option) => {
                  const active = selected === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...current,
                          [group.key]: option,
                        })
                      }
                      className={cn(
                        "rounded-md border border-solid px-3 py-3 text-center text-[13px] font-medium transition",
                        active
                          ? "border-violet-300 bg-violet-50 text-violet-700"
                          : "border-slate-200 bg-white text-slate-600"
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionCard({
  questionNumber,
  total,
  field,
  value,
  onChange,
  onLimitExceeded,
  innerRef,
}) {
  const isChipMode = field.type === "multi_chip";
  const isMbtiMode = isMbtiField(field);
  const maxSelect = field.maxSelect || 999;
  const options = Array.isArray(field?.options) ? field.options : [];

  const toggleChip = (option) => {
    const prev = sanitizeMultiArray(value);
    const exists = prev.includes(option);

    if (exists) {
      onChange(prev.filter((item) => item !== option));
      return;
    }

    if (prev.length >= maxSelect) {
      onLimitExceeded?.(`${maxSelect}개까지 선택해주세요.`);
      return;
    }

    onChange([...prev, option]);
  };

  return (
    <div
      ref={innerRef}
      className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]"
    >
      <div className="mb-2 text-[12px] font-semibold text-violet-500">
        질문 {questionNumber} / {total}
      </div>

      {isMbtiMode ? (
        <MbtiCard value={value} onChange={onChange} />
      ) : (
        <>
          <div className="text-[16px] font-bold leading-6 text-slate-800">
            {field.title}
          </div>

          {isChipMode ? (
            <>
              <div className="mt-2 text-[12px] font-medium text-slate-400">
                최대 {maxSelect}개까지 선택 가능
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {options.map((option) => {
                  const sanitized = sanitizeMultiArray(value);
                  const active = sanitized.includes(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleChip(option)}
                      className={cn(
                        "rounded-full border border-solid px-3 py-2 text-[11px] font-semibold leading-4 transition",
                        active
                          ? "border-violet-300 bg-violet-50 text-violet-700"
                          : "border-slate-200 bg-white text-slate-600"
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </>
          ) : options.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {options.map((option, idx) => {
                const selected = value === String(idx + 1);

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onChange(String(idx + 1))}
                    className={cn(
                      "rounded-md border border-solid px-3 py-3 text-left text-[13px] font-medium transition",
                      selected
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-600"
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-[13px] font-semibold text-amber-700">
                선택지가 아직 연결되지 않았어요.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SurveySlideModal({
  open,
  section,
  user,
  onClose,
  onSave,
  saving = false,
}) {
  const [draft, setDraft] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: "",
  });

  const questionRefs = useRef([]);

  useEffect(() => {
    if (!open || !section) return;

    const next = {};
    section.fields.forEach((field) => {
      const fieldKey = getFieldKey(field);
      if (!fieldKey) return;
      next[fieldKey] = getFieldValue(user, field);
    });
    setDraft(next);
  }, [open, section, user]);

  useEffect(() => {
    if (!toast.open) return;

    const timer = setTimeout(() => {
      setToast({ open: false, message: "" });
    }, 1700);

    return () => clearTimeout(timer);
  }, [toast]);

  const answeredCount = useMemo(() => {
    if (!section) return 0;
    return getQuestionAnsweredCount(draft, section);
  }, [draft, section]);

  const isAnsweredValue = (field, value) => {
    if (field.type === "multi_chip") {
      return sanitizeMultiArray(value).length > 0;
    }

    if (isMbtiField(field)) {
      return !!(
        String(value?.ei || "").trim() &&
        String(value?.sn || "").trim() &&
        String(value?.tf || "").trim() &&
        String(value?.jp || "").trim()
      );
    }

    return !!String(value || "").trim();
  };

  const focusQuestionByIndex = (targetIndex) => {
    const node = questionRefs.current[targetIndex];
    if (!node) return;

    node.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const moveToNextUnanswered = (currentIndex, nextDraft) => {
    if (!section?.fields?.length) return;

    const fields = section.fields;

    for (let i = currentIndex + 1; i < fields.length; i += 1) {
      const field = fields[i];
      const fieldKey = getFieldKey(field);
      if (!isAnsweredValue(field, nextDraft[fieldKey])) {
        focusQuestionByIndex(i);
        return;
      }
    }

    for (let i = 0; i < currentIndex; i += 1) {
      const field = fields[i];
      const fieldKey = getFieldKey(field);
      if (!isAnsweredValue(field, nextDraft[fieldKey])) {
        focusQuestionByIndex(i);
        return;
      }
    }
  };

  const isMbtiCompleted = (value) => {
    return !!(
      String(value?.ei || "").trim() &&
      String(value?.sn || "").trim() &&
      String(value?.tf || "").trim() &&
      String(value?.jp || "").trim()
    );
  };

  const handleFieldChange = (field, index, nextValue) => {
    const fieldKey = getFieldKey(field);

    setDraft((prev) => {
      const nextDraft = {
        ...prev,
        [fieldKey]: nextValue,
      };

      const shouldAutoMove =
        field.type !== "multi_chip" &&
        (isMbtiField(field) ? isMbtiCompleted(nextDraft[fieldKey]) : true);

      if (shouldAutoMove) {
        setTimeout(() => {
          moveToNextUnanswered(index, nextDraft);
        }, 80);
      }

      return nextDraft;
    });
  };

  if (!section) return null;

  return (
    <>
      <InlineToast open={toast.open} message={toast.message} />

      <AnimatePresence>
        {open ? (
          <motion.div
            className="absolute inset-0 z-[120] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-slate-50 shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 border-b border-slate-200 bg-white px-5 pb-4 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">
                      {section.title}
                    </div>
                    <div className="mt-1 text-[13px] text-slate-500">
                      {answeredCount} / {section.fields.length}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                  >
                    <FiArrowLeft className="text-[18px]" />
                  </button>
                </div>

                {section.description ? (
                  <p className="mt-3 whitespace-pre-line text-[14px] leading-6 text-slate-500">
                    {section.description}
                  </p>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-3">
                  {section.fields.map((field, index) => (
                    <QuestionCard
                      key={getFieldKey(field)}
                      innerRef={(el) => {
                        questionRefs.current[index] = el;
                      }}
                      questionNumber={index + 1}
                      total={section.fields.length}
                      field={field}
                      value={draft[getFieldKey(field)]}
                      onChange={(nextValue) => handleFieldChange(field, index, nextValue)}
                      onLimitExceeded={(message) =>
                        setToast({
                          open: true,
                          message,
                        })
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onSave(buildSurveyPatch(section, draft))}
                  className="h-12 w-full rounded-md bg-violet-500 text-[16px] font-bold text-white disabled:opacity-60"
                >
                  {saving ? "저장중..." : "저장하기"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="my-3 w-full text-center text-[15px] font-medium text-slate-400"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}