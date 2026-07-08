import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PiArrowLeft } from "react-icons/pi";

function ModalFrame({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="absolute inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            className="absolute inset-x-0 bottom-0 z-50 flex max-h-[84%] flex-col rounded-t-[18px] bg-white shadow-[0_-18px_60px_rgba(15,23,42,0.18)]"
          >
            <div className="shrink-0 border-b border-slate-200">
              <div className="flex h-[58px] items-center justify-between px-4">
                <div className="text-[17px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  {title}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-slate-100"
                  style={{ cursor: "pointer" }}
                >
                  <PiArrowLeft className="text-[20px]" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function getAnswerLabel(item) {
  if (item?.answerText) return item.answerText;
  if (item?.selectedOptionText) return item.selectedOptionText;
  return "답변 정보가 없어요.";
}

export default function ArenaCharmingCardModal({
  open,
  onClose,
  items = [],
  loading = false,
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) setIndex(0);
  }, [open]);

  const current = useMemo(() => items[index] || null, [items, index]);

  const movePrev = () => {
    if (!items.length) return;
    setIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const moveNext = () => {
    if (!items.length) return;
    setIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  return (
    <ModalFrame
      open={open}
      onClose={onClose}
      title={items.length ? `차밍카드 #${index + 1}/${items.length}` : "차밍카드"}
    >
      {loading ? (
        <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-[13px] text-slate-500">
          차밍카드를 불러오는 중...
        </div>
      ) : !current ? (
        <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-5 text-center text-[13px] text-slate-500">
          아직 확인할 수 있는 차밍카드 답변이 없어요.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-slate-500">
            <span>조회 {Number(current?.viewCount || 0).toLocaleString()}</span>
            <span>·</span>
            <span>답변 {Number(current?.answerCount || 0).toLocaleString()}</span>
            <span>·</span>
            <span>좋아요 {Number(current?.interestedCount || 0).toLocaleString()}</span>
            {current?.categoryTag ? (
              <>
                <span>·</span>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                  {current.categoryTag}
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-2 text-[14px] font-bold text-zinc-900">질문 제목</div>
              <div className="rounded-md bg-slate-100 px-4 py-3 text-[14px] font-medium text-zinc-800">
                {current?.title || "제목 없음"}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[14px] font-bold text-zinc-900">질문 내용</div>
              <div className="rounded-md bg-slate-100 px-4 py-3 text-[14px] leading-6 text-zinc-800">
                {current?.guide || current?.content || "질문 내용 없음"}
              </div>
            </div>

            {current?.subGuide ? (
              <div>
                <div className="mb-2 text-[14px] font-bold text-zinc-900">부가설명</div>
                <div className="rounded-md bg-slate-100 px-4 py-3 text-[14px] leading-6 text-zinc-800">
                  {current.subGuide}
                </div>
              </div>
            ) : null}

            <div>
              <div className="mb-2 text-[14px] font-bold text-zinc-900">답변</div>
              {current?.questionType === "choice" && Array.isArray(current?.options) ? (
                <div className="space-y-2">
                  {current.options.map((option, optionIndex) => {
                    const active = current.selectedOptionIndex === optionIndex;

                    return (
                      <div
                        key={`${current.id}-option-${optionIndex}`}
                        className={`flex items-center gap-3 rounded-md px-4 py-4 ${active ? "bg-violet-200" : "bg-slate-100"
                          }`}
                      >
                        <span
                          className={`h-[22px] w-[22px] rounded-full border-solid border-2 ${active
                              ? "border-violet-500 bg-violet-100"
                              : "border-slate-300 bg-white"
                            }`}
                        />
                        <span className="text-[15px] font-semibold text-zinc-800">
                          {option}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md bg-slate-100 px-4 py-3 text-[14px] leading-6 text-zinc-800">
                  {getAnswerLabel(current)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center border-t border-slate-200 pt-4 gap-2">
            <button
              type="button"
              onClick={movePrev}
              className="flex-1 text-[18px] text-center font-medium text-slate-600 h-[58px] bg-slate-100"
              style={{ cursor: "pointer" }}
            >
              이전
            </button>

            <button
              type="button"
              onClick={moveNext}
              className="flex h-[58px] min-w-[180px] items-center justify-center bg-black text-[18px] font-bold text-white"
              style={{ cursor: "pointer" }}
            >
              다음
            </button>
          </div>
        </>
      )}
    </ModalFrame>
  );
}