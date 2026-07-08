import React from "react";
import { useRouter } from "next/router";
import { PiArrowLeft } from "react-icons/pi";
import BottomNavbar from "components/Common/BottomNavbar";
import IdentityNudgeBanner from "components/Common/IdentityNudgeBanner";
import ArenaReceivePauseBar from "components/Arena/Common/ArenaReceivePauseBar";
import MaleInterestCard from "./MaleInterestCard";
import MaleEmptyState from "./MaleEmptyState";
import CharmingCardInsightSection from "./CharmingCardInsightSection";

export default function MaleHome({
  user,
  isLoggedIn,
  isBlockedUser,
  loading,
  interestCards = [],
  isReceivePaused,
  pauseSaving,
  onToggleReceivePause,
}) {
  const router = useRouter();

  if (isBlockedUser) {
    return (
      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[18px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div className="rounded-md border border-slate-200 bg-white px-5 py-8 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                <div className="text-[24px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  현재는 아레나 이용이
                  <br />
                  제한된 상태예요
                </div>
              </div>
            </div>

            {isLoggedIn ? <BottomNavbar contained /> : null}
          </section>
        </div>
      </main>
    );
  }

  if (!loading && (!interestCards || !interestCards.length)) {
    return (
      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[18px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <header className="shrink-0 border-b border-slate-200 bg-white">
              <div className="flex h-[60px] items-center justify-between px-4">
                <div className="text-[20px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  매칭아레나
                </div>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 hover:bg-slate-100"
                  style={{ cursor: "pointer" }}
                >
                  <PiArrowLeft className="text-[22px]" />
                </button>
              </div>
            </header>

            <div className="relative min-h-0 flex-1 overflow-y-auto">
              <ArenaReceivePauseBar
                isPaused={isReceivePaused}
                saving={pauseSaving}
                onToggle={onToggleReceivePause}
              />

              <IdentityNudgeBanner user={user} className="pb-3 pt-3" />

              <CharmingCardInsightSection
                user={user}
                onMoveCards={() => router.push("/cards/list")}
              />

              <MaleEmptyState
                compact
                nickname={user?.nickname || user?.username || "회원"}
                onMoveCards={() => router.push("/cards/list")}
                onMoveProfile={() => router.push("/profile")}
              />
            </div>

            {isLoggedIn ? <BottomNavbar contained /> : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
        <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[18px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
          <header className="shrink-0 border-b border-slate-200 bg-white">
            <div className="flex h-[60px] items-center justify-between px-4">
              <div className="text-[20px] font-extrabold tracking-[-0.03em] text-zinc-900">
                매칭아레나
              </div>

              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 hover:bg-slate-100"
                style={{ cursor: "pointer" }}
              >
                <PiArrowLeft className="text-[22px]" />
              </button>
            </div>
          </header>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-5">
            <ArenaReceivePauseBar
              isPaused={isReceivePaused}
              saving={pauseSaving}
              onToggle={onToggleReceivePause}
            />

            <IdentityNudgeBanner user={user} className="-mx-4 pb-3" />

            <div className="space-y-4">
              <div className="rounded-md border border-violet-100 bg-violet-50 px-4 py-4">
                <div className="text-[16px] font-extrabold text-violet-700">
                  나에게 온 호감
                </div>

                <div className="mt-2 break-keep text-[14px] leading-4 text-slate-600">
                  여성회원이 보낸 호감 카드를 확인해보세요.
                </div>
              </div>

              <div className="-mx-4 overflow-x-auto px-4 pb-1">
                <div className="flex gap-3">
                  {interestCards.map((item) => (
                    <MaleInterestCard
                      key={item.id}
                      item={item}
                      onClick={() => router.push(`/arena/received/${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {isLoggedIn ? <BottomNavbar contained /> : null}
        </section>
      </div>
    </main>
  );
}