import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowLeft, FiHeart } from "react-icons/fi";
import { RiEmotionUnhappyLine } from "react-icons/ri";

function getCardTitle(card) {
  return card?.title || "제목 없음";
}

function getCardBody(card) {
  return card?.guide || card?.body || card?.content || "";
}

function getCardCategory(card) {
  return (
    card?.categoryLabel ||
    card?.category ||
    card?.cardCategory ||
    "카테고리 태그"
  );
}

function getQuestionType(card) {
  if (card?.questionType === "objective") return "선택형";
  if (card?.questionType === "multiple") return "선택형";
  if (card?.questionType === "subjective") return "작성형";
  if (card?.questionType === "choice") return "선택형";
  if (card?.questionType === "text") return "작성형";
  return "선택형/작성형";
}

function getViewCount(card) {
  return Number(card?.viewCount || card?.views || 0);
}

function getAnswerCount(card) {
  return Number(card?.answerCount || card?.answersCount || card?.reactionCount || 0);
}

function getLikeCount(card) {
  return Number(
    card?.interestedCount ||
    card?.likeCount ||
    card?.likes ||
    card?.heartCount ||
    0
  );
}

function formatCount(num) {
  return Number(num || 0).toLocaleString();
}

function ChoiceAnswerBlock({ item }) {
  const selectedIndex =
    typeof item?.selectedOptionIndex === "number"
      ? item.selectedOptionIndex
      : null;

  const selectedText = item?.selectedOptionText || "";
  const options = Array.isArray(item?.options) ? item.options : [];

  return (
    <div>
      <div className="mb-2 text-[14px] font-semibold text-slate-700">내 답변</div>

      {selectedText ? (
        <div className="mb-3 rounded-md bg-violet-50 px-4 py-4 text-[15px] leading-6 text-violet-700">
          {selectedText}
        </div>
      ) : null}

      <div className="space-y-2">
        {options.map((option, index) => {
          const active =
            selectedIndex === index ||
            (!!selectedText && selectedText === option);

          return (
            <div
              key={`${item?.id || "card"}-option-${index}`}
              className={
                active
                  ? "rounded-md border border-violet-300 bg-violet-50 px-4 py-4 text-[15px] leading-6 text-violet-700"
                  : "rounded-md border border-slate-200 bg-white px-4 py-4 text-[15px] leading-6 text-slate-500"
              }
            >
              {option}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextAnswerBlock({ text }) {
  return (
    <div>
      <div className="mb-2 text-[14px] font-semibold text-slate-700">내 답변</div>
      <div className="whitespace-pre-line rounded-md bg-violet-50 px-4 py-4 text-[15px] leading-7 text-violet-700">
        {text || "답변 없음"}
      </div>
    </div>
  );
}

export default function CharmingAnswerReadModal({
  open,
  item,
  onClose,
}) {
  const isChoiceQuestion =
    item?.questionType === "choice" ||
    item?.questionType === "objective" ||
    item?.questionType === "multiple";

  return (
    <AnimatePresence>
      {open && item ? (
        <motion.div
          className="fixed inset-0 z-[13000] bg-black/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="mx-auto flex h-full w-full max-w-[430px] items-center justify-center">
            <motion.div
              className="flex h-[92vh] w-full flex-col overflow-hidden rounded-md bg-slate-50 shadow-2xl"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 border-b border-slate-200 bg-white px-5 pb-4 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[24px] font-bold tracking-[-0.03em] text-slate-900">
                    차밍카드 답변관리
                  </div>

                  <button type="button" onClick={onClose} className="text-slate-700">
                    <FiArrowLeft className="text-[24px]" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 px-4 py-4">
                <div className="space-y-4">
                  <div className="rounded-md bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-600">
                        {getCardCategory(item)}
                      </span>
                      <span className="rounded-md bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-600">
                        {getQuestionType(item)}
                      </span>
                    </div>

                    <div className="mt-3 text-[18px] font-bold leading-7 text-slate-800">
                      {getCardTitle(item)}
                    </div>

                    <div className="mt-2 whitespace-pre-line text-[15px] leading-6 text-slate-500">
                      {getCardBody(item)}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[14px] text-slate-400">
                      <span>조회 {formatCount(getViewCount(item))}</span>
                      <span>답변 {formatCount(getAnswerCount(item))}</span>
                      <span>좋아요 {formatCount(getLikeCount(item))}</span>
                    </div>
                  </div>

                  <div className="rounded-md bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
                    <div className="mb-3 text-[14px] font-semibold text-slate-700">
                      내 답변 반응
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-pink-50 px-4 py-4">
                        <div className="flex items-center gap-2 text-pink-600">
                          <FiHeart className="text-[18px]" />
                          <span className="text-[14px] font-semibold">심쿵</span>
                        </div>
                        <div className="mt-2 text-[22px] font-bold text-pink-600">
                          {formatCount(item?.likeReceivedCount || 0)}
                        </div>
                      </div>

                      <div className="rounded-md bg-slate-200/70 px-4 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <RiEmotionUnhappyLine className="text-[18px]" />
                          <span className="text-[14px] font-semibold">읽씹각</span>
                        </div>
                        <div className="mt-2 text-[22px] font-bold text-slate-700">
                          {formatCount(item?.dislikeReceivedCount || 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
                    {isChoiceQuestion ? (
                      <ChoiceAnswerBlock item={item} />
                    ) : (
                      <TextAnswerBlock text={item?.myAnswerText || item?.answerText || ""} />
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-12 w-full rounded-md bg-violet-500 text-[16px] font-bold text-white"
                >
                  확인
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full text-center text-[15px] font-medium text-slate-400"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}