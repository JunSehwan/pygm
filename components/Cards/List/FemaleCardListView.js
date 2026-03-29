import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { RiEmotionUnhappyLine } from "react-icons/ri";
import {
  FiAlertCircle,
  FiEye,
  FiHeart,
  FiMessageCircle,
} from "react-icons/fi";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "firebaseConfig";
import CardListHeader from "./CardListHeader";
import CardListTabs from "./CardListTabs";
import AnswerProfilePreviewModal from "components/Cards/Review/AnswerProfilePreviewModal";
import {
  CardAnswerReportDoneModal,
  CardAnswerReportModal,
} from "./CardAnswerReportModal";
import { CARD_CATEGORY_LABEL } from "./cardListMeta";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "string") return new Date(value).getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  return 0;
}

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
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

  const onlyNum = String(birthday).replace(/[^0-9]/g, "");
  if (onlyNum.length < 4) return null;

  const year = Number(onlyNum.slice(0, 4));
  const month = Number(onlyNum.slice(4, 6) || "1");
  const day = Number(onlyNum.slice(6, 8) || "1");

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasNotHadBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);

  if (hasNotHadBirthday) age -= 1;
  return age > 0 ? age : null;
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
  }
  
  if (profile?.thumbimage) return profile.thumbimage;
  return "/image/profile/default_profile.png";
}

const FEMALE_TABS = [
  { key: "recommended", label: "추천순" },
  { key: "latest", label: "최신순" },
  { key: "popular", label: "공감순" },
  { key: "mine", label: "내카드" },
];

const PAGE_SIZE = 8;

function ReactionEffect({ type }) {
  const config =
    type === "like"
      ? {
        icon: <FiHeart className="text-[56px] text-[#ff4338]" />,
        text: "심쿵",
        textClass: "text-[#ff4338]",
        ringClass: "border-[#ffb6b0] bg-white/90",
      }
      : {
        icon: <RiEmotionUnhappyLine className="text-[56px] text-slate-700" />,
        text: "읽씹각",
        textClass: "text-slate-700",
        ringClass: "border-slate-300 bg-white/90",
      };

  return (
    <AnimatePresence>
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-full border px-7 py-6 shadow-[0_10px_26px_rgba(15,23,42,0.10)] backdrop-blur-sm",
            config.ringClass
          )}
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {config.icon}
          <div className={cn("text-[18px] font-bold", config.textClass)}>
            {config.text}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatChip({ icon, value }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
      <span className="text-[14px]">{icon}</span>
      <span>{Number(value || 0).toLocaleString()}</span>
    </div>
  );
}

function ReactionCircleButton({ icon, tone = "slate", onClick, ariaLabel }) {
  const toneClass =
    tone === "red"
      ? "border-[#ff6b62] text-[#ff4338]"
      : tone === "violet"
        ? "border-violet-400 text-violet-600"
        : "border-slate-400 text-slate-700";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border-2 bg-white text-[23px] shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition active:scale-[0.96] hover:bg-slate-100",
        toneClass
      )}
    >
      {icon}
    </button>
  );
}

