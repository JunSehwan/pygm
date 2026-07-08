import Link from "next/link";
import { LOGIN_URL } from "./constants";

export default function NavBar() {
  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/45 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:h-20 md:px-8">
        <Link href="/2weeks" className="text-xl font-black tracking-tight text-white">
          2WEEKS
        </Link>

        <Link
          href={LOGIN_URL}
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-orange-400 hover:text-orange-300 md:text-sm"
        >
          신청 현황 조회
        </Link>
      </div>
    </header>
  );
}
