import React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { PiArrowLeft } from "react-icons/pi";
import { getDisplayName, getStyleAxisLetters, getStyleDisplayLine, getStyleTooltipText } from "lib/arena";
import { extractStyleBars } from "./arenaDetailUtils";

function ModalFrame({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="absolute inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            className="absolute inset-x-0 bottom-0 z-50 flex max-h-[82%] flex-col rounded-t-[18px] bg-white shadow-[0_-18px_60px_rgba(15,23,42,0.18)]"
          >
            <div className="shrink-0 border-b border-slate-200">
              <div className="flex h-[58px] items-center justify-between px-4">
                <div className="text-[17px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  {title}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-slate-100"
                  style={{ cursor: "pointer" }}
                >
                  <PiArrowLeft className="text-[20px]" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="flex h-[50px] w-full items-center justify-center rounded-md bg-zinc-900 text-[15px] font-bold text-white"
                style={{ cursor: "pointer" }}
              >
                닫기
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default function ArenaStyleModal({ open, onClose, user }) {
  const axisLetters = getStyleAxisLetters(user || {});
  const styleLine = getStyleDisplayLine(user || {});
  const tooltip = getStyleTooltipText(user || {});

  
  const oneLine =
    user?.styleTest?.oneLine ||
    user?.styleTest?.summary ||
    user?.styleTest?.subTitle ||
    user?.styleTest?.description ||
    "";
  const STYLE_TYPE_IMAGE_MAP = {
    DSFR: "/image/tests/style/type_1.png",
    DSFC: "/image/tests/style/type_2.png",
    DSTR: "/image/tests/style/type_3.png",
    DSTC: "/image/tests/style/type_4.png",

    DNFR: "/image/tests/style/type_5.png",
    DNFC: "/image/tests/style/type_6.png",
    DNTR: "/image/tests/style/type_7.png",
    DNTC: "/image/tests/style/type_8.png",

    ASFR: "/image/tests/style/type_9.png",
    ASFC: "/image/tests/style/type_10.png",
    ASTR: "/image/tests/style/type_11.png",
    ASTC: "/image/tests/style/type_12.png",

    ANFR: "/image/tests/style/type_13.png",
    ANFC: "/image/tests/style/type_14.png",
    ANTR: "/image/tests/style/type_15.png",
    ANTC: "/image/tests/style/type_16.png",
  };

  const getStyleImageSrc = (user = {}) => {
    const styleTest = user?.styleTest || {};

    if (styleTest.image) return styleTest.image;
    if (styleTest.characterImage) return styleTest.characterImage;

    const typeCode =
      String(
        styleTest.typeCode ||
        styleTest.code ||
        styleTest.resultCode ||
        getStyleAxisLetters(user || {}) ||
        ""
      )
        .trim()
        .toUpperCase();

    return STYLE_TYPE_IMAGE_MAP[typeCode] || "";
  };

  const styleImage = getStyleImageSrc(user || {});

  const bars = extractStyleBars(user?.styleTest || {});

  return (
    <ModalFrame open={open} onClose={onClose} title="스타일 진단">
      <div className="rounded-[16px] px-5 py-6">
        <div className="text-center">
          <div className="text-[15px] font-semibold text-slate-500">
            {getDisplayName(user || {})}님의 스타일은
          </div>

          {styleImage ? (
            <div className="relative mx-auto mt-4 h-[120px] w-[120px]">
              <Image
                src={styleImage}
                alt="스타일 이미지"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="mx-auto mt-4 flex h-[110px] w-[110px] items-center justify-center rounded-full bg-violet-100 text-[28px] font-extrabold text-violet-700">
              {axisLetters || "?"}
            </div>
          )}

          {axisLetters ? (
            <div className="mt-4 text-[18px] font-extrabold tracking-[-0.03em] text-zinc-900">
              {axisLetters}
            </div>
          ) : null}

          {styleLine ? (
            <div className="mt-1 break-keep text-[24px] font-extrabold tracking-[-0.04em] text-violet-600">
              {styleLine}
            </div>
          ) : null}

          {oneLine ? (
            <div className="mt-2 break-keep text-[14px] leading-6 text-slate-500">
              {oneLine}
            </div>
          ) : tooltip ? (
            <div className="mt-2 break-keep text-[14px] leading-6 text-slate-500">
              {tooltip}
            </div>
          ) : (
            <div className="mt-2 break-keep text-[14px] leading-6 text-slate-500">
              스타일 진단 정보가 아직 충분하지 않아요.
            </div>
          )}
        </div>

        {bars.length ? (
          <div className="mt-6 space-y-3">
            {bars.map((bar, index) => {
              const leftValue = Math.max(0, Math.min(100, Number(bar.leftValue || 0)));
              const rightValue = Math.max(0, Math.min(100, Number(bar.rightValue || 0)));

              return (
                <div key={`bar-${index}`}>
                  <div className="mb-1 flex items-center justify-between text-[12px] font-semibold text-slate-500">
                    <span>{bar.leftLabel || "왼쪽 성향"}</span>
                    <span>{bar.rightLabel || "오른쪽 성향"}</span>
                  </div>

                  <div className="flex h-[18px] overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="flex items-center justify-center bg-[#ff5747] text-[11px] font-bold text-white"
                      style={{ width: `${leftValue}%` }}
                    >
                      {leftValue}%
                    </div>
                    <div
                      className="flex items-center justify-center bg-[#6c7cf0] text-[11px] font-bold text-white"
                      style={{ width: `${rightValue}%` }}
                    >
                      {rightValue}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </ModalFrame>
  );
}