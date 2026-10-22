import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import MobileFrame from "./MobileFrame";
import MobileSwipeCarousel from "./MobileSwipeCarousel";
import { FLOW_STEPS } from "./constants";

function DesktopFlow({ reduceMotion }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = FLOW_STEPS[activeIndex] || FLOW_STEPS[0];

  useEffect(() => {
    let frameId = 0;

    const updateActiveStep = () => {
      frameId = 0;
      const track = trackRef.current;
      if (!track) return;

      const stickyTop = 92;
      const rect = track.getBoundingClientRect();
      const scrollDistance = Math.max(
        track.offsetHeight - window.innerHeight + stickyTop,
        1
      );
      const travelled = Math.min(
        Math.max(stickyTop - rect.top, 0),
        scrollDistance
      );
      const progress = travelled / scrollDistance;
      const nextIndex = Math.min(
        FLOW_STEPS.length - 1,
        Math.floor(progress * FLOW_STEPS.length)
      );

      setActiveIndex((currentIndex) =>
        currentIndex === nextIndex ? currentIndex : nextIndex
      );
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateActiveStep);
    };

    updateActiveStep();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className="relative mt-16 hidden lg:block"
      style={{ height: `${FLOW_STEPS.length * 70}vh` }}
    >
      <div className="sticky top-[92px] z-10 flex h-[calc(100vh-108px)] min-h-[580px] max-h-[780px] items-center">
        <div className="grid h-full w-full grid-cols-[0.78fr_1.22fr] overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-[0_26px_80px_rgba(15,23,42,0.09)]">
          <div className="flex min-w-0 flex-col border-r border-slate-200 p-10 xl:p-14">
            <ol className="flex items-center gap-2" aria-label="진행 단계">
              {FLOW_STEPS.map((step, index) => (
                <li key={step.number} className="flex min-w-0 flex-1 items-center">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-black transition duration-500 ${
                      index === activeIndex
                        ? "border-[#ff5b4d] bg-[#ff5b4d] text-white"
                        : index < activeIndex
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {step.number}
                  </span>
                  {index < FLOW_STEPS.length - 1 ? (
                    <span
                      className={`h-px min-w-2 flex-1 transition duration-500 ${
                        index < activeIndex ? "bg-slate-950" : "bg-slate-200"
                      }`}
                    />
                  ) : null}
                </li>
              ))}
            </ol>

            <div className="relative mt-auto min-h-[300px] pt-12" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeStep.number}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -18 }}
                  transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-x-0 top-12"
                >
                  <p className="text-sm font-black tracking-[0.14em] text-[#ff5b4d]">
                    {activeStep.number} · {activeStep.kicker}
                  </p>
                  <h3 className="mt-5 max-w-lg break-keep text-[42px] font-black leading-[1.12] tracking-[-0.055em] xl:text-[50px]">
                    {activeStep.title}
                  </h3>
                  <p className="mt-5 max-w-md break-keep text-lg font-medium leading-9 text-slate-600">
                    {activeStep.desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-auto text-xs font-bold text-slate-400">
              {activeStep.number} / {String(FLOW_STEPS.length).padStart(2, "0")}
            </div>
          </div>

          <div className="relative min-w-0 overflow-hidden bg-white">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeStep.image}
                initial={reduceMotion ? false : { opacity: 0, scale: 1.035 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={activeStep.image}
                  alt={`${activeStep.title} 단계 이미지`}
                  fill
                  sizes="(min-width: 1024px) 62vw, 1px"
                  className="object-cover object-center"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileFlow({ reduceMotion }) {
  return (
    <MobileSwipeCarousel
      label="투윅스 진행 단계"
      className="mt-10 lg:hidden"
    >
      {FLOW_STEPS.map((step, index) => (
        <motion.article
          key={step.number}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.22 }}
          transition={{
            duration: 0.6,
            delay: reduceMotion ? 0 : index * 0.04,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white"
        >
          <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-200 bg-white">
            <Image
              src={step.image}
              alt={`${step.title} 단계 이미지`}
              fill
              sizes="(max-width: 1023px) 100vw, 1px"
              className="object-cover object-center"
            />
          </div>
          <div className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff5b4d] text-xs font-black text-white">
                {step.number}
              </span>
              <span className="text-xs font-black tracking-[0.12em] text-[#ff5b4d]">
                {step.kicker}
              </span>
            </div>
            <h3 className="mt-5 break-keep text-[28px] font-black leading-[1.18] tracking-[-0.045em]">
              {step.title}
            </h3>
            <p className="mt-3 break-keep text-sm font-medium leading-7 text-slate-600 sm:text-base sm:leading-8">
              {step.desc}
            </p>
          </div>
        </motion.article>
      ))}
    </MobileSwipeCarousel>
  );
}

export default function FlowSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="process" className="border-b border-slate-200 bg-white text-slate-950">
      <MobileFrame className="py-16 md:py-32">
        <div className="max-w-4xl">
          <p className="text-xs font-black tracking-[0.08em] text-[#ff5b4d] md:text-sm">
            진행 방식
          </p>
          <h2 className="mt-5 break-keep text-[38px] font-black leading-[1.12] tracking-[-0.055em] md:text-6xl">
            신청부터 만남까지,
            <br />
            <span className="text-slate-500">한 흐름으로 이어집니다.</span>
          </h2>
        </div>

        <DesktopFlow reduceMotion={reduceMotion} />
        <MobileFlow reduceMotion={reduceMotion} />
      </MobileFrame>
    </section>
  );
}
