import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PiClockAfternoonDuotone,
  PiHeartDuotone,
  PiXBold,
} from "react-icons/pi";

function ActionButton({ icon, bgClass, iconClass, onClick, hoverText }) {
  const Icon = icon;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const timerRef = useRef(null);

  const showTooltip = () => {
    if (!hoverText) return;
    setTooltipOpen(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTooltipOpen(false);
    }, 1400);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <AnimatePresence>
        {tooltipOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="absolute bottom-[60px] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-900 px-3 py-2 text-[12px] font-semibold text-white shadow-lg"
          >
            {hoverText}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={onClick}
        onMouseEnter={showTooltip}
        onTouchStart={showTooltip}
        className={`flex h-[54px] w-[54px] items-center justify-center rounded-full shadow-sm ${bgClass}`}
        style={{ cursor: "pointer" }}
      >
        <Icon className={`text-[24px] ${iconClass}`} />
      </button>
    </div>
  );
}

export default function ArenaActionBar({
  onNextLater,
  onReject,
  onLike,
}) {
  return (
    <div className="shrink-0 border-t border-slate-200 bg-trasparent px-4 py-3">
      <div className="flex items-center justify-center gap-6">
        <ActionButton
          icon={PiClockAfternoonDuotone}
          bgClass="bg-violet-100"
          iconClass="text-violet-700"
          onClick={onNextLater}
          hoverText="다음에 선택"
        />

        <ActionButton
          icon={PiXBold}
          bgClass="bg-zinc-700"
          iconClass="text-white"
          onClick={onReject}
          hoverText="거절하기"
        />

        <ActionButton
          icon={PiHeartDuotone}
          bgClass="bg-rose-500"
          iconClass="text-white"
          onClick={onLike}
          hoverText="호감 보내기"
        />
      </div>
    </div>
  );
}