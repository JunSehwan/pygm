import Link from "next/link";
import { TWOWEEKS_LANDING_PATH } from "./constants";
export default function ProposalHeader() {
  return <header className="sticky top-0 z-30 border-b border-[#e5ebf3] bg-white shadow backdrop-blur-lg">
    <div className="mx-auto flex h-[70px] max-w-[640px] items-center justify-between px-5">
      <Link href={TWOWEEKS_LANDING_PATH} aria-label="투윅스 소개 페이지" className="inline-flex items-center">
        <img src="/logo/2weeks_logo.png" alt="2WEEKS" className="h-9 w-9 object-contain" draggable={false}/>
      </Link>
      <Link href={TWOWEEKS_LANDING_PATH} className="rounded-xl border border-[#dce6f4] bg-white px-3 py-2 text-xs font-bold text-[#526b8b]">투윅스 소개</Link>
    </div>
  </header>;
}
