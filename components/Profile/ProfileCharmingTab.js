import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiCheck, FiHeart, FiMessageCircle, FiEye } from "react-icons/fi";
import { RiEmotionUnhappyLine } from "react-icons/ri";
import { PiPencilSimpleLineBold } from "react-icons/pi";
import { db } from "firebaseConfig";
import CharmingAnswerReadModal from "./CharmingAnswerReadModal";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

const FEMALE_FILTERS = [
  { key: "latest", label: "최신순" },
  { key: "pending", label: "승인대기" },
  { key: "published", label: "배포중" },
  { key: "answers", label: "답변순" },
  { key: "likes", label: "좋아요 순" },
];

const MALE_FILTERS = [
  { key: "latest", label: "최신순" },
  { key: "answers", label: "답변순" },
  { key: "likes", label: "좋아요 순" },
];

const EDIT_ROUTE = "/cards/create";
const CREATE_ROUTE = "/cards/create";

function getTimestampValue(ts) {
  if (!ts) return 0;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts === "number") return ts;
  return 0;
}

function getCardTitle(card) {
  return card?.title || "제목 없음";
}

function getCardBody(card) {
  return card?.guide || card?.content || card?.body || "";
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

function isApprovedCard(card) {
  if (card?.status === "approved") return true;
  if (card?.status === "published") return true;
  if (card?.status === "active") return true;
  if (card?.isPublished === true) return true;
  return false;
}

function getStatusLabel(card) {
  if (isApprovedCard(card)) return "배포중";
  if (card?.status === "rejected") return "반려";
  return "승인대기";
}

function sortCards(items, sortKey) {
  const copied = [...items];

  if (sortKey === "answers") {
    return copied.sort((a, b) => getAnswerCount(b) - getAnswerCount(a));
  }

  if (sortKey === "likes") {
    return copied.sort((a, b) => getLikeCount(b) - getLikeCount(a));
  }

  if (sortKey === "published") {
    return copied
      .filter((item) => isApprovedCard(item))
      .sort(
        (a, b) =>
          getTimestampValue(b.updatedAt || b.createdAt) -
          getTimestampValue(a.updatedAt || a.createdAt)
      );
  }

  if (sortKey === "pending") {
    return copied
      .filter((item) => !isApprovedCard(item))
      .sort(
        (a, b) =>
          getTimestampValue(b.updatedAt || b.createdAt) -
          getTimestampValue(a.updatedAt || a.createdAt)
      );
  }

  return copied.sort(
    (a, b) =>
      getTimestampValue(b.updatedAt || b.createdAt) -
      getTimestampValue(a.updatedAt || a.createdAt)
  );
}

function formatCount(num) {
  return Number(num || 0).toLocaleString();
}

function UsageBanner({ user, isFemale }) {
  const answerRemain = user?.dailyAnswerViewRemaining ?? user?.todayAnswerViewRemaining;
  const answerLimit = user?.dailyAnswerViewLimit ?? user?.todayAnswerViewLimit;
  const profileRemain = user?.dailyProfileViewRemaining ?? user?.todayProfileViewRemaining;
  const profileLimit = user?.dailyProfileViewLimit ?? user?.todayProfileViewLimit;

  if (
    answerRemain === undefined &&
    answerLimit === undefined &&
    profileRemain === undefined &&
    profileLimit === undefined
  ) {
    return null;
  }

  return (
    <div className="rounded-md bg-violet-50 px-4 py-3 text-[13px] font-medium leading-5 text-violet-700">
      {(answerRemain !== undefined || answerLimit !== undefined) && (
        <div>
          투데이 차밍카드 답변 조회 가능 :
          {" "}
          {answerRemain ?? 0}/{answerLimit ?? 0}
        </div>
      )}

      {(profileRemain !== undefined || profileLimit !== undefined) && isFemale && (
        <div className="mt-1">
          투데이 프로필 조회 가능 :
          {" "}
          {profileRemain ?? 0}/{profileLimit ?? 0}
        </div>
      )}
    </div>
  );
}

function FemaleCreateAction({ onClick }) {
  return (
    <div className="px-3 pt-3">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 px-4 py-3 text-[15px] font-semibold text-white shadow-sm transition active:scale-[0.99]"
      >
        <PiPencilSimpleLineBold className="text-[18px]" />
        <span className="break-keep">
          차밍카드 작성하기
        </span>
      </button>
    </div>
  );
}

function FilterBar({ filters, activeFilter, setActiveFilter }) {
  return (
    <div className="border-b border-slate-200 px-4 py-3">
      <div className="flex flex-wrap gap-1">
        {filters.map((item) => {
          const active = activeFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (active) return;
                setActiveFilter(item.key);
              }}
              className={cn(
                "rounded-full border border-solid px-3 py-2 text-[12px] font-medium transition",
                active
                  ? "cursor-default border-violet-600 bg-violet-600 text-white"
                  : "cursor-pointer border-slate-300 bg-white text-slate-600"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CardBaseMeta({ card }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[14px] text-slate-400">
      <span className="inline-flex items-center gap-1">
        <FiEye className="text-[14px]" />
        조회 {formatCount(getViewCount(card))}
      </span>
      <span className="inline-flex items-center gap-1">
        <FiMessageCircle className="text-[14px]" />
        답변 {formatCount(getAnswerCount(card))}
      </span>
      <span className="inline-flex items-center gap-1">
        <FiHeart className="text-[14px]" />
        좋아요 {formatCount(getLikeCount(card))}
      </span>
    </div>
  );
}

function AnswerReactionSummary({ item }) {
  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mb-2 text-[12px] font-semibold text-slate-500">
        내 답변 반응
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-pink-50 px-3 py-3">
          <div className="flex items-center gap-1.5 text-pink-600">
            <FiHeart className="text-[15px]" />
            <span className="text-[12px] font-semibold">심쿵</span>
          </div>
          <div className="mt-1 text-[20px] font-bold text-pink-600">
            {formatCount(item?.likeReceivedCount || 0)}
          </div>
        </div>

        <div className="rounded-md bg-slate-200/70 px-3 py-3">
          <div className="flex items-center gap-1.5 text-slate-600">
            <RiEmotionUnhappyLine className="text-[15px]" />
            <span className="text-[12px] font-semibold">읽씹각</span>
          </div>
          <div className="mt-1 text-[20px] font-bold text-slate-700">
            {formatCount(item?.dislikeReceivedCount || 0)}
          </div>
        </div>
      </div>
    </div>
  );
}

function FemaleCardItem({ item, onOpenDetail, onEdit }) {
  const approved = isApprovedCard(item);

  return (
    <div className="rounded-md bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
      <button
        type="button"
        onClick={() => onOpenDetail(item)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
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

            <div className="mt-2 line-clamp-2 whitespace-pre-line text-[15px] leading-6 text-slate-500">
              {getCardBody(item)}
            </div>

            <CardBaseMeta card={item} />
          </div>

          {approved ? (
            <div className="mt-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#15c415] text-white">
              <FiCheck className="text-[18px]" />
            </div>
          ) : null}
        </div>
      </button>

      {!approved && (
        <div className="mt-4 flex justify-end gap-2">
          <div className="rounded-md bg-[#555] px-4 py-2.5 text-[15px] font-bold text-white">
            {getStatusLabel(item)}
          </div>

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-md bg-violet-500 px-4 py-2.5 text-[15px] font-bold text-white"
          >
            수정하기
          </button>
        </div>
      )}
    </div>
  );
}

function MaleCardItem({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="w-full rounded-md bg-white px-4 py-4 text-left shadow-[0_1px_6px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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

          <div className="mt-2 line-clamp-2 whitespace-pre-line text-[15px] leading-6 text-slate-500">
            {getCardBody(item)}
          </div>

          <CardBaseMeta card={item} />
          <AnswerReactionSummary item={item} />
        </div>

        <div className="mt-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#15c415] text-white">
          <FiCheck className="text-[18px]" />
        </div>
      </div>
    </button>
  );
}

function EmptyBox({ text }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-[15px] text-slate-400">
      {text}
    </div>
  );
}

function MaleAnswerPreviewSheet({ open, item, onClose, onOpenRead }) {
  return (
    <AnimatePresence>
      {open && item ? (
        <motion.div
          className="fixed inset-0 z-[12000] bg-black/40 px-4"
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
              <div className="border-b border-slate-200 bg-white px-5 pb-4 pt-5">
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

                  <CardBaseMeta card={item} />
                  <AnswerReactionSummary item={item} />

                  {!!item?.myAnswerText && (
                    <div className="mt-5 rounded-md bg-slate-50 px-4 py-4">
                      <div className="text-[13px] font-semibold text-slate-500">내 답변</div>
                      <div className="mt-2 whitespace-pre-line text-[15px] leading-6 text-slate-700">
                        {item.myAnswerText}
                      </div>
                    </div>
                  )}

                  {item?.questionType === "choice" && !!item?.selectedOptionText && (
                    <div className="mt-5 rounded-md bg-violet-50 px-4 py-4">
                      <div className="text-[13px] font-semibold text-violet-600">선택한 답변</div>
                      <div className="mt-2 text-[15px] leading-6 text-violet-700">
                        {item.selectedOptionText}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={() => onOpenRead(item)}
                  className="h-12 w-full rounded-md bg-violet-500 text-[16px] font-bold text-white"
                >
                  상세보기
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

export default function ProfileCharmingTab({ user }) {
  const router = useRouter();
  const normalizedGender = String(user?.gender || "").toLowerCase();
  const isFemale =
    normalizedGender === "female" ||
    normalizedGender === "여자" ||
    normalizedGender === "woman";
  const isMale =
    normalizedGender === "male" ||
    normalizedGender === "남자" ||
    normalizedGender === "man";

  const [loading, setLoading] = useState(true);
  const [femaleCards, setFemaleCards] = useState([]);
  const [maleAnsweredCards, setMaleAnsweredCards] = useState([]);
  const [activeFilter, setActiveFilter] = useState("latest");
  const [selectedMaleItem, setSelectedMaleItem] = useState(null);
  const [readModalItem, setReadModalItem] = useState(null);

  useEffect(() => {
    if (!isFemale && !isMale) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadFemaleCards() {
      const q = query(
        collection(db, "charmingCards"),
        where("creatorUid", "==", user.userID),
        orderBy("updatedAt", "desc"),
        limit(100)
      );

      const snap = await getDocs(q);
      const items = snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      if (!mounted) return;
      setFemaleCards(items);
    }

    async function loadMaleAnsweredCards() {
      const answersQ = query(
        collection(db, "charmingCardAnswers"),
        where("answererUid", "==", user.userID),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      const answersSnap = await getDocs(answersQ);
      const answerDocs = answersSnap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      const latestAnswerMap = {};

      answerDocs.forEach((answer) => {
        const key = answer.cardId;
        if (!key) return;

        const prev = latestAnswerMap[key];
        const currentTime =
          typeof answer?.createdAt?.toMillis === "function"
            ? answer.createdAt.toMillis()
            : 0;
        const prevTime =
          typeof prev?.createdAt?.toMillis === "function"
            ? prev.createdAt.toMillis()
            : 0;

        if (!prev || currentTime > prevTime) {
          latestAnswerMap[key] = answer;
        }
      });

      const dedupedAnswers = Object.values(latestAnswerMap);
      const uniqueCardIds = [...new Set(dedupedAnswers.map((item) => item.cardId).filter(Boolean))];

      const cardMap = {};
      await Promise.all(
        uniqueCardIds.map(async (cardId) => {
          const snap = await getDoc(doc(db, "charmingCards", cardId));
          if (snap.exists()) {
            cardMap[cardId] = {
              id: snap.id,
              ...snap.data(),
            };
          }
        })
      );

      const merged = await Promise.all(
        dedupedAnswers.map(async (answer) => {
          const card = cardMap[answer.cardId];
          if (!card) return null;

          const reactionsQ = query(
            collection(db, "charmingCardAnswerReactions"),
            where("answerId", "==", answer.id)
          );

          const reactionsSnap = await getDocs(reactionsQ);
          const reactions = reactionsSnap.docs.map((docItem) => docItem.data());

          const likeReceivedCount = reactions.filter(
            (item) => item?.reactionType === "like"
          ).length;

          const dislikeReceivedCount = reactions.filter(
            (item) => item?.reactionType === "dislike"
          ).length;

          return {
            ...card,
            answerId: answer.id,
            answerText: answer.answerText || answer.content || "",
            myAnswerText: answer.answerText || answer.content || "",
            selectedOptionIndex:
              typeof answer.selectedOptionIndex === "number"
                ? answer.selectedOptionIndex
                : null,
            selectedOptionText: answer.selectedOptionText || "",
            answererUid: answer.answererUid || "",
            answeredAt: answer.createdAt,
            likeReceivedCount,
            dislikeReceivedCount,
          };
        })
      );

      if (!mounted) return;
      setMaleAnsweredCards(merged.filter(Boolean));
    }

    async function load() {
      try {
        setLoading(true);

        if (isFemale) {
          await loadFemaleCards();
        } else if (isMale) {
          await loadMaleAnsweredCards();
        }
      } catch (error) {
        console.error("[ProfileCharmingTab] load error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [isFemale, isMale, user?.userID]);

  useEffect(() => {
    setActiveFilter("latest");
  }, [isFemale, isMale]);

  const visibleFemaleCards = useMemo(() => {
    return sortCards(femaleCards, activeFilter);
  }, [femaleCards, activeFilter]);

  const visibleMaleCards = useMemo(() => {
    return sortCards(maleAnsweredCards, activeFilter);
  }, [maleAnsweredCards, activeFilter]);

  const handleOpenCardDetail = (item) => {
    router.push(`/cards/${item.id}?from=profile&tab=charming`);
  };

  const handleEditFemaleCard = (item) => {
    router.push(`${EDIT_ROUTE}?mode=edit&cardId=${item.id}&from=profile&tab=charming`);
  };

  const handleGoCreate = () => {
    router.push(`${CREATE_ROUTE}?from=profile&tab=charming`);
  };

  const handleOpenMaleItem = (item) => {
    setSelectedMaleItem(item);
  };

  const handleOpenMaleReadModal = (item) => {
    setSelectedMaleItem(null);
    setReadModalItem(item);
  };

  const filters = isFemale ? FEMALE_FILTERS : MALE_FILTERS;

  return (
    <>
      <div className="relative space-y-0 pb-2">
        <div className="px-3 pt-3">
          <UsageBanner user={user} isFemale={isFemale} />
        </div>

        {isFemale && (
          <FemaleCreateAction onClick={handleGoCreate} />
        )}

        <FilterBar
          filters={filters}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <div className="space-y-3 px-3 py-4">
          {loading ? (
            <EmptyBox text="차밍카드를 불러오는 중입니다." />
          ) : isFemale ? (
            visibleFemaleCards.length > 0 ? (
              visibleFemaleCards.map((item) => (
                <FemaleCardItem
                  key={item.id}
                  item={item}
                  onOpenDetail={handleOpenCardDetail}
                  onEdit={handleEditFemaleCard}
                />
              ))
            ) : (
              <EmptyBox text="아직 작성한 차밍카드가 없어요." />
            )
          ) : visibleMaleCards.length > 0 ? (
            visibleMaleCards.map((item) => (
              <MaleCardItem
                key={`${item.id}-${item.answerId || "noanswer"}`}
                item={item}
                onOpen={handleOpenMaleItem}
              />
            ))
          ) : (
            <EmptyBox text="아직 답변한 차밍카드가 없어요." />
          )}
        </div>
      </div>

      <MaleAnswerPreviewSheet
        open={!!selectedMaleItem}
        item={selectedMaleItem}
        onClose={() => setSelectedMaleItem(null)}
        onOpenRead={handleOpenMaleReadModal}
      />

      <CharmingAnswerReadModal
        open={!!readModalItem}
        item={readModalItem}
        onClose={() => setReadModalItem(null)}
      />
    </>
  );
}