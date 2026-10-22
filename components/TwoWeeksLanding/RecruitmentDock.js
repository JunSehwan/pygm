import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import RecruitmentCountdown from "./RecruitmentCountdown";
import {
  RECRUITMENT_CONFIG,
  REGISTER_URL,
} from "./constants";
import { trackTwoWeeksEvent } from "lib/gtag";

export default function RecruitmentDock() {
  if (!RECRUITMENT_CONFIG.enabled) return null;

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200/80 bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-16px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl md:px-6 md:py-3"
      aria-label={`${RECRUITMENT_CONFIG.cohortLabel} 모집 안내`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="hidden min-w-[180px] md:block">
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#d85b48]" />
            {RECRUITMENT_CONFIG.cohortLabel} {RECRUITMENT_CONFIG.statusLabel}
          </div>
          <div className="mt-0.5 text-xs font-medium text-slate-500">
            {RECRUITMENT_CONFIG.deadlineLabel}
          </div>
        </div>

        <RecruitmentCountdown
          compact
          showSeconds={false}
          className="min-w-0 flex-1 md:flex-none"
        />

        <Link
          href={REGISTER_URL}
          onClick={() =>
            trackTwoWeeksEvent("twoweeks_cta_click", {
              location: "recruitment_dock",
              destination: "register",
            })
          }
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#d85b48] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(216,91,72,0.24)] transition hover:-translate-y-0.5 hover:bg-[#bb4939] md:h-12 md:px-6 md:text-base"
        >
          무료로 시작하기
          <FiArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
