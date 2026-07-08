import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
} from "react-icons/fi";
import { landingSlides } from "./landingSlides";

const AUTO_MS = 5200;
const CARD_HEIGHT = "max-h-[520px]";

function SlideImage({ slide, active }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative flex h-[240px] w-full items-center justify-center overflow-hidden rounded-[22px]">
      {!loaded ? (
        <motion.div
          className="absolute inset-0 rounded-[22px] bg-rose-50"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.45, 0.85, 0.45] }}
          transition={{
            duration: 1.25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white via-rose-50 to-violet-50" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-sm" />
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, scale: 0.985, filter: "blur(10px)" }}
        animate={{
          opacity: loaded ? 1 : 0,
          scale: loaded ? 1 : 0.985,
          filter: loaded ? "blur(0px)" : "blur(10px)",
        }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Image
          src={slide.imageSrc}
          alt={slide.imageAlt}
          width={342}
          height={269}
          priority={active}
          loading={active ? "eager" : "lazy"}
          sizes="322px"
          onLoad={() => setLoaded(true)}
          className="h-[212px] w-auto object-contain"
        />
      </motion.div>
    </div>
  );
}

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

  useEffect(() => {
    landingSlides.forEach((slide) => {
      const img = new window.Image();
      img.src = slide.imageSrc;
    });
  }, []);

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
    <section className="px-4 pb-6 pt-6">
      <div className="mb-5 mt-6 md:mt-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-white/82 px-3 py-1 text-[11px] font-extrabold text-rose-500 shadow-sm backdrop-blur-md">
          <FiHeart className="text-[13px]" />
          3040 신중한 만남
        </div>

        <h2 className="mt-3 md:mt-5 break-keep text-[29px] font-extrabold leading-[1.18] text-slate-950">
          이성과의 만남 전
          <br />
          확인을 돕는 방식
        </h2>

        <p className="mt-3 break-keep text-[14px] font-medium leading-6 text-slate-700/80">
          조건과 사진만으로 판단하기보다,
          <br />
          함께 살아갈 때 중요한 태도와 생각을 먼저 봅니다.
        </p>
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="overflow-hidden rounded-[28px]">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          >
            {landingSlides.map((slide, index) => (
              <article key={slide.id} className="min-w-full pr-1">
                <div
                  className={`${CARD_HEIGHT} flex flex-col rounded-[28px] border border-slate-200/80 bg-white px-5 pb-5 pt-6 shadow-[0_14px_34px_rgba(15,23,42,0.07)]`}
                >
                  <div className="inline-flex w-fit items-center rounded-full bg-rose-50 px-3 py-1 text-[11px] font-extrabold text-violet-600">
                    POINT 0{index + 1}
                  </div>

                  <h3 className="mt-2 whitespace-pre-line break-keep text-[24px] font-extrabold leading-[1.26] tracking-[-0.04em] text-slate-950">
                    {slide.title}
                  </h3>

                  <p className="mt-2 whitespace-pre-line break-keep text-[14px] leading-[1.7] text-slate-600">
                    {slide.description}
                  </p>

                  <div className="mt-3 flex flex-1 items-center justify-center">
                    <SlideImage slide={slide} active={index === safeIndex} />
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link
                      href={slide.href}
                      className="group inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-4 text-[13px] font-extrabold text-white shadow-[0_10px_20px_rgba(124,58,237,0.20)] transition hover:bg-violet-700"
                    >
                      {slide.buttonLabel}
                      <FiArrowRight className="ml-1 text-[15px] transition group-hover:translate-x-0.5" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goPrev}
                        aria-label="이전 슬라이드"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[24px] text-slate-500 transition hover:bg-slate-50"
                      >
                        <FiChevronLeft />
                      </button>

                      <button
                        type="button"
                        onClick={goNext}
                        aria-label="다음 슬라이드"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[24px] text-slate-500 transition hover:bg-slate-50"
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
              className={`h-2 rounded-full transition-all ${safeIndex === idx ? "w-6 bg-violet-600" : "w-2 bg-slate-300"
                }`}
            />
          ))}
        </div>
      </div>

      {/* <div className="mt-6 rounded-2xl border border-white/30 bg-white/25 px-4 py-4 backdrop-blur-md"> */}
        {/* <p className="break-keep text-center text-[13px] font-bold leading-5 text-white">
          궁금해서 한 번 눌렀다가,
          <br />
          생각보다 나랑 맞는 사람이 있을지도 몰라요.
        </p> */}

        {/* <Link
          href="/signup"
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white text-[13px] font-extrabold text-violet-600 transition hover:opacity-95"
        >
          일단 무료로 시작하기
          <FiArrowRight className="text-[15px]" />
        </Link> */}
      {/* </div> */}
    </section>
  );
}