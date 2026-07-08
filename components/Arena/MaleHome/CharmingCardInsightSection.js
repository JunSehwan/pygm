import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import {
  FiArrowRight,
  FiBarChart2,
  FiMessageCircle,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";
import { PiHeartStraightFill, PiSparkleFill } from "react-icons/pi";

import { db } from "firebaseConfig";

const CARD_FETCH_LIMIT = 80;
const ANSWER_FETCH_CARD_LIMIT = 5;
const ANSWER_FETCH_LIMIT = 80;

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "string") return new Date(value).getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value?.seconds) return value.seconds * 1000;
  return 0;
}

function toNumber(value) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function formatCount(value) {
  const next = toNumber(value);
  if (next >= 10000) return `${Math.floor(next / 1000) / 10}만`;
  if (next >= 1000) return `${Math.floor(next / 100) / 10}천`;
  return next.toLocaleString();
}

function getCardTitle(card, fallback = "차밍카드") {
  return (
    String(card?.title || "").trim() ||
    String(card?.question || "").trim() ||
    String(card?.body || "").trim().slice(0, 42) ||
    fallback
  );
}

function getCardGuide(card) {
  return (
    String(card?.guide || "").trim() ||
    String(card?.body || "").trim() ||
    String(card?.content || "").trim() ||
    "연애 상황에 대한 생각을 통해 상대의 성향을 자연스럽게 볼 수 있어요."
  );
}

function getAnswerCount(card) {
  return toNumber(card?.answerCount || card?.answersCount || card?.reactionCount);
}

function getInterestCount(card) {
  return toNumber(
    card?.interestedCount || card?.likeCount || card?.heartCount || card?.likes
  );
}

function getViewCount(card) {
  return toNumber(card?.views || card?.viewCount);
}

function getIssueScore(card) {
  return getAnswerCount(card) * 4 + getInterestCount(card) * 5 + getViewCount(card) * 0.05;
}

function normalizeQuestionType(value) {
  const next = String(value || "").toLowerCase();
  if (["choice", "objective", "multiple", "select"].includes(next)) return "choice";
  if (["text", "subjective", "write"].includes(next)) return "text";
  return next || "choice";
}

function isChoiceCard(card) {
  return (
    normalizeQuestionType(card?.questionType) === "choice" &&
    Array.isArray(card?.options) &&
    card.options.length > 0
  );
}

function isVisibleMaleCard(card) {
  const status = String(card?.status || card?.adminApprovalStatus || "").toLowerCase();
  const visibilityTarget = String(card?.visibilityTarget || "male").toLowerCase();

  const approved =
    card?.isPublished === true ||
    status === "approved" ||
    status === "publish" ||
    status === "published";

  const visibleToMale =
    !visibilityTarget ||
    visibilityTarget === "male" ||
    visibilityTarget === "all" ||
    visibilityTarget === "men";

  return approved && visibleToMale;
}

function isMaleAnswer(answer) {
  const rawGender = String(answer?.answererGender || "").trim().toLowerCase();

  // 예전 데이터에 성별값이 비어있을 수 있어서, 비어있으면 노출 후보로 둔다.
  if (!rawGender) return true;

  return ["male", "man", "m", "남성", "남자"].includes(rawGender);
}

function answerPickedOption(answer, option, optionIndex) {
  if (Array.isArray(answer?.selectedOptionIndexes)) {
    return answer.selectedOptionIndexes.includes(optionIndex);
  }

  if (typeof answer?.selectedOptionIndex === "number") {
    return answer.selectedOptionIndex === optionIndex;
  }

  const selectedText = String(answer?.selectedOptionText || "");
  if (!selectedText) return false;

  return selectedText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .includes(option);
}

function buildOptionStats(card, answers = []) {
  if (!isChoiceCard(card)) return null;

  const cardAnswers = answers.filter(
    (answer) => answer?.cardId === card.id && isMaleAnswer(answer)
  );

  const total = cardAnswers.length;
  if (!total) return null;

  const options = (card.options || []).map((option, index) => {
    const count = cardAnswers.filter((answer) =>
      answerPickedOption(answer, option, index)
    ).length;

    return {
      option,
      count,
      percent: Math.round((count / total) * 100),
    };
  });

  const topOption = [...options].sort((a, b) => b.count - a.count)[0] || null;

  return {
    card,
    total,
    options,
    topOption,
  };
}

function getAnswerText(answer) {
  return String(answer?.answerText || answer?.content || answer?.text || "").trim();
}

