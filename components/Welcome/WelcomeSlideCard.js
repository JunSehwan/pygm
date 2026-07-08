import React from "react";

const FALLBACK_IMAGES = [
  "/image/landing/section1.png",
  "/image/landing/section2.png",
  "/image/landing/section3.png",
  "/image/landing/landing.png",
];

function StepDots({ currentIndex, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "w-5 bg-violet-600" : "w-1.5 bg-slate-300"
            }`}
        />
      ))}
    </div>
  );
}

function HeroImage({ src, alt }) {
  return (
    <div className="relative mx-auto mt-5 w-full">
      <div className="pointer-events-none absolute -inset-4 rounded-[28px] bg-gradient-to-br from-violet-300/35 via-sky-200/25 to-amber-100/35 blur-2xl" />

      <div className="relative overflow-hidden rounded-[22px] bg-slate-100 shadow-[0_14px_34px_rgba(15,23,42,0.10)] ring-1 ring-white/70">
        <div className="relative aspect-[4/3] w-full">
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover object-center"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-white/5" />
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  icon,
  title,
  description,
  onClick,
  tone = "violet",
}) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-500"
      : "bg-violet-50 text-violet-600";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[62px] w-full items-center justify-between rounded-md border border-solid border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] ${toneClass}`}
        >
          {icon}
        </span>

        <span className="min-w-0">
          <span className="block break-keep text-[13px] font-extrabold text-slate-800">
            {title}
          </span>

          {description ? (
            <span className="mt-0.5 block break-keep text-[11px] font-medium leading-4 text-slate-400">
              {description}
            </span>
          ) : null}
        </span>
      </div>

      <span className="shrink-0 text-[22px] font-light text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500">
        ›
      </span>
    </button>
  );
}

export default function WelcomeSlideCard({
  slide,
  currentIndex,
  total,
  onClickExploreCards,
  onClickTests,
  onPrev,
  onNext,
  onFinish,
}) {
  const isLast = currentIndex === total - 1;
  const canGoPrev = currentIndex > 0;

  const imageSrc =
    slide?.image ||
    FALLBACK_IMAGES[currentIndex] ||
    "/image/landing/landing.png";

  const imageAlt = slide?.title || "차밍수프 웰컴 이미지";

  return (
    <div className="flex h-[100svh] min-h-0 w-full flex-col overflow-hidden bg-white md:h-[720px] md:max-h-[calc(100vh-80px)] md:min-h-[560px]">
      {/* 상단 고정 영역 */}
      <header className="shrink-0 bg-white px-5 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={canGoPrev ? onPrev : undefined}
            disabled={!canGoPrev}
            className={`flex h-10 w-10 items-center justify-center rounded-md text-[20px] transition ${canGoPrev
                ? "text-slate-800 hover:bg-slate-100"
                : "pointer-events-none text-transparent"
              }`}
            aria-label="이전"
          >
            ‹
          </button>

          <StepDots currentIndex={currentIndex} total={total} />

          <div className="flex h-10 w-10 items-center justify-center">
            <span className="text-[11px] font-bold text-slate-300">
              {currentIndex + 1}/{total}
            </span>
          </div>
        </div>
      </header>

      {/* 중간 스크롤 영역 */}
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-2">
        <div>
          <p className="text-[12px] font-extrabold text-violet-600">
            WELCOME
          </p>

          <h1 className="mt-2 whitespace-pre-line break-keep text-[28px] font-bold leading-[1.14] text-slate-800">
            {slide.title}
          </h1>

          {slide.description ? (
            <p className="mt-3 whitespace-pre-line break-keep text-[14px] font-medium leading-6 text-slate-500">
              {slide.description}
            </p>
          ) : null}
        </div>

        <HeroImage src={imageSrc} alt={imageAlt} />

        {slide.body ? (
          <div className="mt-5 rounded-md border border-solid border-slate-100 bg-slate-50 px-4 py-4">
            <p className="whitespace-pre-line break-keep text-[13px] font-medium leading-6 text-slate-600">
              {slide.body}
            </p>
          </div>
        ) : null}

        {/* 마지막 STEP에서만 노출 */}
        {isLast ? (
          <div className="mt-5 space-y-2 pb-2">
            <QuickActionButton
              icon="💬"
              title="차밍카드 둘러보기"
              description="답변으로 매력을 보여주는 공간"
              onClick={onClickExploreCards}
              tone="violet"
            />

            <QuickActionButton
              icon="❤"
              title="연애스타일진단 먼저 해보기"
              description="내 연애 성향을 가볍게 확인하기"
              onClick={onClickTests}
              tone="rose"
            />
          </div>
        ) : null}
      </main>

      {/* 하단 고정 버튼 영역 */}
      <footer className="shrink-0 border-t border-solid border-slate-100 bg-white px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_24px_rgba(15,23,42,0.04)]">
        {!isLast ? (
          <div
            className={`grid gap-2 ${canGoPrev ? "grid-cols-[92px_1fr]" : "grid-cols-1"
              }`}
          >
            {canGoPrev ? (
              <button
                type="button"
                onClick={onPrev}
                className="flex h-12 items-center justify-center rounded-md bg-slate-100 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-200"
              >
                이전
              </button>
            ) : null}

            <button
              type="button"
              onClick={onNext}
              className="flex h-12 w-full items-center justify-center rounded-md bg-violet-600 px-4 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] transition hover:bg-violet-700"
            >
              다음
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[92px_1fr] gap-2">
            <button
              type="button"
              onClick={onPrev}
              className="flex h-12 items-center justify-center rounded-md bg-slate-100 text-[14px] font-extrabold text-slate-600 transition hover:bg-slate-200"
            >
              이전
            </button>

            <button
              type="button"
              onClick={onFinish}
              className="flex h-12 w-full items-center justify-center rounded-md bg-violet-600 px-4 text-center text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] transition hover:bg-violet-700"
            >
              <span className="leading-tight">
                상세정보 입력 후 매칭참여
                <br />
                <span className="text-[11px] font-semibold text-white/85">
                  약 1~2분 소요
                </span>
              </span>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}