import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PiCardsDuotone,
  PiSparkleDuotone,
  PiPlusBold,
  PiArrowsClockwiseBold,
} from "react-icons/pi";
import {
  ActionButton,
  EmptyBlock,
  MiniBadge,
  OutlineButton,
  SectionCard,
} from "../AdminCommon";
import {
  buildRecommendedDrafts,
  formatDateTime,
  getQuestionTypeLabel,
  normalizeQuestionType,
  CARD_REJECTION_REASONS,
} from "../adminUtils";

import { getFunctions, httpsCallable } from "firebase/functions";

const CATEGORY_LABEL_MAP = {
  sense: "센스",
  value: "가치관",
  date: "연애",
  lifestyle: "생활",
  marriage: "결혼관",
};

const CATEGORY_PRIORITY_ORDER = ["sense", "value", "date", "lifestyle", "marriage"];

function collectTopicKeys(list = []) {
  return Array.from(
    new Set(
      (Array.isArray(list) ? list : [])
        .map((item) => String(item?.topicKey || "").trim())
        .filter(Boolean)
    )
  );
}

function pickRareCategoryHint(existingCards = [], currentDrafts = []) {
  const usageMap = CATEGORY_PRIORITY_ORDER.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  [...existingCards, ...currentDrafts].forEach((item) => {
    const category = String(item?.category || "").trim();
    if (usageMap[category] !== undefined) {
      usageMap[category] += 1;
    }
  });

  return CATEGORY_PRIORITY_ORDER.slice().sort((a, b) => usageMap[a] - usageMap[b])[0] || "";
}

function buildSeedJump(seedIndex = 0) {
  return ((seedIndex * 31 + Date.now()) % 89) + 17;
}