function getRecentTextAnswers(answers = [], cardMap = {}) {
  return answers
    .filter((answer) => isMaleAnswer(answer))
    .map((answer) => {
      const text = getAnswerText(answer);
      if (text.length < 12) return null;

      return {
        id: answer.id,
        cardId: answer.cardId,
        cardTitle: getCardTitle(cardMap[answer.cardId] || {}, "차밍카드"),
        text,
        createdAt: answer.createdAt || answer.updatedAt || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    .slice(0, 2);
}

function truncateText(text, max = 74) {
  const next = String(text || "").replace(/\s+/g, " ").trim();
  if (next.length <= max) return next;
  return `${next.slice(0, max).trim()}…`;
}

function SectionShell({ children, className }) {
  return (
    <div
      className={cn(
        "rounded-md border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, label, title, desc, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {label ? (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
            {Icon ? <Icon className="text-[12px]" /> : null}
            {label}
          </div>
        ) : null}

        <div className="break-keep text-[17px] font-extrabold leading-6 tracking-[-0.03em] text-slate-950">
          {title}
        </div>

        {desc ? (
          <div className="mt-1.5 break-keep text-[12px] leading-5 text-slate-500">
            {desc}
          </div>
        ) : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-[58px] animate-pulse rounded-md bg-slate-100"
        />
      ))}
    </div>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-md border border-white/70 bg-white/75 px-3 py-2.5 text-center shadow-sm">
      <div className="text-[16px] font-bold leading-none text-slate-950">{value}</div>
      <div className="mt-1.5 text-[10px] font-bold text-slate-400">{label}</div>
    </div>
  );
}

function BestRow({ card, rank, answered, onClick }) {
  const answerCount = getAnswerCount(card);
  const interestCount = getInterestCount(card);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-md px-2 py-3 text-left transition hover:bg-violet-50"
      style={{ cursor: "pointer" }}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[13px] font-bold",
          rank === 1
            ? "bg-violet-600 text-white"
            : "bg-slate-100 text-slate-700 group-hover:bg-violet-100 group-hover:text-violet-700"
        )}
      >
        {rank}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-slate-800">
          {getCardTitle(card)}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span>답변 {formatCount(answerCount)}</span>
          <span className="text-slate-300">·</span>
          <span>호감 {formatCount(interestCount)}</span>
          <span className="text-slate-300">·</span>
          <span className={answered ? "text-violet-600" : "text-slate-500"}>
            {answered ? "답변완료" : "미답변"}
          </span>
        </div>
      </div>

      <FiArrowRight className="shrink-0 text-[16px] text-slate-300 group-hover:text-violet-500" />
    </button>
  );
}

function BestThreeCard({ cards, answeredIdsSet, onCardClick }) {
  if (!cards.length) return null;

  return (
    <SectionShell className="px-3 py-3">
      <div className="px-1 py-1">
        <SectionHeader
          icon={FiTrendingUp}
          label="BEST 3"
          title="지금 가장 반응 좋은 카드"
          desc="답변과 호감 반응이 많은 순서예요."
        />
      </div>

      <div className="mt-2 divide-y divide-slate-100">
        {cards.map((card, index) => (
          <BestRow
            key={card.id}
            card={card}
            rank={index + 1}
            answered={answeredIdsSet.has(card.id)}
            onClick={() => onCardClick(card)}
          />
        ))}
      </div>
    </SectionShell>
  );
}

function OptionBar({ optionItem }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-[12px]">
        <div className="min-w-0 truncate font-semibold text-slate-700">
          {optionItem.option}
        </div>
        <div className="shrink-0 font-black text-slate-900">{optionItem.percent}%</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-violet-500"
          style={{ width: `${Math.max(optionItem.percent, 4)}%` }}
        />
      </div>
    </div>
  );
}

