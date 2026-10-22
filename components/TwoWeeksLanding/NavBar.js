import Link from "next/link";
import { FiArrowRight, FiExternalLink } from "react-icons/fi";
import { GUIDE_URL, LOGIN_URL, RECRUITMENT_CONFIG, REGISTER_URL } from "./constants";
import LogoMark from "./LogoMark";
import { trackTwoWeeksEvent } from "lib/gtag";

export default function NavBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/[0.92] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between gap-4 px-5 md:h-[76px] md:px-8">
        <Link href="/2weeks" aria-label="투윅스 홈" className="flex shrink-0 items-center gap-2.5">
          <LogoMark variant="dark" decorative={false} className="h-8 w-8 md:h-9 md:w-9" />
          <span className="text-sm font-black tracking-[0.08em] text-slate-950 md:text-base">2WEEKS</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 lg:flex" aria-label="주요 메뉴">
          <a href="#how" className="transition hover:text-slate-950">이용 방법</a>
          <Link
            href={GUIDE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackTwoWeeksEvent("twoweeks_guide_open", {
                location: "nav",
                destination: "guide",
              })
            }
            className="inline-flex items-center gap-1 transition hover:text-slate-950"
          >
            상세 이용안내 <FiExternalLink aria-hidden="true" />
          </Link>
          <a href="#compare" className="transition hover:text-slate-950">방식 비교</a>
          <a href="#safety" className="transition hover:text-slate-950">안심 기준</a>
          <a href="#journey" className="transition hover:text-slate-950">상세 과정</a>
          <a href="#screen" className="transition hover:text-slate-950">이용 화면</a>
        </nav>

        <div className="flex items-center gap-2">
          {RECRUITMENT_CONFIG.enabled ? (
            <span className="hidden rounded-full bg-[#f7f1ed] px-3 py-2 text-xs font-black text-[#b74636] xl:inline-flex">
              {RECRUITMENT_CONFIG.cohortLabel} · {RECRUITMENT_CONFIG.deadlineLabel}
            </span>
          ) : null}
          <Link
            href={LOGIN_URL}
            className="rounded-full px-3 py-3 bg-slate-100 text-sm font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-950 md:inline-flex"
          >
            마이페이지
          </Link>
          <Link
            href={REGISTER_URL}
            onClick={() =>
              trackTwoWeeksEvent("twoweeks_cta_click", {
                location: "nav",
                destination: "register",
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d85b48] md:px-5"
          >
            시작하기
            <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
