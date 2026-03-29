import React, { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  PiImagesSquareDuotone,
  PiLockKeyDuotone,
  PiCheckCircleFill,
  PiBriefcaseDuotone,
} from "react-icons/pi";
import { AnimatePresence, motion } from "framer-motion";
import {
  getRegisteredPhotoCount,
  isIdentityVerified,
  isCompanyVerified,
} from "components/Arena/Detail/arenaDetailUtils";

function StatusIcon({ icon, tone = "emerald", title }) {
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
      <Icon className="text-[16px]" />
    </div>
  );
}

export default function MaleDetailPhotoCarousel({
  viewer,
  targetUser,
  photoList = [],
  photoIndex = 0,
  setPhotoIndex,
}) {
  const touchStartXRef = useRef(0);
  const [lockMessageOpen, setLockMessageOpen] = useState(false);

  const myPhotoCount = useMemo(() => getRegisteredPhotoCount(viewer || {}), [viewer]);

  const visiblePhotoCount = useMemo(() => {
    if (!photoList.length) return 0;
    return Math.max(1, Math.min(photoList.length, myPhotoCount || 1));
  }, [photoList, myPhotoCount]);

  const hasLockedSlide = photoList.length > visiblePhotoCount;
  const totalSlides = hasLockedSlide ? visiblePhotoCount + 1 : visiblePhotoCount;
  const isLockedSlide = hasLockedSlide && photoIndex === visiblePhotoCount;

  useEffect(() => {
    let timer = null;
    if (lockMessageOpen) {
      timer = setTimeout(() => setLockMessageOpen(false), 1500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [lockMessageOpen]);

  const goPrev = () => {
    if (totalSlides <= 1) return;
    setPhotoIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goNext = () => {
    if (totalSlides <= 1) return;
    const next = (photoIndex + 1) % totalSlides;
    if (hasLockedSlide && next === visiblePhotoCount) {
      setLockMessageOpen(true);
    }
    setPhotoIndex(next);
  };

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div
        className="relative h-[320px] w-full overflow-hidden bg-slate-200"
        onTouchStart={(e) => {
          touchStartXRef.current = e.touches[0]?.clientX || 0;
        }}
        onTouchEnd={(e) => {
          const endX = e.changedTouches[0]?.clientX || 0;
          const diff = touchStartXRef.current - endX;
          if (diff > 40) goNext();
          if (diff < -40) goPrev();
        }}
      >
        {!isLockedSlide ? (
          <>
            <Image
              src={photoList[photoIndex] || "/image/profile/default.png"}
              alt="프로필 사진"
              fill
              className="object-cover select-none"
              unoptimized
              draggable={false}
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm">
              <PiLockKeyDuotone className="text-[32px]" />
            </div>

            <div className="mt-4 text-[18px] font-bold text-zinc-900">
              더 많은 사진은 아직 잠겨 있어요
            </div>

            <div className="mt-2 break-keep text-[14px] leading-6 text-slate-600">
              내 사진을 더 등록하면
              <br />
              상대방 이미지를 더 확인할 수 있습니다.
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-slate-700">
              <PiImagesSquareDuotone className="text-[16px]" />
              내 등록 사진 {myPhotoCount}장 기준 공개
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 pt-3">
          <div className="inline-flex rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
            {Math.min(photoIndex + 1, totalSlides)} / {totalSlides}
          </div>

          {/* <div className="inline-flex rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
            스와이프
          </div> */}
        </div>

        {/* <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          {isIdentityVerified(targetUser) ? (
            <StatusIcon icon={PiCheckCircleFill} tone="emerald" title="본인인증 완료" />
          ) : null}

          {isCompanyVerified(targetUser) ? (
            <StatusIcon icon={PiBriefcaseDuotone} tone="sky" title="재직인증 완료" />
          ) : null}
        </div> */}

        {totalSlides > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
              style={{ cursor: "pointer" }}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
              style={{ cursor: "pointer" }}
            >
              ›
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