function FemaleAnswerListItem({
  item,
  reactedType,
  effectType,
  onClickCard,
  onClickProfile,
  onClickLike,
  onClickDislike,
  onClickReport,
}) {
  const answerer = item?.answerer || {};
  const card = item?.card || {};
  const answer = item?.answer || {};
  const age = calcAgeFromBirthdayMap(answerer?.birthday);
  const profileImage = getProfileImage(answerer);
  const answerPreview =
    answer?.questionType === "choice"
      ? answer?.selectedOptionText || ""
      : answer?.answerText || "";

  const categoryLabel =
    CARD_CATEGORY_LABEL?.[card?.category] || card?.category || "카테고리";

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
      <button type="button" onClick={onClickCard} className="w-full text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={profileImage}
              alt="프로필"
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-slate-800">
                {answerer?.username || answer?.answererUsername || "프로필"}
                {age ? `(${age})` : ""}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClickReport();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-500"
            >
              <FiAlertCircle className="text-[13px]" />
              신고
            </button>

            <span className="rounded-md border border-slate-300 bg-slate-100 px-3 py-[7px] text-[12px] font-medium text-slate-600">
              {categoryLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 text-[18px] font-bold leading-7 tracking-[-0.03em] text-slate-800">
          {card?.title || "질문 제목"}
        </div>

        <p className="mt-2 line-clamp-2 whitespace-pre-line text-[15px] leading-6 text-slate-600">
          {answerPreview || card?.body || card?.guide || "답변 내용이 없어요."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StatChip icon={<FiEye />} value={item?.stats?.viewCount || 0} />
          <StatChip icon={<FiMessageCircle />} value={item?.stats?.answerCount || 0} />
          <StatChip icon={<FiHeart />} value={item?.stats?.likeCount || 0} />
        </div>
      </button>

      <div className="mt-4 flex items-center justify-end gap-3">
        {!reactedType ? (
          <>
            <ReactionCircleButton
              ariaLabel="읽씹각"
              tone="slate"
              icon={<RiEmotionUnhappyLine />}
              onClick={onClickDislike}
            />
            <ReactionCircleButton
              ariaLabel="심쿵"
              tone="red"
              icon={<FiHeart />}
              onClick={onClickLike}
            />
          </>
        ) : (
          <div className="mr-auto text-[13px] font-medium text-slate-400">
            이미 확인하고 응답한 의견이에요
          </div>
        )}

        <ReactionCircleButton
          ariaLabel="프로필 보기"
          tone="violet"
          icon={<FiMessageCircle />}
          onClick={onClickProfile}
        />
      </div>

      {effectType ? <ReactionEffect type={effectType} /> : null}
    </div>
  );
}

export default function FemaleCardListView({
  ownerUid,
  items,
  reactionByAnswerId,
  reportedAnswererUids,
}) {
  const router = useRouter();
  const sentinelRef = useRef(null);

  const [activeTab, setActiveTab] = useState("recommended");
  const [reviewItems, setReviewItems] = useState(items || []);
  const [reactionMap, setReactionMap] = useState(reactionByAnswerId || {});
  const [localReportedUids, setLocalReportedUids] = useState(reportedAnswererUids || []);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [effectAnswerId, setEffectAnswerId] = useState("");
  const [effectType, setEffectType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [reportTargetItem, setReportTargetItem] = useState(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDoneOpen, setReportDoneOpen] = useState(false);
  const [profileViewedIds, setProfileViewedIds] = useState([]);

  const todayKey = useMemo(() => getTodayKey(), []);
  const usageDocRef = useMemo(() => {
    if (!ownerUid) return null;
    return doc(db, "users", ownerUid, "dailyUsage", `cardReview_${todayKey}`);
  }, [ownerUid, todayKey]);

  useEffect(() => {
    setReviewItems(items || []);
  }, [items]);

  useEffect(() => {
    setReactionMap(reactionByAnswerId || {});
  }, [reactionByAnswerId]);

  useEffect(() => {
    setLocalReportedUids(reportedAnswererUids || []);
  }, [reportedAnswererUids]);

  useEffect(() => {
    let mounted = true;

    async function loadUsage() {
      if (!usageDocRef) return;

      try {
        const snap = await getDoc(usageDocRef);
        const data = snap.exists() ? snap.data() || {} : {};
        if (!mounted) return;
        setProfileViewedIds(Array.isArray(data.profileViewedIds) ? data.profileViewedIds : []);
      } catch (error) {
        console.error("[FemaleCardListView] load usage error:", error);
      }
    }

    loadUsage();

    return () => {
      mounted = false;
    };
  }, [usageDocRef]);

  const reportedUidSet = useMemo(() => new Set(localReportedUids || []), [localReportedUids]);

  const filteredItems = useMemo(() => {
    return (reviewItems || []).filter((item) => {
      const answererUid = item?.answer?.answererUid || "";
      if (!answererUid) return false;
      if (reportedUidSet.has(answererUid)) return false;
      return true;
    });
  }, [reviewItems, reportedUidSet]);

  const sortedItems = useMemo(() => {
    const next = [...filteredItems];

    if (activeTab === "latest") {
      return next.sort(
        (a, b) =>
          toMillis(b?.answer?.updatedAt || b?.answer?.createdAt) -
          toMillis(a?.answer?.updatedAt || a?.answer?.createdAt)
      );
    }

    if (activeTab === "popular") {
      return next.sort((a, b) => {
        const scoreA = (a?.stats?.likeCount || 0) * 1.2 + (a?.stats?.viewCount || 0) * 0.01;
        const scoreB = (b?.stats?.likeCount || 0) * 1.2 + (b?.stats?.viewCount || 0) * 0.01;
        return scoreB - scoreA;
      });
    }

    if (activeTab === "mine") {
      return next.sort(
        (a, b) =>
          toMillis(b?.card?.updatedAt || b?.card?.createdAt) -
          toMillis(a?.card?.updatedAt || a?.card?.createdAt)
      );
    }

    return next.sort((a, b) => {
      const scoreA = (a?.stats?.viewCount || 0) * 0.55 + (a?.stats?.likeCount || 0) * 0.45;
      const scoreB = (b?.stats?.viewCount || 0) * 0.55 + (b?.stats?.likeCount || 0) * 0.45;
      return scoreB - scoreA;
    });
  }, [activeTab, filteredItems]);

  const visibleItems = useMemo(
    () => sortedItems.slice(0, visibleCount),
    [sortedItems, visibleCount]
  );

  const hasMore = visibleCount < sortedItems.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, items, localReportedUids]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sortedItems.length));
      },
      { threshold: 0.2 }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, sortedItems.length]);

  const remainingProfileDetailCount = Math.max(0, 1 - profileViewedIds.length);
  const canOpenDetail = remainingProfileDetailCount > 0;

  const playReactionEffect = (answerId, type) => {
    setEffectAnswerId(answerId);
    setEffectType(type);

    window.setTimeout(() => {
      setEffectAnswerId("");
      setEffectType("");
    }, 520);
  };

  const handleReaction = async (item, reactionType) => {
    if (!ownerUid || !item?.answer?.id || !item?.card?.id) return;

    const answerId = item.answer.id;
    const cardId = item.card.id;
    const reactionDocId = `${cardId}_${answerId}_${ownerUid}`;

    playReactionEffect(answerId, reactionType === "like" ? "like" : "dislike");

    try {
      await setDoc(
        doc(db, "charmingCardAnswerReactions", reactionDocId),
        {
          cardId,
          answerId,
          ownerUid,
          answererUid: item?.answer?.answererUid || "",
          reactionType,
          source: "cards_list_female",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      setReactionMap((prev) => ({
        ...(prev || {}),
        [answerId]: reactionType,
      }));

      if (reactionType === "like") {
        setReviewItems((prev) =>
          (prev || []).map((row) => {
            if (row?.answer?.id !== answerId) return row;
            return {
              ...row,
              stats: {
                ...(row?.stats || {}),
                likeCount: Number(row?.stats?.likeCount || 0) + 1,
              },
            };
          })
        );
      }
    } catch (error) {
      console.error("[FemaleCardListView] reaction error:", error);
    }
  };

  const handleSubmitReport = async ({
    reasonKey,
    reasonLabel,
    detail,
    hideTargetContents,
  }) => {
    if (!ownerUid || !reportTargetItem?.answer?.id) return;

    setReportSubmitting(true);

    try {
      const answererUid = reportTargetItem?.answer?.answererUid || "";
      const answerId = reportTargetItem?.answer?.id || "";
      const cardId = reportTargetItem?.card?.id || "";
      const reportDocId = `${ownerUid}_${answerId}`;

      await setDoc(
        doc(db, "charmingCardAnswerReports", reportDocId),
        {
          ownerUid,
          cardId,
          answerId,
          answererUid,
          reportedAnswererUid: answererUid,
          reportedAnswerUsername:
            reportTargetItem?.answerer?.username ||
            reportTargetItem?.answer?.answererUsername ||
            "",
          reportReasonKey: reasonKey,
          reportReasonLabel: reasonLabel,
          reportReasonDetail: detail || "",
          hideTargetContents: !!hideTargetContents,
          status: "active",
          source: "cards_list_female",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (hideTargetContents) {
        setLocalReportedUids((prev) =>
          Array.from(new Set([...(prev || []), answererUid]))
        );
      }

      setReportTargetItem(null);
      setReportDoneOpen(true);
    } catch (error) {
      console.error("[FemaleCardListView] report error:", error);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenProfileDetail = async () => {
    const targetUid = selectedItem?.answer?.answererUid || "";
    if (!usageDocRef || !targetUid || !canOpenDetail) {
      setSelectedItem(null);
      return;
    }

    const nextIds = Array.from(new Set([...(profileViewedIds || []), targetUid]));

    try {
      await setDoc(
        usageDocRef,
        {
          profileViewedIds: nextIds,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setProfileViewedIds(nextIds);
      setSelectedItem(null);
      router.push(`/arena/${targetUid}`);
    } catch (error) {
      console.error("[FemaleCardListView] profile detail error:", error);
      setSelectedItem(null);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 md:h-[760px]">
      <div className="shrink-0">
        <CardListHeader title="차밍카드 답변리뷰" desc="" />
        <CardListTabs activeTab={activeTab} tabs={FEMALE_TABS} onClickTab={setActiveTab} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const answerId = item?.answer?.id || "";
            const reactedType = reactionMap?.[answerId] || "";
            const effectVisible = effectAnswerId === answerId ? effectType : "";

            return (
              <FemaleAnswerListItem
                key={answerId}
                item={item}
                reactedType={reactedType}
                effectType={effectVisible}
                onClickCard={() => router.push(`/cards/${item?.card?.id}`)}
                onClickProfile={() => setSelectedItem(item)}
                onClickLike={() => handleReaction(item, "like")}
                onClickDislike={() => handleReaction(item, "dislike")}
                onClickReport={() => setReportTargetItem(item)}
              />
            );
          })}

          {visibleItems.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-[15px] text-slate-500 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
              아직 도착한 답변이 없어요.
            </div>
          ) : null}

          <div ref={sentinelRef} className="h-8 w-full" />

          {hasMore ? (
            <div className="pb-2 text-center text-[13px] text-slate-400">
              더 불러오는 중...
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="pb-2 text-center text-[13px] text-slate-400">
              마지막 답변까지 모두 확인했어요.
            </div>
          ) : null}
        </div>
      </div>

      <AnswerProfilePreviewModal
        open={!!selectedItem}
        profile={selectedItem?.answerer || null}
        answer={selectedItem?.answer || null}
        onClose={() => setSelectedItem(null)}
        onDetail={handleOpenProfileDetail}
        remainingProfileDetailCount={remainingProfileDetailCount}
        canOpenDetail={canOpenDetail}
      />

      <CardAnswerReportModal
        open={!!reportTargetItem}
        onClose={() => setReportTargetItem(null)}
        onSubmit={handleSubmitReport}
        submitting={reportSubmitting}
      />

      <CardAnswerReportDoneModal
        open={reportDoneOpen}
        onClose={() => setReportDoneOpen(false)}
      />
    </div>
  );
}