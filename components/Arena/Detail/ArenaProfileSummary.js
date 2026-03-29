import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  PiFlagPennantDuotone,
  PiMapPinDuotone,
  PiBuildingsDuotone,
  PiGraduationCapDuotone,
  PiBriefcaseDuotone,
} from "react-icons/pi";
import { AnimatePresence, motion } from "framer-motion";
import { getRemainingHours, getArenaBadgeImage } from "lib/arena";
import { getBadgeTooltip } from "./arenaDetailUtils";

function CountdownText({ expiresAt }) {
  const [hours, setHours] = useState(getRemainingHours(expiresAt));

  useEffect(() => {
    setHours(getRemainingHours(expiresAt));
    const timer = setInterval(() => {
      setHours(getRemainingHours(expiresAt));
    }, 60000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <div className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-slate-100 px-3 text-[12px] font-bold text-zinc-700">
      {hours}시간 남음
    </div>
  );
}

function BadgeImageButton({ badgeInfo }) {
  const [open, setOpen] = useState(false);
  const tooltip = getBadgeTooltip(badgeInfo);
  const imageSrc = getArenaBadgeImage(badgeInfo);

  if (!tooltip || !imageSrc) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        className="relative h-7 w-7"
        style={{ cursor: "pointer" }}
      >
        <Image
          src={imageSrc}
          alt={tooltip}
          fill
          className="object-contain"
          unoptimized
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="absolute right-0 top-11 z-20 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-2 text-[12px] font-semibold text-white shadow-lg"
          >
            {tooltip}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function InlineInfo({ icon, label, value }) {
  if (!value) return null;
  const Icon = icon;

  return (
    <div className="flex items-center gap-2 text-[13px] leading-6 text-slate-600">
      {Icon ? <Icon className="mt-[2px] shrink-0 text-[14px] text-slate-400" /> : null}
      <div className="break-keep">
        <span className="font-semibold text-slate-500">{label} : </span>
        <span className="font-semibold text-zinc-800">{value}</span>
      </div>
    </div>
  );
}

function PairChip({ left, right, leftTone = "violet", rightTone = "slate" }) {
  const toneMap = {
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {left ? (
        <div className={`inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-bold ${toneMap[leftTone]}`}>
          {left}
        </div>
      ) : null}
      {right ? (
        <div className={`inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-bold ${toneMap[rightTone]}`}>
          {right}
        </div>
      ) : null}
    </div>
  );
}

export default function ArenaProfileSummary({
  summary,
  valueMatchPercent = 85,
  onReport,
  expiresAt,
  badgeInfo = {},
}) {
  return (
    <div className="mt-4 rounded-[14px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="break-keep text-[24px] font-extrabold tracking-[-0.03em] text-zinc-900">
              {summary.name}
            </div>
            <CountdownText expiresAt={expiresAt} />
          </div>

          {summary.birthYearShort ? (
            <div className="mt-1 text-[13px] font-semibold text-slate-400">
              {summary.birthYearShort}년생
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <BadgeImageButton badgeInfo={badgeInfo} />

          <button
            type="button"
            onClick={onReport}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-solid border-slate-200 bg-slate-50 px-3 text-[12px] font-bold text-slate-600 transition hover:bg-slate-100"
            style={{ cursor: "pointer" }}
          >
            <PiFlagPennantDuotone className="text-[15px]" />
            신고
          </button>
        </div>
      </div>

      <div className="mt-3 break-keep text-[15px] font-semibold leading-6 text-zinc-800">
        📌 {summary.jobType}  {summary.job}
      </div>

      {/* {summary.styleLine ? (
        <div className="mt-1.5 break-keep text-[14px] leading-6 text-slate-600">
          {summary.styleLine}
        </div>
      ) : null} */}

      <div className="mt-1 space-y-1">
        <InlineInfo
          icon={PiMapPinDuotone}
          label="거주지"
          value={summary.homeArea}
        />
        <InlineInfo
          icon={PiBuildingsDuotone}
          label="근무지"
          value={summary.companyArea}
        />
      </div>

      <div className="mt-3">
        <PairChip
          left={summary.mbti || ""}
          right={valueMatchPercent !== 0 ? `가치관매칭 ${valueMatchPercent}%` : `가치관매칭 : 미확인`}
          leftTone="slate"
          rightTone="violet"
        />
      </div>

      <div className="mt-2">
        <PairChip
          left={summary.education || ""}
          right={summary.marital || ""}
          leftTone="slate"
          rightTone="slate"
        />
      </div>

      {/* {summary.marital ? (
        <div className="mt-2">
          <div className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
          </div>
        </div>
      ) : null} */}

      {summary.intro ? (
        <div className="mt-3 break-keep text-[14px] leading-6 text-slate-500">
          {summary.intro}
        </div>
      ) : null}
    </div>
  );
}