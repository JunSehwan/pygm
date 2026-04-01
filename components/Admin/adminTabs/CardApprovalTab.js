import React, { useEffect, useRef, useState } from "react";
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
              const labelMap = {
                sense: "센스",
                value: "가치관",
                date: "연애",
                lifestyle: "생활",
                marriage: "결혼관",
              };
              onChangeField(item.id, "category", value);
              onChangeField(item.id, "categoryLabel", labelMap[value] || "기타");
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

async function requestAIDrafts({ count, existingCards, currentDrafts }) {
  try {
    const response = await fetch("/api/admin/cards/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        count,
        existingCards,
        currentDrafts,
      }),
    });

    const text = await response.text();

    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(
        `AI 추천 API 응답이 JSON이 아니에요. status=${response.status}, body=${text.slice(0, 120)}`
      );
    }

    if (!response.ok || !data?.ok) {
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
          count: 2,
          existingCards,
          currentDrafts: [],
        });

        const aiDrafts = Array.isArray(aiResult?.drafts) ? aiResult.drafts : [];

        if (!cancelled && aiDrafts.length > 0) {
          setGeneratedCards(aiDrafts);
          setBootstrapped(true);
          return;
        }

        const fallback = buildRecommendedDrafts({
          count: 2,
          existingCards,
          currentDrafts: [],
          seedStart: seedRef.current,
        });

        seedRef.current += 20;

        if (!cancelled) {
          setGeneratedCards(fallback);
          setBootstrapped(true);
        }
      } catch (error) {
        console.error("[CardApprovalTab] initial ai draft error:", error);

        const fallback = buildRecommendedDrafts({
          count: 2,
          existingCards,
          currentDrafts: [],
          seedStart: seedRef.current,
        });

        seedRef.current += 20;

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
  }, [bootstrapped, existingCards, generatedCards.length, setGeneratedCards]);

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

      const aiResult = await requestAIDrafts({
        count: 1,
        existingCards,
        currentDrafts: generatedCards,
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
      });

      seedRef.current += 20;

      if (fallback.length) {
        setGeneratedCards((prev) => [...prev, ...fallback]);
      } else {
        alert("중복되지 않는 새 추천을 더 만들지 못했어요.");
      }
    } catch (error) {
      console.error("[CardApprovalTab] add ai draft error:", error);

      const fallback = buildRecommendedDrafts({
        count: 1,
        existingCards,
        currentDrafts: generatedCards,
        seedStart: seedRef.current,
      });

      seedRef.current += 20;

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

      const aiResult = await requestAIDrafts({
        count: 1,
        existingCards,
        currentDrafts: compareDrafts,
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
      });

      seedRef.current += 20;

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
        description="AI 추천 초안을 먼저 받고, 필요하면 다시 추천으로 다른 방향을 받아올 수 있어요."
      >
        <div className="grid grid-cols-2 gap-2">
          <OutlineButton onClick={handleAddOne} disabled={addingOne || loadingInitialDrafts}>
            <div className="flex items-center gap-2">
              <PiPlusBold className="text-[14px]" />
              <span>
                {addingOne ? "AI 추천 중..." : "카드 1개 더 추가"}
              </span>
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