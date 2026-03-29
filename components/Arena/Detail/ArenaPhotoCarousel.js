import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  PiBriefcaseDuotone,
  PiCheckCircleFill,
  PiCaretLeftBold,
  PiCaretRightBold,
} from "react-icons/pi";

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

function ImageLoadingOverlay({ loaded }) {
  return (
    <AnimatePresence>
      {!loaded ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="absolute inset-0 z-[1] overflow-hidden bg-slate-300"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300"
            animate={{ x: ["-30%", "30%", "-30%"] }}
            transition={{
              duration: 1.8,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
          <div className="absolute inset-0 bg-black/10" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function ArenaPhotoCarousel({
  photoList = [],
  visiblePhotoCount = 1,
  photoIndex = 0,
  onChangeIndex,
  isIdentityVerified = false,
  isCompanyVerified = false,
}) {
  const touchStartX = useRef(0);
  const [lockMessageOpen, setLockMessageOpen] = useState(false);
  const [direction, setDirection] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const lockTimerRef = useRef(null);

  const safeVisibleCount = Math.max(
    1,
    Math.min(photoList.length || 1, visiblePhotoCount || 1)
  );
  const currentPhoto =
    photoList[Math.min(photoIndex, safeVisibleCount - 1)] || photoList[0];

  useEffect(() => {
    setImageLoaded(false);

    const timer = setTimeout(() => {
      setImageLoaded((prev) => prev || true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentPhoto]);

  const showLocked = () => {
    if (photoList.length <= safeVisibleCount) return;

    setLockMessageOpen(true);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      setLockMessageOpen(false);
    }, 1600);
  };

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, []);

  const moveNext = () => {
    if (safeVisibleCount <= 1) return;

    if (photoIndex + 1 < safeVisibleCount) {
      setDirection(1);
      onChangeIndex(photoIndex + 1);
      return;
    }

    if (photoList.length > safeVisibleCount) {
      showLocked();
      return;
    }

    setDirection(1);
    onChangeIndex(0);
  };

  const movePrev = () => {
    if (safeVisibleCount <= 1) return;

    if (photoIndex > 0) {
      setDirection(-1);
      onChangeIndex(photoIndex - 1);
      return;
    }

    setDirection(-1);
    onChangeIndex(safeVisibleCount - 1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0]?.clientX || 0;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0]?.clientX || 0;
    const diff = touchStartX.current - endX;

    if (diff > 40) moveNext();
    if (diff < -40) movePrev();
  };

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div
        className="relative h-[320px] w-full select-none overflow-hidden bg-slate-200"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`${photoIndex}-${currentPhoto}`}
            custom={direction}
            initial={{ x: direction > 0 ? 56 : -56, opacity: 0.75, scale: 0.99 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: direction > 0 ? -40 : 40, opacity: 0.65, scale: 0.995 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <motion.div
              initial={false}
              animate={{
                filter: imageLoaded ? "blur(0px)" : "blur(8px)",
                scale: imageLoaded ? 1 : 1.015,
                opacity: imageLoaded ? 1 : 0.9,
              }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={currentPhoto}
                alt="프로필 사진"
                fill
                className="object-cover"
                unoptimized
                draggable={false}
                onLoad={() => setImageLoaded(true)}
                onLoadingComplete={() => setImageLoaded(true)}
              />
            </motion.div>

            <ImageLoadingOverlay loaded={imageLoaded} />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 pt-3">
          <div className="inline-flex rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
            {photoIndex + 1} / {safeVisibleCount}
          </div>
        </div>

        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          {isIdentityVerified ? (
            <StatusIcon icon={PiCheckCircleFill} title="본인인증 완료" tone="emerald" />
          ) : null}

          {isCompanyVerified ? (
            <StatusIcon icon={PiBriefcaseDuotone} title="재직인증 완료" tone="sky" />
          ) : null}
        </div>

        {safeVisibleCount > 1 ? (
          <>
            <button
              type="button"
              onClick={movePrev}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
              style={{ cursor: "pointer" }}
            >
              <PiCaretLeftBold className="text-[18px]" />
            </button>

            <button
              type="button"
              onClick={moveNext}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
              style={{ cursor: "pointer" }}
            >
              <PiCaretRightBold className="text-[18px]" />
            </button>
          </>
        ) : null}

        <AnimatePresence>
          {lockMessageOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute inset-x-4 bottom-16 z-10 rounded-[12px] bg-black/80 px-4 py-3 text-center text-[12px] font-semibold leading-5 text-white backdrop-blur"
            >
              내 사진을 더 등록하면 상대방 이미지를 더 확인할 수 있습니다
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}