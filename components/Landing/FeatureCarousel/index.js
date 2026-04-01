import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { landingSlides } from "./landingSlides";

const AUTO_MS = 5200;
const CARD_HEIGHT = "min-h-[520px]";

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

  const resetAuto = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideCount);
    }, AUTO_MS);
  };

  useEffect(() => {
    resetAuto();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slideCount]);

  const goTo = (index) => {
    setCurrent(index);
    resetAuto();
  };

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + slideCount) % slideCount);
    resetAuto();
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % slideCount);
    resetAuto();
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
    <section className="bg-gradient-to-b from-[#B4D8E9] via-[#A9CDE8] to-[#7E90E9] px-4 pb-8 pt-7">
      <div className="mb-6">
        <h2 className="whitespace-pre-line text-[28px] font-extrabold leading-[1.15] tracking-[-0.04em] text-slate-950">
          즐기면서
          {"\n"}
          원하는 이성을 찾는
          {"\n"}
          연애놀이터
        </h2>
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="overflow-hidden rounded-[34px]">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {landingSlides.map((slide) => (
              <article key={slide.id} className="min-w-full pr-1">
                <div
                  className={`${CARD_HEIGHT} flex flex-col rounded-[34px] bg-[#F6F7FA] px-6 pb-6 pt-7`}
                >
                  <h3 className="whitespace-pre-line text-2xl font-extrabold leading-[1.28] tracking-[-0.02em] text-[#6B7DE8]">
                    {slide.title}
                  </h3>

                  <p className="mt-4 whitespace-pre-line text-[14px] leading-[1.62] text-slate-500">
                    {slide.description}
                  </p>

                  <div className="mt-3 flex flex-1 items-center justify-center">
                    <Image
                      src={slide.imageSrc}
                      alt={slide.imageAlt}
                      width={282}
                      height={240}
                      className="h-auto w-[260px] object-contain"
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      href={slide.href}
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[#6B7DE8] px-5 text-[14px] font-extrabold text-white transition hover:opacity-95"
                    >
                      {slide.buttonLabel}
                      <span className="ml-1">▶</span>
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goPrev}
                        aria-label="이전 슬라이드"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[26px] text-slate-500 transition hover:bg-slate-50"
                      >
                        <FiChevronLeft />
                      </button>

                      <button
                        type="button"
                        onClick={goNext}
                        aria-label="다음 슬라이드"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[26px] text-slate-500 transition hover:bg-slate-50"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {landingSlides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`${idx + 1}번 슬라이드`}
              onClick={() => goTo(idx)}
              className={`h-2 rounded-full transition-all ${safeIndex === idx ? "w-6 bg-white" : "w-2 bg-white/45"
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}