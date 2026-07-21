import Link from "next/link";
import { TWOWEEKS_LANDING_PATH } from "./constants";

export default function ProposalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link href={TWOWEEKS_LANDING_PATH} className="flex items-center" aria-label="2WEEKS 홈">
          <img
            src="/logo/2weeks_logo_white.png"
            alt="2WEEKS"
            className="h-7 w-[108px] object-contain md:h-8 md:w-[128px]"
            draggable={false}
          />
        </Link>

        <Link
          href={TWOWEEKS_LANDING_PATH}
          className="inline-flex items-center rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white hover:text-white md:px-4 md:py-2"
        >
          홈
        </Link>
      </div>
    </header>
  );
}
