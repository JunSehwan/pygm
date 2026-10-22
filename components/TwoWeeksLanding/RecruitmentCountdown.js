import { useEffect, useMemo, useState } from "react";
import { RECRUITMENT_CONFIG } from "./constants";

const EMPTY_REMAINING = {
  days: "--",
  hours: "--",
  minutes: "--",
  seconds: "--",
  expired: false,
};

function getRemaining(deadline) {
  const target = new Date(deadline).getTime();
  const distance = target - Date.now();

  if (!Number.isFinite(target) || distance <= 0) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
      expired: true,
    };
  }

  const days = Math.floor(distance / 86400000);
  const hours = Math.floor((distance % 86400000) / 3600000);
  const minutes = Math.floor((distance % 3600000) / 60000);
  const seconds = Math.floor((distance % 60000) / 1000);

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    expired: false,
  };
}

export default function RecruitmentCountdown({
  compact = false,
  showSeconds = true,
  className = "",
}) {
  const [remaining, setRemaining] = useState(EMPTY_REMAINING);

  useEffect(() => {
    const update = () => setRemaining(getRemaining(RECRUITMENT_CONFIG.deadline));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const units = useMemo(() => {
    const rows = [
      { key: "days", label: "일" },
      { key: "hours", label: "시간" },
      { key: "minutes", label: "분" },
    ];
    if (showSeconds) rows.push({ key: "seconds", label: "초" });
    return rows;
  }, [showSeconds]);

  if (remaining.expired) {
    return (
      <div className={`font-bold text-rose-600 ${className}`} role="status">
        {RECRUITMENT_CONFIG.cohortLabel} 모집이 마감됐어요
      </div>
    );
  }

  return (
    <div
      className={`flex items-center ${compact ? "gap-1.5" : "gap-1.5 md:gap-3"} ${className}`}
      aria-label={`${RECRUITMENT_CONFIG.cohortLabel} 모집 마감까지 ${remaining.days}일 ${remaining.hours}시간 ${remaining.minutes}분 남음`}
    >
      {units.map((unit, index) => (
        <div key={unit.key} className="flex items-center">
          <div
            className={`flex items-baseline justify-center rounded-xl bg-slate-950 text-white shadow-sm ${
              compact
                ? "min-w-[42px] px-2 py-1.5"
                : "min-w-[50px] px-2 py-2.5 md:min-w-[70px] md:px-4"
            }`}
          >
            <span
              className={`font-black tabular-nums tracking-[-0.04em] ${
                compact ? "text-sm" : "text-lg md:text-2xl"
              }`}
            >
              {remaining[unit.key]}
            </span>
            <span
              className={`ml-1 font-semibold text-slate-300 ${
                compact ? "text-[9px]" : "text-[10px] md:text-xs"
              }`}
            >
              {unit.label}
            </span>
          </div>
          {index < units.length - 1 ? (
            <span
              aria-hidden="true"
              className={`font-black text-slate-400 ${compact ? "ml-1.5 text-xs" : "ml-1.5 text-xs md:ml-3 md:text-base"}`}
            >
              :
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
