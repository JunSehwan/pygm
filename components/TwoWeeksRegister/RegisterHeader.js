import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { TWOWEEKS_DASHBOARD_PATH } from "./constants";

export default function RegisterHeader({ dark = false }) {
  return (
    <header className="fixed left-0 top-0 z-40 w-full bg-black text-white">
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between px-5 md:h-[78px] md:px-9">
        <Link href="/2weeks" className="text-[22px] font-black tracking-[0.02em] md:text-[26px]">
          2WEEKS
        </Link>

        <Link
          href={TWOWEEKS_DASHBOARD_PATH}
          className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-3.5 py-2 text-xs font-semibold text-white/90 transition hover:border-white hover:text-white md:px-5 md:py-2.5 md:text-sm"
        >
          신청 현황 조회
          <FiChevronRight />
        </Link>
      </div>
    </header>
  );
}
