import { useEffect, useMemo, useState } from "react";
import { FiBriefcase, FiMapPin, FiShield } from "react-icons/fi";
import MobileFrame from "./MobileFrame";

const STATUS_TONES = {
  신청완료: "bg-blue-50 text-blue-700 ring-blue-100",
  승인완료: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  매칭대기: "bg-amber-50 text-amber-700 ring-amber-100",
  매칭진행: "bg-rose-50 text-rose-700 ring-rose-100",
  만남확정: "bg-violet-50 text-violet-700 ring-violet-100",
};

function isValidItem(item) {
  const requiredValues = [item?.ageGroup, item?.gender, item?.area, item?.status];
  const hasRequiredValues = requiredValues.every(
    (value) => typeof value === "string" && value.trim().length > 0
  );
  const hasSafeJobValue =
    item?.job == null ||
    (typeof item.job === "string" && item.job.trim().length > 0);

  return hasRequiredValues && hasSafeJobValue;
}

function ActivityCard({ item }) {
  return (
    <li className="w-[250px] shrink-0 rounded-[20px] border border-slate-200 bg-white px-4 py-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] md:w-[282px] md:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-[15px] font-black tracking-[-0.025em] text-slate-950 md:text-base">
          {item.ageGroup} {item.gender}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ring-inset ${
            STATUS_TONES[item.status] || STATUS_TONES.신청완료
          }`}
        >
          {item.status}
        </span>
      </div>
      <div className="mt-2.5 flex min-w-0 items-center gap-3 text-[12px] font-bold text-slate-600 md:text-[13px]">
        {item.job ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <FiBriefcase className="shrink-0 text-[#d85b48]" aria-hidden="true" />
            <span className="truncate">{item.job}</span>
          </span>
        ) : null}
        <span className="h-3 w-px shrink-0 bg-slate-200" aria-hidden="true" />
        <span className="flex min-w-0 items-center gap-1.5">
          <FiMapPin className="shrink-0 text-[#d85b48]" aria-hidden="true" />
          <span className="truncate">{item.area}</span>
        </span>
      </div>
    </li>
  );
}

function TickerGroup({ items, hidden = false }) {
  return (
    <ul
      className="twoweeks-ticker-group flex shrink-0 gap-3 pr-3"
      aria-hidden={hidden ? "true" : undefined}
    >
      {items.map((item, index) => (
        <ActivityCard
          key={`${item.ageGroup}-${item.gender}-${item.job}-${item.area}-${item.status}-${index}`}
          item={item}
        />
      ))}
    </ul>
  );
}

export default function ActivityTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECTID;
    const endpoint =
      process.env.NEXT_PUBLIC_TWOWEEKS_ACTIVITY_FEED_URL ||
      (projectId
        ? `https://asia-northeast3-${projectId}.cloudfunctions.net/getTwoWeeksActivityFeed`
        : "");

    if (!endpoint) return undefined;

    let controller = null;
    let alive = true;

    const load = () => {
      controller?.abort();
      controller = new AbortController();

      fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Activity feed ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (!alive) return;
          const safeItems = Array.isArray(data?.items)
            ? data.items.filter(isValidItem).slice(0, 14)
            : [];
          setItems(safeItems);
        })
        .catch((error) => {
          if (error?.name !== "AbortError") {
            console.warn("[TwoWeeksLanding] activity feed unavailable");
          }
        });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") load();
    };

    load();
    const refreshTimer = window.setInterval(load, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      alive = false;
      controller?.abort();
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const loopItems = useMemo(() => {
    if (!items.length) return [];
    const repeatCount = Math.max(1, Math.ceil(7 / items.length));
    return Array.from({ length: repeatCount }, () => items).flat();
  }, [items]);

  if (!loopItems.length) return null;

  const duration = Math.max(34, loopItems.length * 5.5);

  return (
    <section
      className="overflow-hidden border-b border-slate-100 bg-[#f7f8fa] py-6 md:py-8"
      aria-label="최근 실제 회원 활동"
    >
      <MobileFrame>
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d85b48] opacity-30 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#d85b48]" />
            </span>
            <h2 className="text-[14px] font-black tracking-[-0.02em] text-slate-950 md:text-base">
              최근 익명 참여 현황
            </h2>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 md:text-xs">
            <FiShield aria-hidden="true" /> 나이대·직업군·활동지역만 익명으로 표시합니다
          </p>
        </div>
      </MobileFrame>

      <ul className="sr-only">
        {items.map((item, index) => (
          <li key={`${item.ageGroup}-${item.gender}-${item.job}-${item.area}-${item.status}-${index}`}>
            {item.ageGroup} {item.gender}{item.job ? `, ${item.job}` : ""}, {item.area}, {item.status}
          </li>
        ))}
      </ul>

      <div className="relative mt-4">
        <div
          className="twoweeks-ticker-track flex w-max will-change-transform"
          style={{ "--twoweeks-ticker-duration": `${duration}s` }}
          aria-hidden="true"
        >
          <TickerGroup items={loopItems} />
          <TickerGroup items={loopItems} hidden />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f7f8fa] to-transparent md:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#f7f8fa] to-transparent md:w-24" />
      </div>

      <style jsx>{`
        .twoweeks-ticker-track {
          animation: twoweeks-activity-marquee var(--twoweeks-ticker-duration)
            linear infinite;
        }

        @keyframes twoweeks-activity-marquee {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .twoweeks-ticker-track {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
