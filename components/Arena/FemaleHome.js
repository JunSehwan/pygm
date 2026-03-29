import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import {
  PiArrowClockwiseDuotone,
  PiArrowLeft,
  PiArrowRight,
  PiBriefcaseDuotone,
  PiCheckCircleFill,
  PiMapPinDuotone,
  PiSealCheckFill,
  PiUserCircleDuotone,
  PiWineDuotone,
  PiCigaretteDuotone,
} from "react-icons/pi";

import AuthRequiredModal from "components/Common/AuthRequiredModal";
import BottomNavbar from "components/Common/BottomNavbar";
import ArenaReceivePauseBar from "components/Arena/Common/ArenaReceivePauseBar";
import {
  getDisplayName,
  getEducationLabel,
  getJobLabel,
  getJobTypeLabel,
  getMaritalLabel,
  getProfileImage,
  getRemainingHours,
  getResidenceLabel,
  getStyleAxisLetters,
  getStyleDisplayLine,
  getStyleTooltipText,
  getArenaBadgeTooltip,
  getArenaBadgeImage,
} from "lib/arena";

function getBirthYear(user = {}) {
  const year = Number(user?.birthday?.year || 0);
  return year > 0 ? String(year).slice(-2) : "";
}

function getInterestLabel(user = {}) {
  if (user?.interest && String(user.interest).trim()) return String(user.interest).trim();
  if (user?.hobby && String(user.hobby).trim()) return String(user.hobby).trim();
  return "";
}

function getMbtiLabel(user = {}) {
  const ei = String(user?.mbti_ei || "").trim();
  const sn = String(user?.mbti_sn || "").trim();
  const tf = String(user?.mbti_tf || "").trim();
  const jp = String(user?.mbti_jp || "").trim();
  const result = `${ei}${sn}${tf}${jp}`.toUpperCase();
  return result.length === 4 ? result : "";
}

function getDrinkLabel(user = {}) {
  const raw = String(user?.drink || "").trim();
  const map = {
    "1": "전혀 안 마심",
    "2": "월 1회 미만",
    "3": "월 1회",
    "4": "주 1회",
    "5": "주 2~3회",
    "6": "주 3~4회",
    "7": "주 5회 이상",
  };
  return map[raw] || "";
}

function getSmokeLabel(user = {}) {
  const raw = String(user?.living_smoke || "").trim();
  const map = {
    "1": "흡연 긍정",
    "2": "흡연 상관없음",
    "3": "전자담배 괜찮음",
    "4": "조금 부정적",
    "5": "끊으면 좋겠음",
    "6": "흡연 매우 싫음",
  };
  return map[raw] || "";
}