function PendingCardItem({
  item,
  onApprove,
  onReject,
  approvingId,
  rejectingId,
}) {
  const cardId = item.id;
  const questionType = normalizeQuestionType(item.questionType);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <MiniBadge tone="violet">{getQuestionTypeLabel(questionType)}</MiniBadge>
        <MiniBadge>{item.categoryLabel || item.category || "-"}</MiniBadge>
        <MiniBadge>{item.visibilityTarget || "male"}</MiniBadge>
      </div>

      <div className="mt-3 text-[18px] font-bold tracking-[-0.02em] text-slate-900">
        {item.title || "제목 없음"}
      </div>

      {item.body ? (
        <div className="mt-2 break-keep text-[14px] leading-6 text-slate-600">
          {item.body}
        </div>
      ) : null}

      {questionType === "choice" && Array.isArray(item.options) && item.options.length ? (
        <div className="mt-3 space-y-2">
          {item.options.map((option, index) => (
            <div
              key={`${item.id}-${index}`}
              className="rounded-md bg-slate-50 px-3 py-2 text-[13px] text-slate-700"
            >
              {index + 1}. {option}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 text-[12px] text-slate-400">
        생성일: {formatDateTime(item.createdAt || item.updatedAt)}
      </div>

      <div className="mt-4 space-y-2">
        <select
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-800 outline-none"
        >
          <option value="">반려 사유 선택</option>
          {CARD_REJECTION_REASONS.map((reason) => (
            <option key={reason.code} value={reason.code}>
              {reason.label}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            onClick={onApprove}
            tone="green"
            disabled={approvingId === cardId}
          >
            {approvingId === cardId ? "승인 중..." : "카드 승인"}
          </ActionButton>
          <OutlineButton
            onClick={() => onReject(rejectReason)}
            disabled={rejectingId === cardId}
          >
            {rejectingId === cardId ? "반려 중..." : "반려"}
          </OutlineButton>
        </div>
      </div>
    </div>
  );
}

function DraftEditor({
  item,
  index,
  onChangeField,
  onChangeOption,
  onRemove,
  onRefreshAI,
  refreshingDraftId,
}) {
  const questionType = normalizeQuestionType(item.questionType);

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <MiniBadge tone="violet">추천 초안 {index + 1}</MiniBadge>
          <MiniBadge>{item.categoryLabel || item.category || "-"}</MiniBadge>
          <MiniBadge>{getQuestionTypeLabel(questionType)}</MiniBadge>
          <MiniBadge>{item.source === "ai" ? "AI추천" : item.source || "로컬추천"}</MiniBadge>
          {item.topicKey ? <MiniBadge>{item.topicKey}</MiniBadge> : null}
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          style={{ cursor: "pointer" }}
          className="text-[13px] font-semibold text-slate-500 hover:text-slate-800"
        >
          삭제
        </button>
      </div>

      <div className="space-y-3">
        <input
          value={item.title}
          onChange={(e) => onChangeField(item.id, "title", e.target.value)}
          placeholder="제목"
          className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[14px] outline-none"
        />

        <textarea
          value={item.body}
          onChange={(e) => onChangeField(item.id, "body", e.target.value)}
          rows={3}
          placeholder="본문"
          className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-3 text-[14px] outline-none"
        />

        <textarea
          value={item.guide}
          onChange={(e) => onChangeField(item.id, "guide", e.target.value)}
          rows={2}
          placeholder="가이드"
          className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-3 text-[13px] outline-none"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={questionType}
            onChange={(e) => onChangeField(item.id, "questionType", e.target.value)}
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-[14px] outline-none"
          >
            <option value="choice">선택형</option>
            <option value="text">주관식</option>
          </select>

          <select
            value={item.category || "sense"}
            onChange={(e) => {
              const value = e.target.value;
              onChangeField(item.id, "category", value);
              onChangeField(item.id, "categoryLabel", CATEGORY_LABEL_MAP[value] || "기타");
            }}
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-[14px] outline-none"
          >
            <option value="sense">센스</option>
            <option value="value">가치관</option>
            <option value="date">연애</option>
            <option value="lifestyle">생활</option>
            <option value="marriage">결혼관</option>
          </select>
        </div>

        {questionType === "choice" ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((optionIndex) => (
              <input
                key={`${item.id}-${optionIndex}`}
                value={item.options?.[optionIndex] || ""}
                onChange={(e) =>
                  onChangeOption(item.id, optionIndex, e.target.value)
                }
                placeholder={`선택지 ${optionIndex + 1}`}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none"
              />
            ))}
          </div>
        ) : null}

        {item.viralWhy ? (
          <div className="rounded-md border border-violet-100 bg-violet-50 px-3 py-2 text-[12px] leading-5 text-violet-700">
            왜 이슈가 되기 쉬운가: {item.viralWhy}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <OutlineButton
            onClick={() => onRefreshAI(item)}
            disabled={refreshingDraftId === item.id}
          >
            <div className="flex items-center gap-2">
              <PiArrowsClockwiseBold className="text-[14px]" />
              <span>
                {refreshingDraftId === item.id ? "AI 추천 중..." : "AI로 다시 추천"}
              </span>
            </div>
          </OutlineButton>
        </div>
      </div>
    </div>
  );
}

async function requestAIDrafts({
  count,
  existingCards,
  currentDrafts,
  excludedTopicKeys = [],
  categoryHint = "",
}) {
  try {
    const functions = getFunctions(undefined, "asia-northeast3");
    const recommendAdminCards = httpsCallable(functions, "recommendAdminCards");

    const result = await recommendAdminCards({
      count,
      existingCards,
      currentDrafts,
      excludedTopicKeys,
      categoryHint,
    });

    const data = result?.data || {};

    if (!data?.ok) {
      throw new Error(data?.message || "AI 추천 초안 생성에 실패했어요.");
    }

    return {
      drafts: Array.isArray(data?.drafts) ? data.drafts : [],
      quotaExceeded: !!data?.quotaExceeded,
      source: data?.source || "ai",
    };
  } catch (error) {
    console.error("[CardApprovalTab] requestAIDrafts error:", error);

    return {
      drafts: [],
      quotaExceeded: false,
      source: "fallback",
      errorMessage: error?.message || "AI 추천 요청 실패",
    };
  }
}

export default function CardApprovalTab({
  pendingCards,
  existingCards,
  onApproveCard,
  onRejectCard,
  busyApproveCardId,
  busyRejectCardId,
  generatedCards,
  setGeneratedCards,
  onSaveGeneratedCards,
  savingGeneratedCards,
}) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [addingOne, setAddingOne] = useState(false);
  const [loadingInitialDrafts, setLoadingInitialDrafts] = useState(false);
  const [refreshingDraftId, setRefreshingDraftId] = useState("");

  const seedRef = useRef(0);

  const allTopicKeys = useMemo(
    () => collectTopicKeys([...existingCards, ...generatedCards]),
    [existingCards, generatedCards]
  );

  const rareCategoryHint = useMemo(
    () => pickRareCategoryHint(existingCards, generatedCards),
    [existingCards, generatedCards]
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (bootstrapped) return;
      if (generatedCards.length > 0) {
        setBootstrapped(true);
        return;
      }

      setLoadingInitialDrafts(true);

      try {
        const aiResult = await requestAIDrafts({
          count: 4,
          existingCards,
          currentDrafts: [],
          excludedTopicKeys: allTopicKeys,
          categoryHint: rareCategoryHint,
        });

        const aiDrafts = Array.isArray(aiResult?.drafts) ? aiResult.drafts : [];

        if (!cancelled && aiDrafts.length > 0) {
          setGeneratedCards(aiDrafts);
          setBootstrapped(true);
          return;
        }

        const fallback = buildRecommendedDrafts({
          count: 4,
          existingCards,
          currentDrafts: [],
          seedStart: seedRef.current,
          categoryHint: rareCategoryHint,
          excludedTopicKeys: allTopicKeys,
        });

        seedRef.current += buildSeedJump(seedRef.current);

        if (!cancelled) {
          setGeneratedCards(fallback);
          setBootstrapped(true);
        }
      } catch (error) {
        console.error("[CardApprovalTab] initial ai draft error:", error);

        const fallback = buildRecommendedDrafts({
          count: 4,
          existingCards,
          currentDrafts: [],
          seedStart: seedRef.current,
          categoryHint: rareCategoryHint,
          excludedTopicKeys: allTopicKeys,
        });

        seedRef.current += buildSeedJump(seedRef.current);

        if (!cancelled) {
          setGeneratedCards(fallback);
          setBootstrapped(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingInitialDrafts(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    bootstrapped,
    existingCards,
    generatedCards.length,
    setGeneratedCards,
    allTopicKeys,
    rareCategoryHint,
  ]);

  const handleFieldChange = (id, field, value) => {
    setGeneratedCards((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            [field]:
              field === "questionType" ? normalizeQuestionType(value) : value,
          }
          : item
      )
    );
  };

  const handleOptionChange = (id, index, value) => {
    setGeneratedCards((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextOptions = Array.isArray(item.options)
          ? [...item.options]
          : ["", "", "", ""];
        nextOptions[index] = value;
        return { ...item, options: nextOptions };
      })
    );
  };

  const handleRemoveDraft = (id) => {
    setGeneratedCards((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddOne = async () => {
    try {
      setAddingOne(true);

      const excludedTopicKeys = collectTopicKeys([...existingCards, ...generatedCards]);
      const categoryHint = pickRareCategoryHint(existingCards, generatedCards);

      const aiResult = await requestAIDrafts({
        count: 1,
        existingCards,
        currentDrafts: generatedCards,
        excludedTopicKeys,
        categoryHint,
      });

      const aiDrafts = Array.isArray(aiResult?.drafts) ? aiResult.drafts : [];

      if (aiDrafts.length > 0) {
        setGeneratedCards((prev) => [...prev, ...aiDrafts]);
        return;
      }

      const fallback = buildRecommendedDrafts({
        count: 1,
        existingCards,
        currentDrafts: generatedCards,
        seedStart: seedRef.current,
        categoryHint,
        excludedTopicKeys,
      });

      seedRef.current += buildSeedJump(seedRef.current);

      if (fallback.length) {
        setGeneratedCards((prev) => [...prev, ...fallback]);
      } else {
        alert("중복되지 않는 새 추천을 더 만들지 못했어요.");
      }
    } catch (error) {
      console.error("[CardApprovalTab] add ai draft error:", error);

      const excludedTopicKeys = collectTopicKeys([...existingCards, ...generatedCards]);
      const categoryHint = pickRareCategoryHint(existingCards, generatedCards);

      const fallback = buildRecommendedDrafts({
        count: 1,
        existingCards,
        currentDrafts: generatedCards,
        seedStart: seedRef.current,
        categoryHint,
        excludedTopicKeys,
      });

      seedRef.current += buildSeedJump(seedRef.current);

      if (fallback.length) {
        setGeneratedCards((prev) => [...prev, ...fallback]);
      } else {
        alert("새 추천을 만들지 못했어요.");
      }
    } finally {
      setAddingOne(false);
    }
  };

  const handleRefreshAI = async (item) => {
    try {
      setRefreshingDraftId(item.id);

      const compareDrafts = generatedCards.filter((draft) => draft.id !== item.id);
      const excludedTopicKeys = collectTopicKeys([...existingCards, ...compareDrafts]);
      const categoryHint = pickRareCategoryHint(existingCards, compareDrafts);

      const aiResult = await requestAIDrafts({
        count: 1,
        existingCards,
        currentDrafts: compareDrafts,
        excludedTopicKeys,
        categoryHint,
      });

      const aiDrafts = Array.isArray(aiResult?.drafts) ? aiResult.drafts : [];

      if (aiDrafts.length > 0) {
        setGeneratedCards((prev) =>
          prev.map((draftItem) =>
            draftItem.id === item.id ? aiDrafts[0] : draftItem
          )
        );
        return;
      }

      const fallback = buildRecommendedDrafts({
        count: 1,
        existingCards,
        currentDrafts: compareDrafts,
        seedStart: seedRef.current,
        categoryHint,
        excludedTopicKeys,
      });

      seedRef.current += buildSeedJump(seedRef.current);

      if (!fallback.length) {
        alert("중복되지 않는 새 추천을 만들지 못했어요.");
        return;
      }

      setGeneratedCards((prev) =>
        prev.map((draftItem) =>
          draftItem.id === item.id ? fallback[0] : draftItem
        )
      );
    } catch (error) {
      console.error("[CardApprovalTab] refresh ai draft error:", error);
      alert("AI 추천 중 문제가 발생했어요.");
    } finally {
      setRefreshingDraftId("");
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        icon={PiCardsDuotone}
        title="차밍카드 승인"
        description="여성 회원이 등록한 카드 승인/반려를 처리해요."
      >
        {pendingCards.length ? (
          <div className="space-y-3">
            {pendingCards.map((item) => (
              <PendingCardItem
                key={item.id}
                item={item}
                onApprove={() => onApproveCard(item)}
                onReject={(reasonCode) => onRejectCard(item, reasonCode)}
                approvingId={busyApproveCardId}
                rejectingId={busyRejectCardId}
              />
            ))}
          </div>
        ) : (
          <EmptyBlock text="현재 승인 대기 중인 차밍카드가 없어요." />
        )}
      </SectionCard>

      <SectionCard
        icon={PiSparkleDuotone}
        title="추천 초안"
        description="AI가 이슈형 연애 질문을 다양하게 추천해줘요. 비슷한 주제는 topicKey 기준으로 최대한 걸러냅니다."
      >
        <div className="grid grid-cols-2 gap-2">
          <OutlineButton onClick={handleAddOne} disabled={addingOne || loadingInitialDrafts}>
            <div className="flex items-center gap-2">
              <PiPlusBold className="text-[14px]" />
              <span>{addingOne ? "AI 추천 중..." : "카드 1개 더 추가"}</span>
            </div>
          </OutlineButton>

          <ActionButton
            onClick={onSaveGeneratedCards}
            tone="green"
            disabled={savingGeneratedCards || !generatedCards.length || loadingInitialDrafts}
          >
            {savingGeneratedCards ? "승인 생성 중..." : "전체 승인 후 생성"}
          </ActionButton>
        </div>

        <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-[12px] leading-5 text-slate-500">
          최근 추천은 <span className="font-semibold text-slate-700">{rareCategoryHint || "-"}</span> 카테고리를 우선 보강하고 있어요.
          중복 방지를 위해 같은 topicKey는 다시 추천하지 않도록 처리합니다.
        </div>

        <div className="mt-3 space-y-3">
          {loadingInitialDrafts ? (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-[14px] text-slate-500">
              AI가 차밍카드 초안을 만들고 있어요...
            </div>
          ) : generatedCards.length ? (
            generatedCards.map((item, index) => (
              <DraftEditor
                key={item.id}
                item={item}
                index={index}
                onChangeField={handleFieldChange}
                onChangeOption={handleOptionChange}
                onRemove={handleRemoveDraft}
                onRefreshAI={handleRefreshAI}
                refreshingDraftId={refreshingDraftId}
              />
            ))
          ) : (
            <EmptyBlock text="추천 초안이 없어요. 카드 1개 더 추가 버튼으로 새 초안을 만들 수 있어요." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}