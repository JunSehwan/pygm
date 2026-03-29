import React from "react";

function ImageOrb({ src, alt }) {
  return (
    <div className="relative mx-auto my-6 flex w-full items-center justify-center">
      {/* outer gradient glow (강화) */}
      <div className="absolute h-[235px] w-[235px] rounded-full bg-gradient-to-br from-fuchsia-400/45 via-violet-400/35 to-sky-400/35 blur-2xl" />
      <div className="absolute h-[215px] w-[215px] rounded-full bg-gradient-to-tr from-rose-300/35 via-transparent to-indigo-300/30 blur-xl" />

      {/* circular image (꽉차게) */}
      <div className="relative h-[200px] w-[200px] overflow-hidden rounded-full shadow-[0_20px_45px_rgba(76,29,149,0.18),0_8px_24px_rgba(15,23,42,0.10)] ring-1 ring-white/70">
        <img src={src} alt={alt} className="h-full w-full object-cover" />

        {/* edge lighting */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0)_55%,rgba(255,255,255,0.20)_100%)]" />
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]" />
      </div>
    </div>
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

  return (
    <div className="flex flex-col bg-white min-h-[760px]">
      {/* content */}
      <div className="flex-1 px-5 pt-8 pb-4">
        {/* top row */}
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            {/* STEP {slide.step} */}
          </div>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "w-5 bg-slate-900" : "w-1.5 bg-slate-300"
                  }`}
              />
            ))}
          </div>
        </div>

        <h1 className="whitespace-pre-line text-3xl font-black pt-4">
          <span className="bg-clip-text">
            {slide.title}
          </span>
        </h1>

        {slide.description ? (
          <p className="mt-8 whitespace-pre-line text-md leading-6 text-slate-500">
            {slide.description}
          </p>
        ) : null}

        <ImageOrb src={slide.image} alt={slide.title} />

        {slide.body ? (
          <p className="py-4 whitespace-pre-line text-sm leading-6 text-slate-700">
            {slide.body}
          </p>
        ) : null}
      </div>

      {/* bottom action area (탐색 버튼 + 이전/다음) */}
      <div className="px-0 pb-0">
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={onClickExploreCards}
            className="flex h-14 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-left transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                💬
              </span>
              <span className="text-[13px] font-bold text-slate-700">
                차밍카드 둘러보기
              </span>
            </div>
            <span className="text-slate-400">›</span>
          </button>

          <button
            type="button"
            onClick={onClickTests}
            className="flex h-14 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-left transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                ❤
              </span>
              <span className="text-[13px] font-bold text-slate-700">
                연애스타일진단 먼저 해보기
              </span>
            </div>
            <span className="text-slate-400">›</span>
          </button>
        </div>

        {/* 이전/다음 row */}
        {/* 이전/다음 row (STEP 4에서는 숨김) */}
        {!isLast ? (
          <div
            className={`mt-3 grid gap-0 ${canGoPrev ? "grid-cols-[104px_1fr]" : "grid-cols-1"
              }`}
          >
            {canGoPrev ? (
              <button
                type="button"
                onClick={onPrev}
                className="flex h-[54px] items-center justify-center border border-slate-200 text-lg font-bold text-slate-700 transition hover:bg-slate-200 bg-slate-100"
              >
                이전
              </button>
            ) : null}

            <button
              type="button"
              onClick={onNext}
              className="flex h-[54px] w-full items-center justify-center bg-rose-500 px-4 text-center text-lg font-extrabold text-white transition hover:brightness-95"
            >
              다음
            </button>
          </div>
        ) : null}
      </div>

      {/* ✅ 바닥에 딱 붙는 최종 CTA (마지막 슬라이드에서만 노출) */}
      {isLast ? (
        <div className="mt-3 px-0 pb-0">
          <div
            className={`mt-3 grid gap-0 ${canGoPrev ? "grid-cols-[104px_1fr]" : "grid-cols-1"
              }`}
          >
          <button
            type="button"
            onClick={onPrev}
            className="flex h-[54px] items-center justify-center border border-slate-200 text-lg font-bold text-slate-700 transition hover:bg-slate-200 bg-slate-100"
          >
            이전
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="flex h-[54px] w-full items-center justify-center bg-rose-500 px-4 text-center text-lg font-extrabold text-white transition hover:brightness-95"
          >
            <span className="leading-tight">
              상세정보 입력후 매칭참여
              <br />
              <span className="text-[12px] font-semibold opacity-90">
                (약 1~2분 소요)
              </span>
            </span>
            </button></div>
        </div>
      ) : null}
    </div>
  );
}