function StatusIcon({ icon, title, tone = "emerald" }) {
  const Icon = icon;

  const toneMap = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-600",
    sky: "border-sky-100 bg-sky-50 text-sky-600",
  };

  return (
    <div
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm ${toneMap[tone]}`}
    >
      <Icon className="text-[17px]" />
    </div>
  );
}

function BadgeChip({ badgeInfo }) {
  const [open, setOpen] = useState(false);
  const tooltip = getArenaBadgeTooltip(badgeInfo);
  const imageSrc = getArenaBadgeImage(badgeInfo);

  if (!tooltip || !imageSrc) return null;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        className="relative h-8 w-8"
        style={{ cursor: "pointer" }}
      >
        <Image
          src={imageSrc}
          alt={tooltip}
          fill
          className="object-contain"
          unoptimized
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="absolute right-0 top-10 z-20 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-2 text-[12px] font-semibold text-white shadow-lg"
          >
            {tooltip}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CountdownText({ expiresAt }) {
  const [hours, setHours] = useState(getRemainingHours(expiresAt));

  useEffect(() => {
    setHours(getRemainingHours(expiresAt));
    const timer = setInterval(() => {
      setHours(getRemainingHours(expiresAt));
    }, 60000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <div className="inline-flex h-8 items-center rounded-full border border-black/10 bg-black/30 px-3 text-[14px] font-bold tracking-[-0.02em] text-white shadow-[0_8px_20px_rgba(15,23,42,0.24)] backdrop-blur-md">
      {hours}시간 남음
    </div>
  );
}

function TopMatchTag() {
  return (
    <div className="inline-flex h-8 items-center rounded-full border border-black/10 bg-black/30 px-3 text-[12px] font-bold tracking-[0.02em] text-white shadow-[0_8px_20px_rgba(15,23,42,0.24)] backdrop-blur-md">
      NEW MATCH
    </div>
  );
}

function MatchCard({ offerCard, onOpen }) {
  const male = offerCard?.male || {};
  const offer = offerCard?.offer || {};
  const badgeInfo = offerCard?.badgeInfo || {};

  const nickname = getDisplayName(male);
  const birthYear = getBirthYear(male);
  const image = getProfileImage(male);
  const styleAxisLetters = getStyleAxisLetters(male);
  const styleLine = getStyleDisplayLine(male);
  const styleTooltip = getStyleTooltipText(male);
  const residence = getResidenceLabel(male);
  const marital = getMaritalLabel(male);
  const jobLabel = getJobLabel(male);
  const jobTypeLabel = getJobTypeLabel(male);
  const educationLabel = getEducationLabel(male);
  const interestLabel = getInterestLabel(male);
  const mbti = getMbtiLabel(male);
  const drinkLabel = getDrinkLabel(male);
  const smokeLabel = getSmokeLabel(male);
  const valueMatchPercent = Number(offer?.valueMatchPercent || 85);
  const recentAccess = !!offer?.recentAccess;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className="w-full overflow-hidden rounded-[16px] border border-slate-200 bg-white text-left shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
      style={{ cursor: "pointer" }}
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="relative h-[250px] w-full bg-slate-100">
        <Image
          src={image}
          alt={nickname}
          fill
          className="object-cover"
          unoptimized
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-[92px] bg-gradient-to-b from-black/28 via-black/12 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-3">
          <TopMatchTag />
          <CountdownText expiresAt={offer?.expiresAt} />
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {male?.phone_verified || male?.identityVerified ? (
            <StatusIcon
              icon={PiCheckCircleFill}
              title="본인인증 완료"
              tone="emerald"
            />
          ) : null}

          {male?.company_verified || male?.job_verified || male?.companyVerified ? (
            <StatusIcon
              icon={PiBriefcaseDuotone}
              title="재직인증 완료"
              tone="sky"
            />
          ) : null}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="break-keep text-[22px] font-extrabold tracking-[-0.03em] text-zinc-900">
              {nickname}
            </div>

            {birthYear ? (
              <div className="mt-1 text-[13px] font-semibold text-slate-400">
                {birthYear}년생
              </div>
            ) : null}

            <div className="mt-3 break-keep text-[15px] font-semibold leading-6 text-zinc-800">
              {jobLabel}
            </div>

            {styleLine ? (
              <div
                title={styleTooltip || "스타일 진단 정보"}
                className="mt-1.5 break-keep text-[14px] leading-6 text-slate-600"
              >
                {styleLine}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {styleAxisLetters ? (
              <div
                title={styleTooltip || styleAxisLetters}
                className="inline-flex h-8 items-center rounded-full border border-violet-100 bg-violet-50 px-3 text-[12px] font-bold text-violet-700"
              >
                {styleAxisLetters}
              </div>
            ) : null}

            <div className="inline-flex h-8 items-center rounded-full border border-violet-100 bg-violet-50 px-3 text-[12px] font-bold text-violet-700">
              가치관매칭 {valueMatchPercent}%
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {jobTypeLabel ? (
            <div className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
              {jobTypeLabel}
            </div>
          ) : null}

          {mbti ? (
            <div className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
              {mbti}
            </div>
          ) : null}

          {residence ? (
            <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
              <PiMapPinDuotone className="text-[13px]" />
              {residence}
            </div>
          ) : null}

          {marital ? (
            <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
              <PiSealCheckFill className="text-[13px]" />
              {marital}
            </div>
          ) : null}

          {recentAccess ? (
            <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-violet-100 px-3 text-[12px] font-semibold text-violet-700">
              <PiArrowClockwiseDuotone className="text-[13px]" />
              최근 접속 활발
            </div>
          ) : null}

          <BadgeChip badgeInfo={badgeInfo} />
        </div>

        <div className="mt-3 rounded-[12px] bg-slate-50 p-3">
          {interestLabel ? (
            <div className="text-[13px] font-semibold text-zinc-800">
              관심사 · {interestLabel}
            </div>
          ) : null}

          {educationLabel ? (
            <div className="mt-1 text-[13px] font-semibold text-zinc-800">
              학력 · {educationLabel}
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            {drinkLabel ? (
              <div className="inline-flex h-7 items-center gap-1 rounded-full bg-white px-3 text-[11px] font-semibold text-slate-600">
                <PiWineDuotone className="text-[12px]" />
                {drinkLabel}
              </div>
            ) : null}

            {smokeLabel ? (
              <div className="inline-flex h-7 items-center gap-1 rounded-full bg-white px-3 text-[11px] font-semibold text-slate-600">
                <PiCigaretteDuotone className="text-[12px]" />
                {smokeLabel}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function EmptyState({ onMoveCards, onMoveProfile }) {
  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-5">
      <div className="rounded-[16px] border border-slate-200 bg-white px-5 py-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="relative mx-auto h-[185px] w-[185px]">
          <Image
            src="/image/arena/arena_man_waiting.png"
            alt="소개 대기"
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        <div className="mt-4 text-center">
          <div className="break-keep text-[23px] font-extrabold tracking-[-0.03em] text-zinc-900">
            아직 소개할 남성분을
            <br />
            찾는 중이에요
          </div>

          <div className="mt-3 break-keep text-[13px] leading-6 text-slate-500">
            3일에 한 번,
            신중한 소개를 드릴게요.
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-5">
        <button
          type="button"
          onClick={onMoveCards}
          className="flex h-[52px] w-full items-center justify-center rounded-md bg-violet-600 text-[15px] font-bold text-white"
          style={{ cursor: "pointer" }}
        >
          차밍카드 둘러보기
        </button>

        <button
          type="button"
          onClick={onMoveProfile}
          className="flex h-[52px] w-full items-center justify-center rounded-md bg-zinc-800 text-[15px] font-bold text-white"
          style={{ cursor: "pointer" }}
        >
          프로필 수정하기
        </button>
      </div>
    </div>
  );
}

function PausedEmptyState() {
  return (
    <div className="flex h-full flex-col justify-center px-5 py-10">
      <div className="rounded-[16px] border border-slate-200 bg-white px-5 py-8 text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="text-[24px] font-extrabold tracking-[-0.03em] text-zinc-900">
          지금은 소개를
          <br />
          쉬는 중이에요
        </div>

        <div className="mt-3 break-keep text-[13px] leading-6 text-slate-500">
          상단 토글을 다시 켜면
          <br />
          새로운 소개가 다시 도착해요.
        </div>
      </div>
    </div>
  );
}

function GuestCardDummy({ onNeedAuth }) {
  return (
    <div className="px-4 pb-6 pt-5">
      <MatchCard
        offerCard={{
          offer: {
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
            recentAccess: true,
            valueMatchPercent: 86,
          },
          male: {
            nickname: "준호",
            birthday: { year: 1993, month: 8, day: 14 },
            job: "1",
            duty: "브랜드 디자이너",
            address_sido: "11",
            maritalStatus: "미혼",
            phone_verified: true,
            company_verified: true,
            interest: "미식 탐방",
            mbti_ei: "E",
            mbti_sn: "N",
            mbti_tf: "F",
            mbti_jp: "J",
            drink: "3",
            living_smoke: "6",
            styleTest: {
              axisLetters: "RMCL",
              oneLine: "대화가 부드럽고 상대를 편하게 만드는 타입",
            },
            thumbimage: [
              "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop",
            ],
          },
          badgeInfo: { top5: true },
        }}
        onOpen={onNeedAuth}
      />
    </div>
  );
}

function BlockedState() {
  return (
    <div className="flex h-full flex-col justify-center px-5 py-10">
      <div className="rounded-[16px] border border-slate-200 bg-white px-5 py-8 text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="text-[24px] font-extrabold tracking-[-0.03em] text-zinc-900">
          현재는 아레나 이용이
          <br />
          제한된 상태예요
        </div>
      </div>
    </div>
  );
}

export default function ArenaHome({
  isLoggedIn,
  isFemale,
  isBlockedUser,
  loading,
  offerCards = [],
  authChecked,
  isReceivePaused,
  pauseSaving,
  onToggleReceivePause,
}) {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);
  const title = useMemo(() => "매칭아레나", []);

  useEffect(() => {
    if (!authChecked) return;
    setAuthModalOpen(false);
  }, [authChecked, isLoggedIn]);

  useEffect(() => {
    const root = sliderRef.current;
    if (!root || !offerCards.length) return;

    const handleScroll = () => {
      const cardWidth = root.clientWidth - 36;
      const left = root.scrollLeft;
      const index = Math.round(left / (cardWidth + 16));
      setCurrentIndex(Math.max(0, Math.min(index, offerCards.length - 1)));
    };

    root.addEventListener("scroll", handleScroll, { passive: true });
    return () => root.removeEventListener("scroll", handleScroll);
  }, [offerCards.length]);

  const moveToIndex = (nextIndex) => {
    const root = sliderRef.current;
    if (!root) return;

    const safeIndex = Math.max(0, Math.min(nextIndex, offerCards.length - 1));
    const cardWidth = root.clientWidth - 36;
    const left = safeIndex * (cardWidth + 16);

    root.scrollTo({
      left,
      behavior: "smooth",
    });
  };

  const movePrev = () => moveToIndex(currentIndex - 1);
  const moveNext = () => moveToIndex(currentIndex + 1);

  return (
    <>
      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[18px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <header className="shrink-0 border-b border-slate-200 bg-white/92 backdrop-blur">
                <div className="flex h-[60px] items-center justify-between px-4">
                  <div className="text-[20px] font-extrabold tracking-[-0.03em] text-zinc-900">
                    {title}
                  </div>

                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-slate-100"
                    style={{ cursor: "pointer" }}
                  >
                    ←
                  </button>
                </div>
              </header>
              <ArenaReceivePauseBar
                isPaused={isReceivePaused}
                saving={pauseSaving}
                onToggle={onToggleReceivePause}
              />

              <div className="relative min-h-0 flex-1 overflow-hidden bg-[#fbfbfd]">
                {loading ? (
                  <div className="flex h-full items-center justify-center px-5">
                    <div className="text-[14px] font-medium text-slate-500">
                      매칭아레나를 불러오는 중...
                    </div>
                  </div>
                ) : !isLoggedIn ? (
                  <GuestCardDummy onNeedAuth={() => setAuthModalOpen(true)} />
                ) : isBlockedUser ? (
                  <BlockedState />
                ) : !isFemale ? (
                  <div className="flex h-full flex-col justify-center px-5 py-10">
                    <div className="rounded-[16px] border border-slate-200 bg-white px-5 py-8 text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                      <div className="text-[24px] font-extrabold tracking-[-0.03em] text-zinc-900">
                        남성회원 화면은
                        <br />
                        다음 단계에서 이어서 만들게요
                      </div>
                    </div>
                  </div>
                      ) : isReceivePaused && !offerCards.length ? (
                        <PausedEmptyState />
                      ) : !offerCards.length ? (
                        <EmptyState
                          onMoveCards={() => router.push("/cards/list")}
                          onMoveProfile={() => router.push("/profile")}
                        />
                      ) : (
                  <>
                    <div
                      ref={sliderRef}
                      className="h-full overflow-x-auto overflow-y-hidden"
                    >
                      <div className="flex h-full gap-4 pl-4 pr-4 pt-4 pb-6">
                        {offerCards.map((item) => (
                          <div
                            key={item?.offer?.id || item?.male?.userID}
                            className="w-[calc(100%-0px)] min-w-[calc(100%-0px)]"
                          >
                            <MatchCard
                              offerCard={item}
                              onOpen={() =>
                                router.push(`/arena/${item?.male?.userID || item?.male?.id}`)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {offerCards.length > 1 ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex items-center justify-between px-4">
                        <button
                          type="button"
                          onClick={movePrev}
                          disabled={currentIndex === 0}
                          className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full shadow-lg ${currentIndex === 0
                            ? "bg-white/90 text-slate-300"
                            : "bg-slate-100 text-zinc-700"
                            }`}
                          style={{ cursor: currentIndex === 0 ? "default" : "pointer" }}
                        >
                          <PiArrowLeft className="text-[20px]" />
                        </button>

                        <button
                          type="button"
                          onClick={moveNext}
                          disabled={currentIndex === offerCards.length - 1}
                          className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full shadow-lg ${currentIndex === offerCards.length - 1
                            ? "bg-white/90 text-slate-300"
                            : "bg-slate-100 text-zinc-700"
                            }`}
                          style={{
                            cursor:
                              currentIndex === offerCards.length - 1
                                ? "default"
                                : "pointer",
                          }}
                        >
                          <PiArrowRight className="text-[20px]" />
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {isLoggedIn ? (
                <div className="shrink-0 border-t border-slate-200 bg-white">
                  <BottomNavbar contained />
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {authChecked && !isLoggedIn && authModalOpen ? (
          <AuthRequiredModal
            open={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            redirect="/arena"
            title="로그인이 필요해요"
            description="매칭아레나에서 소개 카드를 확인해보세요."
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}