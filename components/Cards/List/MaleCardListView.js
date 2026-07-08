import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { FiCheckCircle, FiRefreshCw } from "react-icons/fi";

import CardListHeader from "./CardListHeader";
import CardListTabs, { getMaleTabs } from "./CardListTabs";
import CardListItem from "./CardListItem";
import { CARD_SORT_TABS } from "./cardListMeta";
import { sortCards } from "./cardListUtils";

export default function MaleCardListView({
  cards,
  answeredCardIds,
  showPendingForDev = false,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("recommended");

  const answeredIdsSet = useMemo(
    () => new Set(answeredCardIds || []),
    [answeredCardIds]
  );

  const visibleCards = useMemo(
    () => sortCards(cards || [], activeTab, answeredIdsSet),
    [cards, activeTab, answeredIdsSet]
  );

  const tabs = getMaleTabs();
  const activeTabLabel =
    CARD_SORT_TABS.find((item) => item.key === activeTab)?.label || "추천순";

  const answeredCount = useMemo(() => {
    return (cards || []).filter((card) => answeredIdsSet.has(card.id)).length;
  }, [cards, answeredIdsSet]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <div className="shrink-0">
        <CardListHeader
          title="차밍카드 답변하기"
          desc={"내 연애관을 자연스럽게 보여주고 이성에게 어필해보세요."}
          showCreateButton={false}
        />
        <CardListTabs
          activeTab={activeTab}
          tabs={tabs}
          onClickTab={setActiveTab}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex min-h-full flex-col gap-3">
          <div className="mb-2 rounded-md border border-solid border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#a9caff_150%)] px-3 py-3 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-3">
            <div className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900 my-2">
              답변할수록 프로필 매력 UP!
            </div>
              <div>
                <div className="shrink-0 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-indigo-700">
                  완료 {answeredCount}개
                </div>
                {/* <div className="break-keep text-[13px] leading-5 text-slate-500">
                  이미 답변한 카드는 다시 눌러서 내 답변을 확인할 수 있고,
                  <br />
                  아직 안 한 카드는 바로 작성하러 들어갈 수 있어요.
                </div> */}
              </div>

            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="text-[13px] font-medium text-slate-500">
              {activeTabLabel} 결과
            </div>
            <div className="text-[13px] font-semibold text-slate-700">
              {visibleCards.length}개
            </div>
          </div>

          {visibleCards.length > 0 ? (
            <div className="space-y-3 pb-2">
              <AnimatePresence initial={false}>
                {visibleCards.map((card) => {
                  const answered = answeredIdsSet.has(card.id);

                  return (
                    <motion.div
                      key={`${activeTab}-${card.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <CardListItem
                        card={card}
                        answered={answered}
                        isLocked={false}
                        actionMode={answered ? "answered" : "write"}
                        onCardClick={() =>
                          answered
                            ? router.push(`/cards/${card.id}?mode=mine`)
                            : router.push(`/cards/${card.id}/answer`)
                        }
                        onLockedClick={() => { }}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-1 items-center">
              <div className="w-full rounded-md border border-slate-200 bg-white px-5 py-10 text-center shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                  {answeredCount > 0 ? (
                    <FiCheckCircle className="text-[24px]" />
                  ) : (
                    <FiRefreshCw className="text-[24px]" />
                  )}
                </div>

                <div className="mt-4 text-[19px] font-bold tracking-[-0.02em] text-slate-900">
                  {answeredCount > 0
                    ? "지금은 더 답변할 카드가 없어요"
                    : "아직 노출할 차밍카드가 없어요"}
                </div>

                <div className="mt-2 break-keep text-[14px] leading-6 text-slate-500">
                  {answeredCount > 0
                    ? "조금 뒤 다시 들어오면 새로운 카드가 추가될 수 있어요."
                    : "운영 승인 후 카드가 보이기 시작하면 여기에서 바로 답변할 수 있어요."}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}