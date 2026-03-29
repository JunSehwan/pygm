import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

const REPORT_REASON_OPTIONS = [
  { key: "sexual", label: "불쾌한 성적 표현" },
  { key: "hate", label: "혐오/비하 발언" },
  { key: "money", label: "금전 요구/사기 의심" },
  { key: "spam", label: "스팸/광고" },
  { key: "threat", label: "폭력/위협/스토킹 느낌" },
  { key: "rude", label: "무례한 표현" },
  { key: "other", label: "기타 사유" },
];

function RadioDot({ active }) {
  return (
    <div
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition border-solid",
        active ? "border-[#7c6cff]" : "border-slate-300"
      )}
    >
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full transition",
          active ? "bg-[#7c6cff]" : "bg-transparent"
        )}
      />
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
        checked ? "bg-[#63c36b]" : "bg-slate-300"
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

export function CardAnswerReportModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const [reasonKey, setReasonKey] = useState("threat");
  const [detail, setDetail] = useState("");
  const [hideTargetContents, setHideTargetContents] = useState(true);

  useEffect(() => {
    if (!open) return;
    setReasonKey("threat");
    setDetail("");
    setHideTargetContents(true);
  }, [open]);

  const selectedReason = useMemo(() => {
    return (
      REPORT_REASON_OPTIONS.find((item) => item.key === reasonKey) ||
      REPORT_REASON_OPTIONS[0]
    );
  }, [reasonKey]);

  const canSubmit =
    !!reasonKey && (reasonKey !== "other" || detail.trim().length >= 2);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.div
            className="w-full max-w-[360px] overflow-hidden rounded-md bg-white shadow-2xl"
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="border-b border-slate-200 px-5 pb-4 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
                  신고하기
                </h3>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-300 transition hover:text-slate-500"
                  aria-label="닫기"
                >
                  <FiX className="text-[28px]" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-[15px] leading-6 text-slate-700">
                해당 신고는 익명으로 처리됩니다.
                <br />
                신고 사유를 선택해주세요.
              </p>

              <p className="mt-1 text-[12px] leading-5 text-slate-400 border-solid border-slate-200 border-b pb-2">
                (문구(악성) 허위 신고로 제재가 될 수 있습니다.)
              </p>

              <div className="mt-5 space-y-4">
                {REPORT_REASON_OPTIONS.map((item) => {
                  const active = reasonKey === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setReasonKey(item.key)}
                      className="flex w-full items-center gap-3 text-left py-2"
                    >
                      <RadioDot active={active} />
                      <span
                        className={cn(
                          "text-[16px] font-medium transition",
                          active ? "text-slate-900" : "text-slate-600"
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {reasonKey === "other" ? (
                <div className="mt-4">
                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="기타 사유를 적어주세요."
                    className="h-24 w-full resize-none rounded-md border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#cfc7ff]"
                  />
                </div>
              ) : null}

              <div className="mt-2 border-t border-slate-200 py-4 border-solid">
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    checked={hideTargetContents}
                    onChange={setHideTargetContents}
                  />
                  <span className="text-[15px] font-medium text-slate-700">
                    해당 사용자 자동 숨김 처리
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!canSubmit || submitting}
                  onClick={() =>
                    onSubmit({
                      reasonKey,
                      reasonLabel: selectedReason.label,
                      detail: detail.trim(),
                      hideTargetContents,
                    })
                  }
                  className="h-12 rounded-md bg-[#ff4b3e] text-[17px] font-bold text-white disabled:opacity-60"
                >
                  {submitting ? "처리중..." : "신고하기"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="h-12 rounded-md border border-slate-300 bg-white text-[17px] font-bold text-slate-800"
                >
                  취소
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function CardAnswerReportDoneModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.div
            className="w-full max-w-[340px] overflow-hidden rounded-md bg-white shadow-2xl"
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="px-6 py-6">
              <div className="text-[24px] font-bold tracking-[-0.03em] text-slate-900">
                신고가 접수되었습니다.
              </div>
              <div className="mt-4 whitespace-pre-line text-[15px] leading-6 text-slate-600">
                신고처리가 완료되었습니다.
                {"\n"}
                해당 내용은 검토 후,
                {"\n"}
                빠른 시간내에 처리됩니다.
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={onClose}
                className="h-12 w-full rounded-md bg-[#ff4338] text-[16px] font-bold text-white"
              >
                완료
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}