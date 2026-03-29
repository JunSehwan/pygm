import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";

import CardListHeader from "./CardListHeader";
import CardListTabs, { getMaleTabs } from "./CardListTabs";
import CardListItem from "./CardListItem";
import TodayRecommendCard from "./TodayRecommendCard";
import { CARD_SORT_TABS } from "./cardListMeta";
import { getTodayRecommendCard, sortCards } from "./cardListUtils";

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

  const todayRecommendCard = useMemo(
    () => getTodayRecommendCard(cards || [], answeredIdsSet),
    [cards, answeredIdsSet]
  );

  const tabs = getMaleTabs();
  const activeTabLabel =
    CARD_SORT_TABS.find((item) => item.key === activeTab)?.label || "추천순";

  return (
    <div className="flex h-screen flex-col bg-slate-50 md:h-[760px]">
      <div className="shrink-0">
        <CardListHeader
          title="차밍카드 답변하기"
          desc={"내 연애관을 작성하고 이성의 어필을 받아보세요!"}
        />
        <CardListTabs
          activeTab={activeTab}
          tabs={tabs}
          onClickTab={setActiveTab}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* {showPendingForDev ? (
          <div className="px-4 pt-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-5 text-amber-700">
              개발용으로 승인대기 카드도 함께 보이도록 설정되어 있어요.
            </div>
          </div>
        ) : null} */}

        <div className="px-4 pt-3">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-medium text-slate-500">
              {activeTabLabel} 결과
            </div>
            <div className="text-[13px] font-semibold text-slate-700">
              {visibleCards.length}개
            </div>
          </div>
        </div>

        {/* <TodayRecommendCard
          card={todayRecommendCard}
          onClick={() => todayRecommendCard && router.push(`/cards/${todayRecommendCard.id}/answer`)}
        /> */}

        <div className="space-y-3 px-4 py-4">
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
                    onCardClick={() => router.push(`/cards/${card.id}/answer`)}
                    onLockedClick={() => { }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {visibleCards.length === 0 ? (
            <div className="rounded-md px-4 py-8 text-center text-[15px] text-slate-500 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
              아직 노출할 차밍카드가 없어요.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}