function SplitChoiceCard({ item, onClick }) {
  if (!item) return null;

  const { card, total, options, topOption } = item;
  const visibleOptions = options.slice(0, 4);

  return (
    <SectionShell className="overflow-hidden">
      <button
        type="button"
        onClick={onClick}
        className="w-full px-4 py-4 text-left transition hover:bg-violet-50/40"
        style={{ cursor: "pointer" }}
      >
        <SectionHeader
          icon={FiBarChart2}
          label="답변 온도"
          title="의견이 갈리는 카드"
          desc="선택형 답변 비율만 깔끔하게 보여줘요."
          right={<FiArrowRight className="mt-1 text-[17px] text-slate-300" />}
        />

        <div className="mt-3 rounded-md bg-slate-50 px-3 py-3">
          <div className="break-keep text-[14px] font-extrabold leading-5 text-slate-900">
            {getCardTitle(card)}
          </div>
          <div className="mt-1.5 break-keep text-[12px] leading-5 text-slate-500">
            남성 답변 {formatCount(total)}개 기준
            {topOption ? (
              <>
                , 현재 1위는{" "}
                <span className="font-bold text-violet-700">
                  {truncateText(topOption.option, 18)}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {visibleOptions.map((optionItem, index) => (
            <OptionBar key={`${card.id}-option-${index}`} optionItem={optionItem} />
          ))}
        </div>
      </button>
    </SectionShell>
  );
}

function AnswerQuote({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md bg-slate-50 px-3 py-3 text-left transition hover:bg-violet-50"
      style={{ cursor: "pointer" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-[12px] font-bold text-violet-700">
          {truncateText(item.cardTitle, 30)}
        </div>
        <FiArrowRight className="shrink-0 text-[14px] text-slate-300" />
      </div>
      <div className="mt-2 break-keep text-[13px] leading-5 text-slate-700">
        “{truncateText(item.text, 72)}”
      </div>
    </button>
  );
}

function AnswerQuoteCard({ items, cardMap, onCardClick }) {
  if (!items.length) return null;

  return (
    <SectionShell className="px-4 py-4">
      <SectionHeader
        icon={FiMessageCircle}
        label="익명 답변"
        title="남자들의 한마디"
        desc="작성형 카드 답변 중 일부만 가볍게 보여줘요."
      />

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <AnswerQuote
            key={item.id}
            item={item}
            onClick={() => {
              const card = cardMap[item.cardId];
              if (card) onCardClick(card);
            }}
          />
        ))}
      </div>
    </SectionShell>
  );
}

function IssueRow({ card, rank, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-md px-3 py-4 text-left transition hover:bg-violet-50"
      style={{ cursor: "pointer" }}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[12px] font-black text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-700">
        {rank}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-slate-900">
          {getCardTitle(card)}
        </div>
        <div className="mt-1 text-[11px] font-semibold text-slate-500">
          답변 {formatCount(getAnswerCount(card))} · 호감 {formatCount(getInterestCount(card))}
        </div>
      </div>
    </button>
  );
}

function IssueTopFiveCard({ cards, onCardClick }) {
  if (!cards.length) return null;

  return (
    <SectionShell className="px-3 py-3">
      <div className="px-1 py-1">
        <SectionHeader
          icon={PiHeartStraightFill}
          label="TOP 5"
          title="이슈 카드 리스트"
          desc="가볍게 훑고 마음 가는 카드만 눌러보세요."
        />
      </div>

      <div className="mt-2 divide-y divide-slate-100">
        {cards.map((card, index) => (
          <IssueRow
            key={card.id}
            card={card}
            rank={index + 1}
            onClick={() => onCardClick(card)}
          />
        ))}
      </div>
    </SectionShell>
  );
}

export default function CharmingCardInsightSection({ user, onMoveCards }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cards, setCards] = useState([]);
  const [answers, setAnswers] = useState([]);

  const answeredIdsSet = useMemo(() => {
    const ids =
      user?.charmingCardAnsweredIds ||
      user?.answeredCardIds ||
      user?.answeredCharmingCardIds ||
      [];

    return new Set(Array.isArray(ids) ? ids : []);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function fetchPublishedCards() {
      const publishedQ = query(
        collection(db, "charmingCards"),
        where("isPublished", "==", true),
        limit(CARD_FETCH_LIMIT)
      );

      const publishedSnap = await getDocs(publishedQ);
      let cardDocs = publishedSnap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      // 예전 데이터에 isPublished 필드가 비어있는 경우를 대비한 보조 로딩
      if (!cardDocs.length) {
        const fallbackSnap = await getDocs(
          query(collection(db, "charmingCards"), limit(CARD_FETCH_LIMIT))
        );
        cardDocs = fallbackSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
      }

      return cardDocs.filter(isVisibleMaleCard);
    }

    async function load() {
      try {
        setLoading(true);
        setError("");

        const cardDocs = await fetchPublishedCards();
        const sortedCards = [...cardDocs].sort(
          (a, b) => getIssueScore(b) - getIssueScore(a)
        );

        const cardsForAnswerFetch = sortedCards
          .slice(0, ANSWER_FETCH_CARD_LIMIT)
          .filter((card) => card?.id);

        const answerGroups = await Promise.all(
          cardsForAnswerFetch.map(async (card) => {
            const answersQ = query(
              collection(db, "charmingCardAnswers"),
              where("cardId", "==", card.id),
              limit(ANSWER_FETCH_LIMIT)
            );

            const answerSnap = await getDocs(answersQ);
            return answerSnap.docs.map((item) => ({
              id: item.id,
              ...item.data(),
              cardId: item.data()?.cardId || card.id,
            }));
          })
        );

        if (!mounted) return;

        setCards(sortedCards);
        setAnswers(answerGroups.flat());
      } catch (loadError) {
        console.error("[CharmingCardInsightSection] load error:", loadError);
        if (!mounted) return;
        setError("차밍카드 이슈를 불러오지 못했어요.");
        setCards([]);
        setAnswers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const cardMap = useMemo(() => {
    return (cards || []).reduce((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {});
  }, [cards]);

  const bestCards = useMemo(() => cards.slice(0, 3), [cards]);

  const choiceStats = useMemo(() => {
    return cards
      .filter(isChoiceCard)
      .map((card) => buildOptionStats(card, answers))
      .filter(Boolean)
      .sort((a, b) => b.total - a.total)
      .slice(0, 1);
  }, [cards, answers]);

  const recentTextAnswers = useMemo(
    () => getRecentTextAnswers(answers, cardMap),
    [answers, cardMap]
  );

  const issueRows = useMemo(() => cards.slice(0, 5), [cards]);

  const totalAnswerCount = useMemo(
    () => cards.reduce((sum, card) => sum + getAnswerCount(card), 0),
    [cards]
  );

  const totalInterestCount = useMemo(
    () => cards.reduce((sum, card) => sum + getInterestCount(card), 0),
    [cards]
  );

  const moveToCard = (card) => {
    if (!card?.id) return;

    // arena 대기화면의 이슈 카드는 "내 답변 보기"가 아니라
    // "이 카드 답변/확인하기" 흐름으로 보내는 게 안전해요.
    //
    // 기존처럼 users.charmingCardAnsweredIds만 믿고
    // /cards/[cardId]?mode=mine 으로 보내면,
    // 예전 데이터/누락 데이터에서 실제 charmingCardAnswers 문서가 없어
    // "아직 내 답변을 찾지 못했어요" 화면이 뜰 수 있어요.
    //
    // /answer 페이지는 실제 답변 문서를 다시 조회해서
    // 이미 답변한 카드는 읽기/수정불가 상태로 보여주고,
    // 미답변 카드는 그대로 답변 작성 화면을 보여줘요.
    router.push(`/cards/${card.id}/answer`);
  };

  if (loading) {
    return (
      <section className="px-4 pb-4 pt-4">
        <SectionShell className="px-4 py-4">
          <SectionHeader
            icon={FiTrendingUp}
            label="차밍 라운지"
            title="요즘 뜨는 차밍카드"
            desc="남성 답변 흐름을 불러오고 있어요."
          />
          <div className="mt-4">
            <LoadingBlock />
          </div>
        </SectionShell>
      </section>
    );
  }

  if (error || !cards.length) {
    return (
      <section className="px-4 pb-4 pt-4">
        <SectionShell className="px-4 py-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-600">
            <FiRefreshCw className="text-[19px]" />
          </div>
          <div className="mt-3 text-[16px] font-extrabold text-slate-900">
            아직 보여줄 이슈가 없어요
          </div>
          <div className="mt-2 break-keep text-[13px] leading-5 text-slate-500">
            카드가 더 쌓이면 인기 카드와 답변 통계를 보여줄게요.
          </div>
          <button
            type="button"
            onClick={onMoveCards}
            className="mt-4 h-10 rounded-md bg-violet-600 px-4 text-[13px] font-bold text-white hover:bg-violet-700"
            style={{ cursor: "pointer" }}
          >
            차밍카드 보러가기
          </button>
        </SectionShell>
      </section>
    );
  }

  return (
    <section className="px-4 pb-4 pt-4">
      <div className="rounded-md border border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6f2ff_100%)] px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-700">
              <PiSparkleFill className="text-[12px]" />
              차밍 라운지
            </div>
            <h2 className="mt-3 break-keep text-[22px] font-bold leading-7 tracking-[-0.04em] text-slate-900">
              기다리는 동안,
              <br />
              차밍카드의 답변을 둘러보세요.
            </h2>
            <p className="mt-2 break-keep text-[13px] leading-5 text-slate-500">
              회원분들이 어떤 카드에 반응하는지
              <br />
              가볍게 훑어볼 수 있어요.
            </p>
          </div>

        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryPill label="공개 카드" value={formatCount(cards.length)} />
          <SummaryPill label="누적 답변" value={formatCount(totalAnswerCount)} />
          <SummaryPill label="호감 반응" value={formatCount(totalInterestCount)} />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <BestThreeCard
          cards={bestCards}
          answeredIdsSet={answeredIdsSet}
          onCardClick={moveToCard}
        />

        <SplitChoiceCard
          item={choiceStats[0]}
          onClick={() => {
            if (choiceStats[0]?.card) moveToCard(choiceStats[0].card);
          }}
        />

        <AnswerQuoteCard
          items={recentTextAnswers}
          cardMap={cardMap}
          onCardClick={moveToCard}
        />

        <IssueTopFiveCard cards={issueRows} onCardClick={moveToCard} />
      </div>
    </section>
  );
}