import Link from "next/link";
import { TWOWEEKS_LANDING_PATH } from "./constants";

export default function ProposalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link href={TWOWEEKS_LANDING_PATH} className="text-xl font-black tracking-tight text-white">
          2WEEKS
        </Link>

        <Link
          href={TWOWEEKS_LANDING_PATH}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-white hover:text-white md:text-sm"
        >
          ← 랜딩으로
        </Link>
      </div>
    </header>
  );
}
