import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import CardListHeader from "./CardListHeader";
import CardListTabs, { getSimpleTabs } from "./CardListTabs";
import CardListItem from "./CardListItem";
import CardLoginPromptModal from "./CardLoginPromptModal";
import TodayRecommendCard from "./TodayRecommendCard";
import { CARD_SORT_TABS } from "./cardListMeta";
import { getTodayRecommendCard, sortCards } from "./cardListUtils";

export default function GuestCardListView({ cards }) {
  const [activeTab, setActiveTab] = useState("recommended");
  const [modalOpen, setModalOpen] = useState(false);

  const answeredIdsSet = useMemo(() => new Set(), []);
  const visibleCards = useMemo(
    () => sortCards(cards || [], activeTab, answeredIdsSet),
    [cards, activeTab, answeredIdsSet]
  );
  const todayRecommendCard = useMemo(
    () => getTodayRecommendCard(cards || [], answeredIdsSet),
    [cards, answeredIdsSet]
  );

  const tabs = getSimpleTabs();
  const activeTabLabel =
    CARD_SORT_TABS.find((item) => item.key === activeTab)?.label || "추천순";

  const guestVisibleCount = 2;

  return (
    <>
      <div className="flex h-screen flex-col bg-slate-50 md:h-[760px]">
        <div className="shrink-0">
          <CardListHeader
            title="차밍카드 답변하기"
            desc={"내 연애관을 얼마나 이성이 공감할까요?\n가볍게 내 생각을 작성하고 이성의 어필을 받아보세요!"}
          />
          <CardListTabs
            activeTab={activeTab}
            tabs={tabs}
            onClickTab={() => setModalOpen(true)}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 pt-3">
            <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-[14px] leading-6 text-slate-600 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
              로그인하면 더 많은 질문 카드와 다양한 답변을 확인할 수 있어요.
            </div>
          </div>

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

          <TodayRecommendCard card={todayRecommendCard} onClick={() => setModalOpen(true)} />

          <div className="space-y-3 px-4 py-4">
            <AnimatePresence initial={false}>
              {visibleCards.map((card, index) => (
                <motion.div
                  key={`${activeTab}-${card.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <CardListItem
                    card={card}
                    answered={false}
                    isLocked={index >= guestVisibleCount}
                    actionMode="login"
                    onCardClick={() => setModalOpen(true)}
                    onLockedClick={() => setModalOpen(true)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {visibleCards.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-[15px] text-slate-500 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
                아직 노출할 차밍카드가 없어요.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <CardLoginPromptModal
        open={modalOpen}
        title="다양한 답변을 확인해봐요!"
        desc={
          "연애상황에 따른 다양한 답변을 확인해보고\n나도 답변을 남기면서\n가치관이 맞는 이성을 만나보아요!"
        }
        confirmText="로그인"
        onConfirm={() => {
          window.location.href = "/login?redirect=/cards/list";
        }}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}