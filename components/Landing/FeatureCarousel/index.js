import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { landingSlides } from "./landingSlides";

const AUTO_MS = 5000;

export default function FeatureCarousel() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);
  const timerRef = useRef(null);
  const slideCount = landingSlides.length;

  const safeIndex = useMemo(() => {
    if (current < 0) return slideCount - 1;
    if (current >= slideCount) return 0;
    return current;
  }, [current, slideCount]);

  const startAuto = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideCount);
    }, AUTO_MS);
  };

  useEffect(() => {
    startAuto();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slideCount]);

  const goTo = (index) => {
    setCurrent(index);
    startAuto();
  };

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + slideCount) % slideCount);
    startAuto();
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % slideCount);
    startAuto();
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  return (
    <section className="px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        {/* <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Core Features
          </p>
          <h2 className="text-[15px] font-extrabold tracking-tight text-slate-900">
            핵심 기능 3가지
          </h2>
        </div> */}
        {/* <span className="text-[10px] font-medium text-slate-400">
          {safeIndex + 1} / {slideCount}
        </span> */}
      </div>

      <div
        className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* nav */}
        <button
          type="button"
          onClick={goPrev}
          aria-label="이전 슬라이드"
          className="absolute left-2 top-[44%] z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-base text-slate-700 shadow-sm"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label="다음 슬라이드"
          className="absolute right-2 top-[44%] z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-base text-slate-700 shadow-sm"
        >
          ›
        </button>

        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {landingSlides.map((slide) => (
              <article key={slide.id} className="min-w-full p-1">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  {/* <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                      {slide.badge}
                    </span>
                  </div> */}

                  <div className="mb-2 overflow-hidden rounded-lg border border-slate-100 bg-white">
                    <div className="flex min-h-[110px] items-center justify-center px-2 py-2">
                      <Image
                        src={slide.imageSrc}
                        alt={slide.imageAlt}
                        width={240}
                        height={130}
                        className="w-auto h-full max-h-[180px] object-contain"
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900">
                    {slide.title}
                  </h3>

                  <p className="mt-1 text-[12px] leading-[1.45] text-slate-600">
                    {slide.description}
                  </p>

                  {slide.cta ? (
                    <div className="mt-2.5 rounded-lg border border-blue-100 bg-blue-50/60 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-slate-500">
                            {slide.cta.subLabel}
                          </p>
                          <p className="truncate text-[11px] font-bold text-slate-900">
                            {slide.cta.helperText}
                          </p>
                        </div>

                        <Link
                          href={slide.cta.href}
                          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-slate-600 px-2.5 text-[12px] font-bold text-white transition hover:opacity-95 active:translate-y-[1px]"
                        >
                          {slide.cta.label}
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* dots */}
        <div className="mt-2.5 flex justify-center gap-1.5" role="tablist">
          {landingSlides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={safeIndex === idx}
              aria-label={`${idx + 1}번 슬라이드로 이동`}
              onClick={() => goTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 ${safeIndex === idx ? "w-5 bg-slate-900" : "w-1.5 bg-slate-300"
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}