import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiHeart } from "react-icons/fi";
import { RiEmotionUnhappyLine } from "react-icons/ri";

import { db } from "firebaseConfig";
import AnswerProfilePreviewModal from "./AnswerProfilePreviewModal";
import CardReviewHeader from "./CardReviewHeader";
import AnswererProfileStrip from "./AnswererProfileStrip";
import CardReviewEmptyState from "./CardReviewEmptyState";
import CardReviewActionBar from "./CardReviewActionBar";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

// =========================
// helpers
// =========================

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "string") return new Date(value).getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  return 0;
}

function calcAgeFromBirthdayMap(birthday) {
  if (!birthday) return null;

  if (typeof birthday === "object" && birthday.year) {
    const year = Number(birthday.year);
    const month = Number(birthday.month || 1);
    const day = Number(birthday.day || 1);

    const today = new Date();
    let age = today.getFullYear() - year;
    const hasNotHadBirthday =
      today.getMonth() + 1 < month ||
      (today.getMonth() + 1 === month && today.getDate() < day);

    if (hasNotHadBirthday) age -= 1;
    return age > 0 ? age : null;
  }

  return null;
}

function getProfileImage(profile) {
  if (Array.isArray(profile?.profilePhotos)) {
    const firstValid = profile.profilePhotos.find((item) => {
      if (!item) return false;
      if (typeof item === "string") return !!item;
      return !!item.url;
    });

    if (typeof firstValid === "string") return firstValid;
    if (firstValid?.url) return firstValid.url;
    if (profile?.thumbimage) return profile.thumbimage[0];
  }

  return "/image/profile/default_profile.png";
}

function getCategoryLabel(category) {
  const map = {
    value: "가치관 태그",
    dating: "연애상황",
    care: "배려/공감",
    sense: "센스",
    life: "생활습관",
    marriage: "결혼관",
  };

  return map[category] || "카테고리 태그";
}

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

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

/**
 * 현재 카드 답변 우선 + 다른 카드 답변 이어보기
 * - profileCharmingMode: 해당 카드 답변만 그대로 보여줌
 * - 일반 모드: reactedAnswerIds 제외
 */
function buildReviewFeed({
  initialCardId,
  initialAnswerId = "",
  answers,
  reactedAnswerIds,
  profileCharmingMode = false,
}) {
  const allAnswers = [...(answers || [])];

  if (profileCharmingMode) {
    return allAnswers
      .filter((item) => item?.cardId === initialCardId)
      .sort(
        (a, b) =>
          toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt)
      );
  }

  const reactedSet = new Set(reactedAnswerIds || []);

  const filtered = allAnswers.filter(
    (item) => item?.id && !reactedSet.has(item.id)
  );

  if (initialAnswerId) {
    const picked = filtered.find((item) => item.id === initialAnswerId) || null;
    const others = filtered.filter((item) => item.id !== initialAnswerId);

    const sameCardAnswers = others
      .filter((item) => item.cardId === initialCardId)
      .sort(
        (a, b) =>
          toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt)
      );

    const otherAnswers = others
      .filter((item) => item.cardId !== initialCardId)
      .sort(
        (a, b) =>
          toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt)
      );

    return picked ? [picked, ...sameCardAnswers, ...otherAnswers] : [...sameCardAnswers, ...otherAnswers];
  }

  const currentCardAnswers = filtered
    .filter((item) => item.cardId === initialCardId)
    .sort(
      (a, b) =>
        toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt)
    );

  const otherAnswers = filtered
    .filter((item) => item.cardId !== initialCardId)
    .sort(
      (a, b) =>
        toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt)
    );

  return [...currentCardAnswers, ...otherAnswers];
}

// =========================
// local UI blocks
// =========================

