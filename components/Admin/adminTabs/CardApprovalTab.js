import React, { useEffect, useState } from "react";
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

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <MiniBadge tone="violet">{getQuestionTypeLabel(questionType)}</MiniBadge>
        <MiniBadge>{item.categoryLabel || item.category || "-"}</MiniBadge>
        <MiniBadge>
          {item.creatorNickname || item.creatorUsername || item.creatorUid || "-"}
        </MiniBadge>
      </div>

      <div className="mt-3 text-[18px] font-bold text-slate-900">
        {item.title || "제목 없음"}
      </div>

      <div className="mt-2 break-keep text-[14px] leading-6 text-slate-600">
        {item.body || item.guide || "-"}
      </div>

      {questionType === "choice" && Array.isArray(item.options) && item.options.length ? (
        <div className="mt-3 rounded-md bg-slate-50 px-3 py-3 text-[13px] leading-6 text-slate-600">
          {item.options.map((opt, index) => (
            <div key={`${cardId}-${index}`}>
              {index + 1}. {opt}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 text-[12px] text-slate-400">
        생성일: {formatDateTime(item.createdAt || item.updatedAt)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionButton
          onClick={onApprove}
          tone="green"
          disabled={approvingId === cardId}
        >
          {approvingId === cardId ? "승인 중..." : "카드 승인"}
        </ActionButton>
        <OutlineButton onClick={onReject} disabled={rejectingId === cardId}>
          {rejectingId === cardId ? "반려 중..." : "반려"}
        </OutlineButton>
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
  onRefreshAi,
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
          <MiniBadge>{item.source === "ai" ? "AI" : "로컬"}</MiniBadge>
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
            onClick={() => onRefreshAi(item)}
            disabled={refreshingDraftId === item.id}
          >
            <div className="flex items-center gap-2">
              <PiArrowsClockwiseBold className="text-[14px]" />
              <span>
                {refreshingDraftId === item.id ? "AI 갱신 중..." : "AI로 갱신"}
              </span>
            </div>
          </OutlineButton>
        </div>
      </div>
    </div>
  );
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
  const [refreshingDraftId, setRefreshingDraftId] = useState("");

  useEffect(() => {
    if (bootstrapped) return;
    if (generatedCards.length > 0) {
      setBootstrapped(true);
      return;
    }

    const initialDrafts = buildRecommendedDrafts({
      count: 2,
      existingCards,
      currentDrafts: [],
    });

    setGeneratedCards(initialDrafts);
    setBootstrapped(true);
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

  const requestAiDraft = async ({ replaceDraftId = "", categoryHint = "" }) => {
    const response = await fetch("/api/admin/generate-card-draft", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        existingCards,
        currentDrafts: generatedCards,
        replaceDraftId,
        categoryHint,
      }),
    });

    const rawText = await response.text();

    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("[AI draft] non-json response:", rawText);
      throw new Error("API가 JSON이 아니라 HTML을 반환했어요. pages/api 경로나 서버 오류를 확인해주세요.");
    }

    if (!response.ok || !data?.ok) {
      throw new Error(data?.message || "AI 초안 생성에 실패했어요.");
    }

    return data.draft;
  };

  const handleAddOne = async () => {
    try {
      setAddingOne(true);
      const draft = await requestAiDraft({});
      setGeneratedCards((prev) => [...prev, draft]);
    } catch (error) {
      console.error("[CardApprovalTab] add one draft error:", error);
      alert(error.message || "카드 추가 추천 중 문제가 발생했어요.");
    } finally {
      setAddingOne(false);
    }
  };

  const handleRefreshAi = async (item) => {
    try {
      setRefreshingDraftId(item.id);
      const draft = await requestAiDraft({
        replaceDraftId: item.id,
        categoryHint: item.category,
      });

      setGeneratedCards((prev) =>
        prev.map((draftItem) => (draftItem.id === item.id ? draft : draftItem))
      );
    } catch (error) {
      console.error("[CardApprovalTab] refresh ai draft error:", error);
      alert(error.message || "AI 갱신 중 문제가 발생했어요.");
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
                onReject={() => onRejectCard(item)}
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
        description="처음에는 로컬 추천 2개가 자동으로 뜨고, 이후에는 AI로 1개씩 갱신하거나 추가할 수 있어요."
      >
        <div className="grid grid-cols-2 gap-2">
          <OutlineButton onClick={handleAddOne} disabled={addingOne}>
            <div className="flex items-center gap-2">
              <PiPlusBold className="text-[14px]" />
              <span>{addingOne ? "AI 추가 중..." : "카드 1개 더 추가"}</span>
            </div>
          </OutlineButton>

          <ActionButton
            onClick={onSaveGeneratedCards}
            tone="green"
            disabled={savingGeneratedCards || !generatedCards.length}
          >
            {savingGeneratedCards ? "승인 생성 중..." : "전체 승인 후 생성"}
          </ActionButton>
        </div>

        <div className="mt-3 space-y-3">
          {generatedCards.length ? (
            generatedCards.map((item, index) => (
              <DraftEditor
                key={item.id}
                item={item}
                index={index}
                onChangeField={handleFieldChange}
                onChangeOption={handleOptionChange}
                onRemove={handleRemoveDraft}
                onRefreshAi={handleRefreshAi}
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