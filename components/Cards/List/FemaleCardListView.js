import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { RiEmotionUnhappyLine } from "react-icons/ri";
import {
  FiAlertCircle,
  FiChevronRight,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiSmile,
  FiUser,
  FiCheck,
  FiX,
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
import ImageWithSkeleton from "components/Common/ImageWithSkeleton";

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

function isChoiceQuestion(questionType = "") {
  return (
    questionType === "choice" ||
    questionType === "objective" ||
    questionType === "multiple"
  );
}

function getSelectedIndexes(answer = {}) {
  if (Array.isArray(answer?.selectedOptionIndexes)) {
    return answer.selectedOptionIndexes.filter((v) => typeof v === "number");
  }

  if (Array.isArray(answer?.selectedIndexes)) {
    return answer.selectedIndexes.filter((v) => typeof v === "number");
  }

  if (typeof answer?.selectedOptionIndex === "number") {
    return [answer.selectedOptionIndex];
  }

  if (typeof answer?.selectedIndex === "number") {
    return [answer.selectedIndex];
  }

  return [];
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

  if (Array.isArray(profile?.thumbimage) && profile.thumbimage[0]) {
    return profile.thumbimage[0];
  }

  if (typeof profile?.thumbimage === "string" && profile.thumbimage) {
    return profile.thumbimage;
  }

  return "";
}

const FEMALE_TABS = [
  { key: "recommended", label: "추천순" },
  { key: "latest", label: "최신순" },
  { key: "popular", label: "공감순" },
  { key: "mine", label: "내 카드" },
];

const PAGE_SIZE = 8;

function ReactionEffect({ type }) {
  const config =
    type === "like"
      ? {
        icon: <FiHeart className="text-[54px] text-[#ff4338]" />,
        text: "심쿵",
        textClass: "text-[#ff4338]",
        ringClass: "border-[#ffb6b0] bg-white/90",
      }
      : {
        icon: <RiEmotionUnhappyLine className="text-[54px] text-slate-700" />,
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
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <motion.div
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-full border px-7 py-6 shadow-[0_10px_26px_rgba(15,23,42,0.10)] backdrop-blur-sm",
            config.ringClass
          )}
          initial={{ opacity: 0, scale: 0.76 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
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
      style={{ cursor: "pointer" }}
    >
      {icon}
    </button>
  );
}

function ProfileAvatar({ src, alt }) {
  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-200">
      {src ? (
        <ImageWithSkeleton
          key={src}
          src={src}
          alt={alt}
          fill
          className="h-full w-full"
          imageClassName="object-cover"
          fallbackSrc=""
          unoptimized
          sizes="44px"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          <FiUser className="text-[18px]" />
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  totalCount,
  reactedCount,
  latestCount,
  remainingProfileDetailCount,
}) {
  return (
    <div className="rounded-md border border-violet-100 bg-[linear-gradient(180deg,#f7f5ff_0%,#ffffff_100%)] px-4 py-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">
            아직 반응 안 한 답변부터 먼저 보여드려요
          </div>
          <div className="mt-1 break-keep text-[13px] leading-5 text-slate-500">
            이미 확인한 답변은 아래로 정리되고,
            <br />
            아직 안 본 답변이 항상 위에 먼저 보이도록 정렬돼요.
          </div>
        </div>

        <div className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-[12px] font-semibold text-violet-700">
          프로필 상세 남은 횟수 {remainingProfileDetailCount}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <div className="text-[12px] font-medium text-slate-500">전체 답변</div>
          <div className="mt-1 text-[18px] font-bold text-slate-900">
            {Number(totalCount || 0).toLocaleString()}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <div className="text-[12px] font-medium text-slate-500">반응 완료</div>
          <div className="mt-1 text-[18px] font-bold text-slate-900">
            {Number(reactedCount || 0).toLocaleString()}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <div className="text-[12px] font-medium text-slate-500">새 답변</div>
          <div className="mt-1 text-[18px] font-bold text-slate-900">
            {Number(latestCount || 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyReviewState({ activeTab }) {
  const title =
    activeTab === "mine"
      ? "아직 내 카드에 도착한 답변이 없어요"
      : "지금은 더 확인할 답변이 없어요";

  const desc =
    activeTab === "mine"
      ? "남성 회원이 답변을 남기면 여기에서 바로 확인할 수 있어요."
      : "조금 뒤 다시 들어오면 새로운 답변이 도착해 있을 수 있어요.";

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 items-center">
        <div className="w-full rounded-md border border-slate-200 bg-white px-5 py-10 text-center shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-600">
            <FiSmile className="text-[24px]" />
          </div>

          <div className="mt-4 text-[19px] font-bold tracking-[-0.02em] text-slate-900">
            {title}
          </div>

          <div className="mt-2 break-keep text-[14px] leading-6 text-slate-500">
            {desc}
          </div>

          <div className="mt-5 rounded-md border border-violet-100 bg-violet-50 px-4 py-4 text-left">
            <div className="text-[13px] font-semibold text-violet-700">
              답변을 더 받고 싶다면
            </div>
            <div className="mt-2 space-y-2 text-[13px] leading-5 text-slate-600">
              <div>• 질문 문구를 조금 더 직관적으로 다듬어보세요.</div>
              <div>• 가벼운 질문과 진지한 질문을 섞으면 반응이 좋아져요.</div>
              <div>• 너무 길기보다 한눈에 답하고 싶은 카드가 유리해요.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChoiceAnswerPreview({ card, answer, compact = false }) {
  const selectedIndexes = getSelectedIndexes(answer);
  const selectedTextList = String(answer?.selectedOptionText || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <div className="mt-2 space-y-2">
      {(card?.options || []).map((option, index) => {
        const active =
          selectedIndexes.includes(index) || selectedTextList.includes(option);

        return (
          <div
            key={`${card?.id || "card"}-option-${index}`}
            className={cn(
              "rounded-md border transition",
              compact ? "px-3 py-2.5 text-[14px] leading-5" : "px-4 py-4 text-[15px] leading-6",
              active
                ? "border-violet-300 bg-yellow-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-500"
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center border-solid rounded-full border",
                  active ? "border-violet-400" : "border-slate-300"
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    active ? "bg-violet-500" : "bg-transparent"
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
  );
}

function FemaleAnswerDetailModal({
  open,
  item,
  reactedType,
  onClose,
  onClickLike,
  onClickDislike,
  onClickProfile,
  onClickReport,
}) {
  if (!open || !item) return null;

  const answerer = item?.answerer || {};
  const card = item?.card || {};
  const answer = item?.answer || {};
  const age = calcAgeFromBirthdayMap(answerer?.birthday);
  const profileImage = getProfileImage(answerer);
  const isChoice = isChoiceQuestion(card?.questionType || answer?.questionType || "");
  const answerPreview = isChoice
    ? answer?.selectedOptionText || ""
    : answer?.answerText || "";
  const categoryLabel =
    CARD_CATEGORY_LABEL?.[card?.category] || card?.category || "카테고리";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 md:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative flex h-[88dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[22px] bg-white md:h-[760px] md:rounded-[22px]"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-[16px] font-bold text-slate-900">
                답변 자세히 보기
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                style={{ cursor: "pointer" }}
              >
                <FiX className="text-[20px]" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar src={profileImage} alt="프로필" />

                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-slate-800">
                      {answerer?.nickname || answer?.answererNickname || "프로필"}
                      {age ? ` · ${age}세` : ""}
                    </div>
                    {/* <div className="mt-0.5 text-[12px] text-slate-400">
                      답변자 프로필
                    </div> */}
                  </div>
                </div>

                <span className="rounded-md border border-slate-300 bg-slate-100 px-3 py-[7px] text-[12px] font-medium text-slate-600">
                  {categoryLabel}
                </span>
              </div>

              <div className="mt-4 text-[20px] font-bold leading-8 tracking-[-0.03em] text-slate-900">
                {card?.title || "질문 제목"}
              </div>

              {!!card?.guide && (
                <div className="mt-3 rounded-md bg-slate-50 px-3 py-3 text-[13px] leading-5 text-slate-500">
                  {card.guide}
                </div>
              )}

              <div className="mt-4 rounded-md border border-violet-100 bg-violet-50 px-4 py-4">
                <div className="text-[12px] font-semibold text-violet-700">
                  남성 회원의 답변
                </div>
                {isChoice ? (
                  <ChoiceAnswerPreview card={card} answer={answer} />
                ) : (
                  <div className="mt-2 whitespace-pre-line break-keep text-[15px] leading-7 text-slate-700">
                    {answerPreview || "답변 내용이 없어요."}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatChip icon={<FiEye />} value={item?.stats?.viewCount || 0} />
                <StatChip icon={<FiMessageCircle />} value={item?.stats?.answerCount || 0} />
                <StatChip icon={<FiHeart />} value={item?.stats?.likeCount || 0} />
              </div>

              {reactedType ? (
                <div className="mt-4 rounded-md bg-slate-100 px-3 py-3 text-[13px] font-medium text-slate-500">
                  이미 {reactedType === "like" ? "심쿵" : "읽씹각"} 반응을 남긴 답변이에요.
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClickReport}
                className="inline-flex h-[48px] items-center justify-center rounded-md border border-slate-300 px-4 text-[14px] font-medium text-slate-600 hover:bg-slate-50"
                style={{ cursor: "pointer" }}
              >
                신고
              </button>

              <div className="ml-auto flex items-center gap-3">
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
                ) : null}

                <button
                  type="button"
                  onClick={onClickProfile}
                  className="inline-flex h-[48px] items-center gap-2 rounded-md bg-violet-600 px-4 text-[14px] font-semibold text-white hover:bg-violet-700"
                  style={{ cursor: "pointer" }}
                >
                  프로필 보기
                  <FiChevronRight className="text-[16px]" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-[48px] items-center justify-center rounded-md border border-slate-300 px-4 text-[14px] font-medium text-slate-600 hover:bg-slate-50"
                  style={{ cursor: "pointer" }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
  const isChoice = isChoiceQuestion(card?.questionType || answer?.questionType || "");
  const answerPreview = isChoice
    ? answer?.selectedOptionText || ""
    : answer?.answerText || "";

  const categoryLabel =
    CARD_CATEGORY_LABEL?.[card?.category] || card?.category || "카테고리";

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClickCard}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          style={{ cursor: "pointer" }}
        >
          <ProfileAvatar src={profileImage} alt="프로필" />

          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium text-slate-600">
              {answerer?.nickname || answer?.answererNickname || "프로필"}
              {age ? ` · ${age}세` : ""}
            </div>
            {/* <div className="mt-0.5 text-[12px] text-slate-400">
              답변자 프로필
            </div> */}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClickReport}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-500"
            style={{ cursor: "pointer" }}
          >
            <FiAlertCircle className="text-[13px]" />
            신고
          </button>

          <span className="rounded-md border border-slate-300 bg-slate-100 px-3 py-[7px] text-[12px] font-medium text-slate-600">
            {categoryLabel}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClickCard}
        className="mt-4 block w-full text-left"
        style={{ cursor: "pointer" }}
      >
        <div className="text-[18px] font-bold leading-7 tracking-[-0.03em] text-slate-800">
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
          <div className="mr-auto rounded-md bg-slate-100 px-3 py-2 text-[13px] font-medium text-slate-500">
            이미 확인하고 반응한 답변이에요
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
  const [detailItem, setDetailItem] = useState(null);
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

    const baseSorted = (() => {
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
    })();

    return baseSorted.sort((a, b) => {
      const aReacted = reactionMap?.[a?.answer?.id] ? 1 : 0;
      const bReacted = reactionMap?.[b?.answer?.id] ? 1 : 0;
      return aReacted - bReacted;
    });
  }, [activeTab, filteredItems, reactionMap]);

  const visibleItems = useMemo(
    () => sortedItems.slice(0, visibleCount),
    [sortedItems, visibleCount]
  );

  const hasMore = visibleCount < sortedItems.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, items, localReportedUids, reactionMap]);

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

  const reactedCount = useMemo(() => {
    return Object.keys(reactionMap || {}).length;
  }, [reactionMap]);

  const latestCount = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return filteredItems.filter(
      (item) => toMillis(item?.answer?.updatedAt || item?.answer?.createdAt) >= oneDayAgo
    ).length;
  }, [filteredItems]);

  const buildPendingReviewQueue = (list = []) => {
    return (list || [])
      .filter((row) => {
        const answerId = row?.answer?.id || "";
        return answerId && !reactionMap?.[answerId];
      })
      .map((row) => ({
        answerId: row?.answer?.id || "",
        cardId: row?.card?.id || "",
        answererUid: row?.answer?.answererUid || "",
      }))
      .filter((row) => row.answerId && row.cardId);
  };

  const moveToPendingAnswerPage = (item) => {
    const answerId = item?.answer?.id || "";
    const cardId = item?.card?.id || "";

    if (!answerId || !cardId) return;

    const pendingQueue = buildPendingReviewQueue(sortedItems);
    const currentIndex = pendingQueue.findIndex((row) => row.answerId === answerId);

    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "femaleCardReviewQueue",
          JSON.stringify({
            items: pendingQueue,
            currentAnswerId: answerId,
            savedAt: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error("[FemaleCardListView] queue save error:", error);
    }

    router.push({
      pathname: `/cards/${cardId}`,
      query: {
        from: "female-review",
        answerId,
        queueIndex: currentIndex >= 0 ? String(currentIndex) : "0",
      },
    });
  };

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

      if (detailItem?.answer?.id === answerId) {
        setDetailItem(item);
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
            reportTargetItem?.answerer?.nickname ||
            reportTargetItem?.answer?.answererNickname ||
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
      setDetailItem(null);
      setReportDoneOpen(true);
    } catch (error) {
      console.error("[FemaleCardListView] report error:", error);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenProfileDetail = async () => {
    const targetUid = selectedItem?.answer?.answererUid || detailItem?.answer?.answererUid || "";
    if (!usageDocRef || !targetUid || !canOpenDetail) {
      setSelectedItem(null);
      setDetailItem(null);
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
      setDetailItem(null);
      window.location.href = `/arena/${targetUid}`;
    } catch (error) {
      console.error("[FemaleCardListView] profile detail error:", error);
      setSelectedItem(null);
      setDetailItem(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <div className="shrink-0">
        <CardListHeader
          title="차밍카드 답변리뷰"
          desc=""
          showCreateButton={true}
        />
        <CardListTabs activeTab={activeTab} tabs={FEMALE_TABS} onClickTab={setActiveTab} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex min-h-full flex-col gap-3">
          <SummaryCard
            totalCount={filteredItems.length}
            reactedCount={reactedCount}
            latestCount={latestCount}
            remainingProfileDetailCount={remainingProfileDetailCount}
          />

          {visibleItems.length > 0 ? (
            <div className="space-y-3 pb-2">
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
                    onClickCard={() => {
                      const answerId = item?.answer?.id || "";
                      const reactedType = reactionMap?.[answerId] || "";

                      if (reactedType) {
                        setDetailItem(item);
                        return;
                      }

                      moveToPendingAnswerPage(item);
                    }}
                    onClickProfile={() => setSelectedItem(item)}
                    onClickLike={() => handleReaction(item, "like")}
                    onClickDislike={() => handleReaction(item, "dislike")}
                    onClickReport={() => setReportTargetItem(item)}
                  />
                );
              })}

              <div ref={sentinelRef} className="h-8 w-full" />

              {hasMore ? (
                <div className="pb-2 text-center text-[13px] text-slate-400">
                  더 불러오는 중...
                </div>
              ) : (
                <div className="pb-2 text-center text-[13px] text-slate-400">
                  마지막 답변까지 모두 확인했어요.
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1">
              <EmptyReviewState activeTab={activeTab} />
            </div>
          )}
        </div>
      </div>

      <FemaleAnswerDetailModal
        open={!!detailItem}
        item={detailItem}
        reactedType={reactionMap?.[detailItem?.answer?.id] || ""}
        onClose={() => setDetailItem(null)}
        onClickLike={() => handleReaction(detailItem, "like")}
        onClickDislike={() => handleReaction(detailItem, "dislike")}
        onClickProfile={() => {
          setSelectedItem(detailItem);
          setDetailItem(null);
        }}
        onClickReport={() => {
          setReportTargetItem(detailItem);
          setDetailItem(null);
        }}
      />

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
        answererName={
          reportTargetItem?.answerer?.nickname ||
          reportTargetItem?.answer?.answererNickname ||
          "사용자"
        }
        onClose={() => {
          if (reportSubmitting) return;
          setReportTargetItem(null);
        }}
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