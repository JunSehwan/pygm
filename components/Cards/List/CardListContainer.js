import React, { useMemo } from "react";
import MaleCardListView from "./MaleCardListView";
import FemaleCardListView from "./FemaleCardListView";

function getSafePreviewCards(cards = []) {
  const safeCards = Array.isArray(cards) ? cards.filter(Boolean) : [];
  return safeCards.slice(0, 6);
}

function getCardTitle(card = {}, index = 0) {
  return (
    String(card?.title || "").trim() ||
    String(card?.question || "").trim() ||
    String(card?.body || "").trim().slice(0, 40) ||
    `차밍카드 ${index + 1}`
  );
}

function getCardGuide(card = {}) {
  return (
    String(card?.guide || "").trim() ||
    String(card?.body || "").trim() ||
    "재밌는 연애 상황에 대한 대처를 통해 상대의 가치관과 반응을 살펴볼 수 있어요."
  );
}

function InlineGuestCardListView({ cards = [] }) {
  const previewCards = useMemo(() => getSafePreviewCards(cards), [cards]);

  const handleLockedClick = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/signup";
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="shrink-0 px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.02em] text-slate-900">
              차밍카드
            </h1>
            <p className="mt-2 break-keep text-[14px] leading-6 text-slate-500">
              남성의 답변과 가치관을 보고
              <br />
              자연스럽게 호감을 느껴보세요.
            </p>
          </div>

          <div className="rounded-full bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-600">
            게스트 미리보기
          </div>
        </div>

        <div className="mt-4 rounded-md border border-violet-200 bg-violet-50 px-4 py-4">
          <div className="text-[16px] font-bold text-slate-900">
            로그인 없이 일부 카드만 미리 볼 수 있어요
          </div>
          <p className="mt-2 break-keep text-[13px] leading-6 text-slate-600">
            먼저 몇 개의 차밍카드를 확인해보고,
            <br />
            더 많은 답변과 프로필은 로그인 후 볼 수 있어요.
          </p>

          <button
            type="button"
            onClick={handleLockedClick}
            className="mt-4 inline-flex h-[44px] items-center justify-center rounded-md bg-violet-600 px-4 text-[14px] font-semibold text-white transition hover:bg-violet-700"
          >
            회원가입하고 계속 보기
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-24">
        <div className="space-y-3">
          {previewCards.length ? (
            previewCards.map((card, index) => {
              const locked = index >= 2;

              return (
                <button
                  key={card?.id || `guest-card-${index}`}
                  type="button"
                  onClick={locked ? handleLockedClick : undefined}
                  className="block w-full text-left"
                >
                  <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                    <div className={locked ? "pointer-events-none blur-[2px]" : ""}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                          차밍카드
                        </div>

                        <div className="text-[12px] font-medium text-slate-400">
                          미리보기
                        </div>
                      </div>

                      <div className="mt-3 break-keep text-[18px] font-bold leading-7 text-slate-900">
                        {getCardTitle(card, index)}
                      </div>

                      <p className="mt-2 break-keep text-[14px] leading-6 text-slate-600">
                        {getCardGuide(card)}
                      </p>
                    </div>

                    {locked ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/55">
                        <div className="rounded-md bg-white px-4 py-3 text-center shadow-[0_10px_30px_rgba(15,23,42,0.10)]">
                          <div className="text-[15px] font-bold text-slate-900">
                            로그인 후 계속 볼 수 있어요
                          </div>
                          <div className="mt-1 text-[12px] leading-5 text-slate-500">
                            더 많은 카드와 답변을 확인해보세요
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center">
              <div className="text-[16px] font-bold text-slate-900">
                아직 공개된 차밍카드가 없어요
              </div>
              <p className="mt-2 break-keep text-[13px] leading-6 text-slate-500">
                잠시 후 다시 확인해주세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CardListContainer({
  user,
  cards,
  answeredCardIds,
  showPendingForDev = false,
  femaleReviewItems = [],
  femaleReactionByAnswerId = {},
  femaleReportedAnswererUids = [],
}) {
  const isLoggedIn = !!user?.userID;
  const gender = user?.gender || "";

  const isMale =
    gender === "male" ||
    gender === "남성" ||
    gender === "man" ||
    gender === "M";

  const pageMode = !isLoggedIn ? "guest" : isMale ? "male" : "female";

  if (pageMode === "guest") {
    return <InlineGuestCardListView cards={cards} />;
  }

  if (pageMode === "male") {
    return (
      <MaleCardListView
        cards={cards}
        answeredCardIds={answeredCardIds}
        showPendingForDev={showPendingForDev}
      />
    );
  }

  return (
    <FemaleCardListView
      ownerUid={user?.userID || ""}
      items={femaleReviewItems}
      reactionByAnswerId={femaleReactionByAnswerId}
      reportedAnswererUids={femaleReportedAnswererUids}
    />
  );
}