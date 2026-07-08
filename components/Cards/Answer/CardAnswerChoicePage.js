import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import {
  FiCheck,
  FiEye,
  FiHeart,
  FiMessageCircle,
} from "react-icons/fi";

import { db } from "firebaseConfig";
import CardAnswerConfirmModal from "./CardAnswerConfirmModal";
import CardAnswerCompleteModal from "./CardAnswerCompleteModal";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function CardAnswerChoicePage({
  card,
  cardOrder,
  categoryLabel,
  alreadyAnswered,
  previousAnswer,
  user,
}) {
  const router = useRouter();

  const handleBackToOrigin = () => {
    if (router.query?.from === "profile" && router.query?.tab === "charming") {
      router.push("/profile?tab=charming");
      return;
    }

    router.push("/cards/list");
  };

  const scrollRef = useRef(null);
  const lastScrollTopRef = useRef(0);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  useEffect(() => {
    if (
      alreadyAnswered &&
      typeof previousAnswer?.selectedOptionIndex === "number"
    ) {
      setSelectedIndex(previousAnswer.selectedOptionIndex);
    }
  }, [alreadyAnswered, previousAnswer]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const currentTop = el.scrollTop;
      const prevTop = lastScrollTopRef.current;
      const maxScrollTop = el.scrollHeight - el.clientHeight;

      if (Math.abs(currentTop - prevTop) < 6) return;

      if (currentTop <= 8 || currentTop >= maxScrollTop - 8) {
        lastScrollTopRef.current = currentTop;
        return;
      }

      if (currentTop > prevTop && currentTop > 20) {
        setShowStats(false);
      }

      if (currentTop < prevTop) {
        setShowStats(true);
      }

      lastScrollTopRef.current = currentTop;
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const selectedOptionText = useMemo(() => {
    if (selectedIndex === null || selectedIndex === undefined) return "";
    return card.options?.[selectedIndex] || "";
  }, [card.options, selectedIndex]);

  const handleSelect = (index) => {
    if (alreadyAnswered) return;
    setSelectedIndex(index);
    if (error) setError("");
  };

  const handleOpenConfirm = () => {
    if (alreadyAnswered) {
      setError("이미 답변을 완료한 카드예요.");
      return;
    }

    if (selectedIndex === null || selectedIndex === undefined) {
      setError("보기를 하나 선택해주세요.");
      return;
    }

    setConfirmOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await addDoc(collection(db, "charmingCardAnswers"), {
        cardId: card.id,
        answererUid: user.userID,
        answererUsername: user.username || "",
        answererNickname: user.nickname || "",
        answererGender: user.gender || "",
        questionType: card.questionType,
        selectedOptionIndex: selectedIndex,
        selectedOptionText,
        creatorUid: card.creatorUid || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "charmingCards", card.id), {
        answerCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      if (user?.userID) {
        await updateDoc(doc(db, "users", user.userID), {
          charmingCardAnsweredIds: arrayUnion(card.id),
        });
      }

      if (card?.creatorUid) {
        await addDoc(collection(db, "notifications"), {
          type: "charming_card_answer_arrived",
          targetUid: card.creatorUid,
          actorUid: user.userID,
          actorNickname: user.nickname || "회원",
          cardId: card.id,
          cardTitle: card.title || "",
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }

      setConfirmOpen(false);
      setCompleteOpen(true);
    } catch (saveError) {
      console.error("[CardAnswerChoicePage] save error:", saveError);
      setError("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50">
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 pb-4 pt-5">
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-medium text-slate-400">
              {cardOrder ? `${cardOrder.toLocaleString()}번째 카드` : "카드"}
            </div>

            <div className="rounded-md bg-[#ff4338] px-3 py-1.5 text-[12px] font-semibold text-white">
              {categoryLabel}
            </div>
          </div>

          <h1 className="mt-5 text-[20px] font-semibold leading-tight tracking-[-0.03em] text-slate-900">
            가장 가까운 답변을 골라주세요.
          </h1>

          <p className="mt-3 whitespace-pre-line text-[14px] leading-6 text-slate-600">
            정답처럼 보이는 답보다
            {"\n"}
            실제 내 생각에 가까운 선택이 더 중요해요.
          </p>

          <motion.div
            initial={false}
            animate={showStats ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-4 origin-top"
            style={{ pointerEvents: showStats ? "auto" : "none" }}
          >
            <div className="font-bold flex items-center gap-4 text-[13px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiEye className="text-[16px]" />
                {card.views || 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiMessageCircle className="text-[16px]" />
                {card.answerCount || 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiHeart className="text-[16px]" />
                {card.interestedCount || 0}
              </span>
            </div>
          </motion.div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-3 pb-3 pt-4">
            <div className="space-y-3">
              <div>
                <div className="mb-2 text-[14px] font-medium text-violet-700">
                  질문 제목
                </div>
                <div className="font-bold rounded-md bg-slate-100 px-4 py-4 text-[15px] leading-6 text-slate-700">
                  {card.title}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[14px] font-medium text-violet-700">
                  질문 내용
                </div>
                <div className="rounded-md bg-slate-100 px-4 py-4 text-[15px] leading-6 text-slate-700">
                  {card.body}
                </div>
              </div>

              {!!card.guide ? (
                <div>
                  <div className="mb-2 text-[14px] font-medium text-violet-700">
                    부가설명
                  </div>
                  <div className="rounded-md bg-slate-100 px-4 py-4 text-[15px] leading-6 text-slate-700">
                    {card.guide}
                  </div>
                </div>
              ) : null}

              <div
                className={cn(
                  "rounded-md border bg-white shadow-[0_1px_8px_rgba(15,23,42,0.04)]",
                  alreadyAnswered ? "border-slate-200" : "border-violet-300"
                )}
              >
                <div className="border-b border-solid border-slate-100 px-4 py-4 text-[16px] font-semibold text-slate-900">
                  보기 선택하기
                </div>

                <div className="space-y-2 px-4 pb-4 pt-3">
                  {(card.options || []).map((option, index) => {
                    const active = selectedIndex === index;

                    return (
                      <button
                        key={`${card.id}-option-${index}`}
                        type="button"
                        onClick={() => handleSelect(index)}
                        disabled={alreadyAnswered}
                        className={cn(
                          "w-full rounded-md border px-4 py-4 text-left transition",
                          active
                            ? "border-violet-300 bg-violet-50"
                            : "border-slate-200 bg-white",
                          alreadyAnswered ? "cursor-not-allowed" : "hover:border-violet-200"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-solid transition",
                              active ? "border-violet-400" : "border-slate-400"
                            )}
                          >
                            <span
                              className={cn(
                                "h-2.5 w-2.5 rounded-full transition",
                                active ? "bg-violet-400" : "bg-transparent"
                              )}
                            />
                          </span>

                          <div className="min-w-0 text-[15px] leading-6 text-slate-700">
                            {option}
                          </div>

                          {alreadyAnswered && active ? (
                            <FiCheck className="mt-[2px] shrink-0 text-[16px] text-green-500" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 pb-4">
                  <div className="min-h-[20px] text-[13px] leading-5 text-red-500">
                    {error || ""}
                  </div>

                  {alreadyAnswered ? (
                    <div className="mt-2 text-[13px] font-medium text-slate-500">
                      이미 작성하신 답변입니다.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-2">
            {alreadyAnswered ?
              <button
                type="button"
                onClick={handleBackToOrigin}
                className="h-[58px] bg-white text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                돌아가기
              </button>
              :
              <button
                type="button"
                onClick={handleBackToOrigin}
                className="h-[58px] bg-white text-[15px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                다음에 작성하기
              </button>
            }
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={saving || alreadyAnswered}
              className={cn(
                "h-[58px] text-[16px] font-semibold text-white transition",
                saving || alreadyAnswered ? "bg-slate-400" : "bg-violet-600 hover:bg-violet-700"
              )}
            >
              작성완료
            </button>
          </div>
        </div>
      </div>

      <CardAnswerConfirmModal
        open={confirmOpen}
        title="작성을 완료할까요?"
        desc={
          "작성 후 수정이 불가하오니 신중하게 입력해주시기 바랍니다.\n\n지금 선택한 답변을 제출하면 상대방에게 전달될 준비가 됩니다."
        }
        cancelText="다음에"
        confirmText={saving ? "저장중..." : "확인하기"}
        onCancel={() => {
          if (saving) return;
          setConfirmOpen(false);
        }}
        onConfirm={handleSave}
      />

      <CardAnswerCompleteModal
        open={completeOpen}
        title="작성 완료"
        desc={
          "작성이 완료되었습니다.\n선택한 답변은 내 프로필에서 확인이 가능합니다."
        }
        confirmText="확인"
        onConfirm={() => {
          setCompleteOpen(false);
          handleBackToOrigin();
        }}
      />
    </>
  );
}