function ChoiceAnswerBlock({ currentCard, currentAnswer }) {
  const selectedIndexes = Array.isArray(currentAnswer?.selectedOptionIndexes)
    ? currentAnswer.selectedOptionIndexes
    : typeof currentAnswer?.selectedOptionIndex === "number"
      ? [currentAnswer.selectedOptionIndex]
      : [];

  const selectedText = currentAnswer?.selectedOptionText || "";

  return (
    <div>
      <div className="mb-2 text-[14px] font-semibold text-blue-700">
        선택한 답변
      </div>

      <div className="space-y-2">
        {(currentCard?.options || []).map((option, index) => {
          const active =
            selectedIndexes.includes(index) ||
            (!!selectedText && selectedText.split(",").map((v) => v.trim()).includes(option));

          return (
            <div
              key={`${currentCard?.id || "card"}-option-${index}`}
              className={cn(
                "rounded-md border px-4 py-4 text-[15px] leading-6 transition border-solid",
                active
                  ? "border-violet-300 bg-violet-100 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-solid",
                    active ? "border-violet-400" : "border-slate-400"
                  )}
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      active ? "bg-violet-400" : "bg-transparent"
                    )}
                  />
                </span>

                <div className="min-w-0 flex-1">{option}</div>

                {active ? (
                  <FiCheck className="mt-[2px] shrink-0 text-[16px] text-violet-500" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextAnswerBlock({ currentAnswerContent }) {
  return (
    <div>
      <div className="mb-2 text-[14px] font-semibold text-blue-700">
        답변
      </div>
      <div className="whitespace-pre-line rounded-md bg-violet-100 px-4 py-4 text-[15px] leading-7 text-violet-700">
        {currentAnswerContent || "답변 없음"}
      </div>
    </div>
  );
}

function ActionOverlay({ action }) {
  if (!action) return null;

  const configMap = {
    dislike: {
      icon: <RiEmotionUnhappyLine className="text-[72px] text-slate-700" />,
      label: "읽씹각",
      textClass: "text-slate-700",
    },
    pass: {
      icon: <FiHeart className="rotate-90 text-[72px] text-slate-700" />,
      label: "패스하기",
      textClass: "text-slate-700",
    },
    like: {
      icon: <FiHeart className="text-[72px] text-[#ff4338]" />,
      label: "심쿵",
      textClass: "text-[#ff4338]",
    },
  };

  const config = configMap[action];
  if (!config) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={action}
        className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.06 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        <motion.div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl px-8 py-8 backdrop-blur-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {config.icon}
          <div className={cn("text-[24px] font-semibold", config.textClass)}>
            {config.label}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// =========================
// main component
// =========================

export default function CardAnswerReviewPage({
  initialCardId,
  initialAnswerId = "",
  ownerUid,
  cardsById,
  answers,
  answererMap,
  reactedAnswerIds,
}) {
  const router = useRouter();

  const profileCharmingMode =
    router.query?.from === "profile" && router.query?.tab === "charming";

  const scrollRef = useRef(null);
  const lastScrollTopRef = useRef(0);

  const [showProfileStrip, setShowProfileStrip] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [overlayAction, setOverlayAction] = useState("");

  const [usageLoading, setUsageLoading] = useState(true);
  const [answerViewedIds, setAnswerViewedIds] = useState([]);
  const [profileViewedIds, setProfileViewedIds] = useState([]);
  const [consumedInSessionIds, setConsumedInSessionIds] = useState([]);
  const [answerLimitReached, setAnswerLimitReached] = useState(false);

  // =========================
  // derived refs / state
  // =========================

  const todayKey = useMemo(() => getTodayKey(), []);
  const usageDocRef = useMemo(() => {
    if (!ownerUid) return null;
    return doc(db, "users", ownerUid, "dailyUsage", `cardReview_${todayKey}`);
  }, [ownerUid, todayKey]);

  const currentCard = useMemo(() => {
    return cardsById?.[initialCardId] || null;
  }, [cardsById, initialCardId]);

  const answerViewsUsed = answerViewedIds.length;
  const profileViewsUsed = profileViewedIds.length;

  const remainingAnswerViewCount = Math.max(0, 5 - answerViewsUsed);
  const remainingProfileDetailCount = Math.max(0, 1 - profileViewsUsed);
  const canOpenProfileDetail = remainingProfileDetailCount > 0;

  // =========================
  // usage loading
  // =========================

  useEffect(() => {
    let mounted = true;

    async function loadUsage() {
      if (!usageDocRef) {
        setUsageLoading(false);
        return;
      }

      try {
        const snap = await getDoc(usageDocRef);
        const data = snap.exists() ? snap.data() || {} : {};

        if (!mounted) return;

        setAnswerViewedIds(Array.isArray(data.answerViewedIds) ? data.answerViewedIds : []);
        setProfileViewedIds(Array.isArray(data.profileViewedIds) ? data.profileViewedIds : []);
      } catch (error) {
        console.error("[CardAnswerReviewPage] load usage error:", error);
      } finally {
        if (mounted) setUsageLoading(false);
      }
    }

    loadUsage();

    return () => {
      mounted = false;
    };
  }, [usageDocRef]);

  // =========================
  // queue building
  // =========================

  useEffect(() => {
    if (usageLoading && !profileCharmingMode) return;

    const nextQueue = buildReviewFeed({
      initialCardId,
      initialAnswerId,
      answers,
      reactedAnswerIds,
      profileCharmingMode,
    });

    setQueue(nextQueue);
    setCurrentIndex(0);
    setConsumedInSessionIds([]);
    setAnswerLimitReached(profileCharmingMode ? false : answerViewedIds.length >= 5);
  }, [
    usageLoading,
    profileCharmingMode,
    initialCardId,
    initialAnswerId,
    answers,
    reactedAnswerIds,
    answerViewedIds,
  ]);

  // =========================
  // scroll strip
  // =========================

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const currentTop = el.scrollTop;
      const prevTop = lastScrollTopRef.current;
      const delta = currentTop - prevTop;

      if (Math.abs(delta) < 4) return;

      if (currentTop <= 24) {
        setShowProfileStrip(true);
        lastScrollTopRef.current = currentTop;
        return;
      }

      if (delta > 0 && currentTop > 48) {
        setShowProfileStrip(false);
      } else if (delta < 0) {
        setShowProfileStrip(true);
      }

      lastScrollTopRef.current = currentTop;
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // =========================
  // current answer / profile
  // =========================

  const currentAnswer = queue[currentIndex] || null;

  const answerCard = useMemo(() => {
    if (!currentAnswer?.cardId) return currentCard || null;
    return cardsById?.[currentAnswer.cardId] || currentCard || null;
  }, [cardsById, currentAnswer, currentCard]);

  const currentProfile = useMemo(() => {
    if (!currentAnswer?.answererUid) return null;
    return answererMap?.[currentAnswer.answererUid] || null;
  }, [answererMap, currentAnswer]);

  const mergedProfile = useMemo(() => {
    return {
      nickname:
        currentProfile?.nickname ||
        currentAnswer?.answererNickname ||
        "답변자",
      username: "",
      birthday: currentProfile?.birthday || "",
      mbti: currentProfile?.mbti || currentProfile?.styleTest?.typeCode || "",
      job: currentProfile?.job || "",
      education: currentProfile?.education || "",
      address_sido: currentProfile?.address_sido || currentProfile?.residence?.sido || "",
      address_sigugun: currentProfile?.address_sigugun || currentProfile?.residence?.sigugun || "",
      thumbimage: currentProfile?.thumbimage || "",
      profilePhotos: Array.isArray(currentProfile?.profilePhotos)
        ? currentProfile.profilePhotos
        : [],
      styleTest: currentProfile?.styleTest || {},
      userID: currentProfile?.uid || currentAnswer?.answererUid || "",
    };
  }, [currentProfile, currentAnswer]);

  const profileImage = useMemo(() => getProfileImage(mergedProfile), [mergedProfile]);

  const profileSubtitle = useMemo(() => {
    const age = calcAgeFromBirthdayMap(mergedProfile?.birthday);
    const locationText = [
      mergedProfile?.residence?.sido || mergedProfile?.address_sido,
      mergedProfile?.residence?.sigugun || mergedProfile?.address_sigugun,
    ]
      .filter(Boolean)
      .join(" ");

    return [age ? `${age}세` : "", mergedProfile?.mbti || "", locationText]
      .filter(Boolean)
      .join(", ");
  }, [mergedProfile]);

  const currentAnswerContent = useMemo(() => {
    if (!currentAnswer) return "";
    if (currentAnswer.questionType === "choice") {
      return currentAnswer.selectedOptionText || "";
    }
    return currentAnswer.answerText || "";
  }, [currentAnswer]);

  const isChoiceQuestion =
    answerCard?.questionType === "choice" ||
    answerCard?.questionType === "objective" ||
    answerCard?.questionType === "multiple";

  // =========================
  // handlers
  // =========================

  const handleBackToOrigin = () => {
    if (profileCharmingMode) {
      router.push("/profile?tab=charming");
      return;
    }

    router.push("/cards");
  };

  useEffect(() => {
    async function consumeAnswerView() {
      if (profileCharmingMode) return;
      if (!usageDocRef || !currentAnswer?.id || usageLoading) return;
      if (consumedInSessionIds.includes(currentAnswer.id)) return;
      if (answerViewedIds.length >= 5) {
        setAnswerLimitReached(true);
        return;
      }

      const nextIds = answerViewedIds.includes(currentAnswer.id)
        ? answerViewedIds
        : [...answerViewedIds, currentAnswer.id];

      try {
        if (nextIds !== answerViewedIds) {
          await setDoc(
            usageDocRef,
            {
              answerViewedIds: nextIds,
              profileViewedIds,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          setAnswerViewedIds(nextIds);
        }

        setConsumedInSessionIds((prev) => [...prev, currentAnswer.id]);
      } catch (error) {
        console.error("[CardAnswerReviewPage] consume answer view error:", error);
      }
    }

    consumeAnswerView();
  }, [
    profileCharmingMode,
    usageDocRef,
    currentAnswer,
    usageLoading,
    answerViewedIds,
    consumedInSessionIds,
    profileViewedIds,
  ]);

  const goNext = () => {
    const nextIndex = currentIndex + 1;

    if (!profileCharmingMode && answerViewedIds.length >= 5) {
      setAnswerLimitReached(true);
      setCurrentIndex(queue.length);
      return;
    }

    if (nextIndex >= queue.length) {
      setCurrentIndex(queue.length);
      return;
    }

    setCurrentIndex(nextIndex);

    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  const playActionAndNext = (action, after) => {
    setOverlayAction(action);

    window.setTimeout(async () => {
      try {
        if (after) {
          await after();
        }
      } catch (error) {
        console.error("[CardAnswerReviewPage] action error:", error);
      } finally {
        window.setTimeout(() => {
          setOverlayAction("");
          goNext();
        }, 120);
      }
    }, 360);
  };

  const handleReaction = (reactionType) => {
    if (profileCharmingMode) {
      playActionAndNext(reactionType === "like" ? "like" : "dislike");
      return;
    }

    if (!answerCard?.id || !ownerUid || !currentAnswer?.id) {
      playActionAndNext(reactionType === "like" ? "like" : "dislike");
      return;
    }

    playActionAndNext(reactionType === "like" ? "like" : "dislike", async () => {
      const reactionDocId = `${answerCard.id}_${currentAnswer.id}_${ownerUid}`;

      await setDoc(doc(db, "charmingCardAnswerReactions", reactionDocId), {
        cardId: answerCard.id,
        answerId: currentAnswer.id,
        ownerUid,
        answererUid: currentAnswer.answererUid || "",
        reactionType,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    });
  };

  const handlePass = () => {
    playActionAndNext("pass");
  };

  const handleOpenDetailProfile = async () => {
    if (profileCharmingMode) {
      setProfileModalOpen(false);
      if (mergedProfile?.userID) {
        router.push(`/arena/${mergedProfile.userID}`);
      }
      return;
    }

    if (!usageDocRef || !currentAnswer?.answererUid) {
      setProfileModalOpen(false);
      return;
    }

    if (profileViewedIds.length >= 1) {
      setProfileModalOpen(false);
      return;
    }

    const targetUid = currentAnswer.answererUid;
    const nextIds = [...profileViewedIds, targetUid];

    try {
      await setDoc(
        usageDocRef,
        {
          answerViewedIds,
          profileViewedIds: nextIds,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setProfileViewedIds(nextIds);
      setProfileModalOpen(false);

      if (mergedProfile?.userID) {
        router.push(`/arena/${mergedProfile.userID}`);
      }
    } catch (error) {
      console.error("[CardAnswerReviewPage] consume profile detail error:", error);
      setProfileModalOpen(false);
    }
  };

  // =========================
  // render: loading
  // =========================

  if (usageLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-white px-6 text-center md:h-[760px]">
        <div className="text-[18px] font-semibold text-slate-700">
          불러오는 중...
        </div>
      </div>
    );
  }

  // =========================
  // render: no card
  // =========================

  if (!currentCard) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="text-[20px] font-semibold text-slate-800">
          카드를 불러올 수 없어요
        </div>
        <button
          type="button"
          onClick={handleBackToOrigin}
          className="mt-4 rounded-md bg-[#7c6cff] px-4 py-3 text-white"
        >
          카드 홈으로 이동
        </button>
      </div>
    );
  }

  // =========================
  // render: answer limit
  // =========================

  if (!profileCharmingMode && (answerLimitReached || answerViewedIds.length >= 5)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center md:h-[760px]">
        <div className="text-[20px] font-semibold text-slate-800">
          오늘의 답변 열람 한도를 모두 사용했어요
        </div>
        <div className="mt-2 text-[14px] leading-6 text-slate-500">
          답변 열람은 하루 5개까지 가능해요.
          <br />
          내일 다시 확인해주세요.
        </div>
        <button
          type="button"
          onClick={handleBackToOrigin}
          className="mt-5 rounded-md bg-[#7c6cff] px-4 py-3 text-white"
        >
          카드 홈으로 이동
        </button>
      </div>
    );
  }

  // =========================
  // render: empty / all consumed
  // =========================

  if (!currentAnswer || !answerCard) {
    const fallbackCard = currentCard || answerCard || null;
    const initialCardAnswers = (answers || []).filter(
      (item) => item?.cardId === initialCardId
    );

    return (
      <CardReviewEmptyState
        card={fallbackCard}
        getCardCategory={getCardCategory}
        getQuestionType={getQuestionType}
        getCardTitle={getCardTitle}
        getCardBody={getCardBody}
        getViewCount={getViewCount}
        getAnswerCount={getAnswerCount}
        getLikeCount={getLikeCount}
        hasAnyAnswers={initialCardAnswers.length > 0}
        onBack={handleBackToOrigin}
      />
    );
  }

  // =========================
  // render: normal
  // =========================

  return (
    <>
      <div className="relative flex h-full min-h-0 flex-col bg-white">
        <ActionOverlay action={overlayAction} />

        <CardReviewHeader
          title={`${mergedProfile.nickname}님의 답변`}
          categoryLabel={getCategoryLabel(answerCard?.category)}
          views={answerCard?.views ?? answerCard?.viewCount ?? 0}
          answerCount={answerCard?.answerCount ?? 0}
          likeCount={answerCard?.interestedCount ?? 0}
          remainingAnswerViewCount={remainingAnswerViewCount}
          remainingProfileDetailCount={remainingProfileDetailCount}
          showRemainingInfo={!profileCharmingMode}
          onBack={handleBackToOrigin}
        />

        <AnswererProfileStrip
          show={showProfileStrip}
          profileImage={profileImage}
          nickname={mergedProfile.nickname}
          subtitle={profileSubtitle}
        />

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto bg-white overscroll-contain"
        >
          <div className="px-4 pb-6 pt-4">
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-[14px] font-bold text-slate-700">
                  질문 제목
                </div>
                <div className="rounded-md bg-slate-50 px-4 py-4 text-[15px] font-bold leading-6 text-slate-700">
                  {answerCard?.title || ""}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[14px] font-semibold text-slate-700">
                  질문 내용
                </div>
                <div className="whitespace-pre-line rounded-md bg-slate-50 px-4 py-4 text-[15px] leading-6 text-slate-700">
                  {answerCard?.body || answerCard?.guide || ""}
                </div>
              </div>

              {answerCard?.guide ? (
                <div>
                  <div className="mb-2 text-[14px] font-semibold text-slate-700">
                    부가설명
                  </div>
                  <div className="whitespace-pre-line rounded-md bg-slate-50 px-4 py-4 text-[15px] leading-6 text-slate-700">
                    {answerCard.guide}
                  </div>
                </div>
              ) : null}

              {isChoiceQuestion ? (
                <ChoiceAnswerBlock
                  currentCard={answerCard}
                  currentAnswer={currentAnswer}
                />
              ) : (
                <TextAnswerBlock currentAnswerContent={currentAnswerContent} />
              )}
            </div>
          </div>
        </div>

        <CardReviewActionBar
          onDislike={() => handleReaction("dislike")}
          onPass={handlePass}
          onProfile={() => setProfileModalOpen(true)}
          onLike={() => handleReaction("like")}
        />
      </div>

      <AnswerProfilePreviewModal
        open={profileModalOpen}
        profile={currentProfile}
        answer={currentAnswer}
        remainingProfileDetailCount={remainingProfileDetailCount}
        canOpenDetail={canOpenProfileDetail}
        onClose={() => setProfileModalOpen(false)}
        onDetail={handleOpenDetailProfile}
      />
    </>
  );
}