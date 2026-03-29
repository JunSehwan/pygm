import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { FiArrowLeft, FiHeart } from "react-icons/fi";
import { db } from "firebaseConfig";

function formatCount(num) {
  return Number(num || 0).toLocaleString();
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

export default function CardAnswerReadPage() {
  const router = useRouter();
  const { cardId } = router.query;

  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);

  useEffect(() => {
    if (!router.isReady || !cardId) return;

    let mounted = true;

    async function load() {
      try {
        setLoading(true);

        const cardSnap = await getDoc(doc(db, "charmingCards", String(cardId)));
        if (cardSnap.exists() && mounted) {
          setCard({
            id: cardSnap.id,
            ...cardSnap.data(),
          });
        }

        let uid = null;

        if (typeof window !== "undefined") {
          try {
            const rawAuth = localStorage.getItem("firebase:authUser:pygmalion-96c6f:[DEFAULT]");

            if (rawAuth && rawAuth.trim()) {
              uid = JSON.parse(rawAuth)?.uid || null;
            }
          } catch (error) {
            console.error("[CardAnswerReadPage] auth parse error:", error);
            uid = null;
          }
        }

        if (uid) {
          const answerQ = query(
            collection(db, "charmingCardAnswers"),
            where("cardId", "==", String(cardId)),
            where("responderUid", "==", uid),
            limit(1)
          );

          const answerSnap = await getDocs(answerQ);
          const answerDoc = answerSnap.docs[0];

          if (answerDoc && mounted) {
            setMyAnswer({
              id: answerDoc.id,
              ...answerDoc.data(),
            });
          }
        }
      } catch (error) {
        console.error("[CardAnswerReadPage] load error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router.isReady, cardId]);

  const handleBack = () => {
    if (router.query?.from === "profile" && router.query?.tab === "charming") {
      router.push("/profile?tab=charming");
      return;
    }

    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-[430px] rounded-md bg-white px-5 py-10 text-center text-slate-400 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
          답변을 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-[430px] rounded-md bg-white px-5 py-10 text-center text-slate-400 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
          카드 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-5 pb-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[24px] font-bold tracking-[-0.03em] text-slate-900">
              차밍카드 답변관리
            </div>

            <button type="button" onClick={handleBack} className="text-slate-700">
              <FiArrowLeft className="text-[24px]" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 py-4">
          <div className="rounded-md bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-600">
                {getCardCategory(card)}
              </span>
              <span className="rounded-md bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-600">
                {getQuestionType(card)}
              </span>
            </div>

            <div className="mt-3 text-[18px] font-bold leading-7 text-slate-800">
              {card?.title || "제목 없음"}
            </div>

            <div className="mt-2 whitespace-pre-line text-[15px] leading-6 text-slate-500">
              {card?.guide || card?.body || card?.content || ""}
            </div>

            <div className="mt-3 flex items-center gap-2 text-[15px] text-slate-400">
              <span>조회 {formatCount(getViewCount(card))}</span>
              <span>·</span>
              <span>답변 {formatCount(getAnswerCount(card))}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <FiHeart className="text-[15px]" />
                {formatCount(getLikeCount(card))}
              </span>
            </div>

            <div className="mt-5 rounded-md bg-slate-50 px-4 py-4">
              <div className="text-[13px] font-semibold text-slate-500">내 답변</div>
              <div className="mt-2 whitespace-pre-line text-[15px] leading-6 text-slate-700">
                {myAnswer?.answerText || myAnswer?.content || "아직 저장된 답변이 없습니다."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}