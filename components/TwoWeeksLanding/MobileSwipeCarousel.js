import {
  Children,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function MobileSwipeCarousel({
  children,
  label,
  className = "",
  itemClassName = "",
}) {
  const slides = Children.toArray(children);
  const trackRef = useRef(null);
  const frameRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const carouselId = useId();

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const slideElements = Array.from(
      track.querySelectorAll("[data-mobile-carousel-slide]")
    );
    if (!slideElements.length) return;

    const trackRect = track.getBoundingClientRect();
    const viewportCenter = trackRect.left + trackRect.width / 2;
    let nextIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slideElements.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        nextIndex = index;
      }
    });

    setActiveIndex((currentIndex) =>
      currentIndex === nextIndex ? currentIndex : nextIndex
    );
  }, []);

  const requestSync = useCallback(() => {
    if (frameRef.current) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      syncActiveIndex();
    });
  }, [syncActiveIndex]);

  useEffect(() => {
    window.addEventListener("resize", requestSync);

    return () => {
      window.removeEventListener("resize", requestSync);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [requestSync]);

  const moveTo = (index) => {
    const track = trackRef.current;
    if (!track || !slides.length) return;

    const nextIndex = Math.min(Math.max(index, 0), slides.length - 1);
    const slide = track.querySelector(
      `[data-mobile-carousel-slide="${nextIndex}"]`
    );
    if (!slide) return;

    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const paddingLeft = Number.parseFloat(
      window.getComputedStyle(track).paddingLeft
    ) || 0;

    setActiveIndex(nextIndex);
    track.scrollTo({
      left: track.scrollLeft + slideRect.left - trackRect.left - paddingLeft,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTo(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTo(activeIndex + 1);
    }
  };

  if (!slides.length) return null;

  return (
    <div className={`mx-auto w-full max-w-[520px] ${className}`}>
      <div
        ref={trackRef}
        id={carouselId}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onScroll={requestSync}
        onKeyDown={handleKeyDown}
        className="flex snap-x snap-mandatory scroll-px-2 gap-4 overflow-x-auto overscroll-x-contain px-2 pb-5 outline-none [scrollbar-width:none] [-ms-overflow-style:none] focus-visible:ring-2 focus-visible:ring-[#d85b48]/40 [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            data-mobile-carousel-slide={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${slides.length}`}
            className={`w-[calc(100vw-32px)] max-w-[400px] shrink-0 snap-start snap-always ${itemClassName}`}
          >
            {slide}
          </div>
        ))}
      </div>

      <div
        role="group"
        className="mt-1 flex items-center justify-center gap-4"
        aria-label={`${label} 이동`}
      >
        <button
          type="button"
          onClick={() => moveTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-controls={carouselId}
          aria-label="이전 항목"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-700 transition hover:border-slate-400 disabled:cursor-default disabled:opacity-30"
        >
          <FiChevronLeft aria-hidden="true" />
        </button>

        <div className="flex min-w-[72px] items-center justify-center gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => moveTo(index)}
              aria-controls={carouselId}
              aria-label={`${index + 1}번째 항목 보기`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index
                  ? "w-5 bg-[#d85b48]"
                  : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => moveTo(activeIndex + 1)}
          disabled={activeIndex === slides.length - 1}
          aria-controls={carouselId}
          aria-label="다음 항목"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-700 transition hover:border-slate-400 disabled:cursor-default disabled:opacity-30"
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {activeIndex + 1} / {slides.length}
      </span>
    </div>
  );
}
