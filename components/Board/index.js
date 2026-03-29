import React, { useMemo, useState } from "react";
import { PiSpinnerGapBold } from "react-icons/pi";

import BottomNavbar from "components/Common/BottomNavbar";
import BoardSection from "./BoardSection";
import BoardDetailModal from "./BoardDetailModal";
import BoardGuideModal from "./BoardGuideModal";

export default function BoardHome({
  user,
  loading,
  matchedItems = [],
  sentItems = [],
  receivedItems = [],
  sectionVisibility = {},
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const visibleSections = useMemo(() => {
    const sections = [];

    if (sectionVisibility?.showMatched) {
      sections.push({
        key: "matched",
        title: "매칭된 이성 ❤️",
        items: matchedItems,
        emptyTitle: "아직 매칭된 이성이 없어요.",
        emptyDescription:
          "조금만 기다려주세요.\n좋은 인연이 연결되면 여기에서 바로 볼 수 있어요.",
      });
    }

    if (sectionVisibility?.showSent) {
      sections.push({
        key: "sent",
        title: "내가 호감을 보낸 이성 ❤️",
        items: sentItems,
        emptyTitle: "아직 호감을 보낸 이성이 없어요.",
        emptyDescription:
          "마음에 드는 상대를 만나면\n여기에서 흐름을 확인할 수 있어요.",
      });
    }

    if (sectionVisibility?.showReceived) {
      sections.push({
        key: "received",
        title: "나에게 호감을 보낸 이성 ❤️",
        items: receivedItems,
        emptyTitle: "아직 내게 호감을 보낸 이성이 없어요.",
        emptyDescription:
          "조금만 기다려주세요.\n호감이 도착하면 여기에서 바로 확인할 수 있어요.",
      });
    }

    return sections;
  }, [matchedItems, sentItems, receivedItems, sectionVisibility]);

  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
        <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[18px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
          <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
            <div className="text-[24px] font-extrabold tracking-[-0.03em] text-zinc-900">
              매칭 보드
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
            {loading ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 text-slate-400">
                <PiSpinnerGapBold className="animate-spin text-[24px]" />
                <div className="text-[14px] font-medium">
                  보드를 불러오는 중이에요.
                </div>
              </div>
            ) : (
              <div className="space-y-7">
                {visibleSections.map((section) => (
                  <BoardSection
                    key={section.key}
                    title={section.title}
                    items={section.items}
                    emptyTitle={section.emptyTitle}
                    emptyDescription={section.emptyDescription}
                    onOpenItem={setSelectedItem}
                  />
                ))}
              </div>
            )}
          </div>

          <BottomNavbar />

          <BoardDetailModal
            open={!!selectedItem}
            item={selectedItem}
            viewer={user}
            onClose={() => setSelectedItem(null)}
            onOpenGuide={() => setGuideOpen(true)}
          />

          <BoardGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
        </section>
      </div>
    </main>
  );
}