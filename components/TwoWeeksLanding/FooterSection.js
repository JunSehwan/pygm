import Link from "next/link";
import { FiArrowUpRight, FiMessageCircle } from "react-icons/fi";
import { LEGAL_LINKS, LEGAL_META } from "components/About/LegalMeta";
import MobileFrame from "./MobileFrame";
import LogoMark from "./LogoMark";
import {
  KAKAO_INQUIRY_URL,
  REGISTER_URL,
} from "./constants";
import { trackTwoWeeksEvent } from "lib/gtag";

export default function FooterSection() {
  return (
    <footer className="bg-white text-slate-950">
      <MobileFrame className="pb-32 pt-10 md:pb-36 md:pt-16">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_22px_70px_rgba(15,23,42,0.08)] md:rounded-[44px] md:px-12 md:py-20">
          <p className="text-xs font-black tracking-[0.08em] text-[#d85b48] md:text-sm">
            투윅스 1기 모집 중
          </p>
          <h2 className="mt-5 break-keep text-[38px] font-black leading-[1.1] tracking-[-0.06em] md:text-7xl">
            2주에 한 번,
            <br />
            일상에 작은 설렘을 더해보세요.
          </h2>
          <p className="mx-auto mt-5 max-w-xl break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            한 사람을 소개받고, 괜찮으면 카페에서 한 시간.
            <br className="hidden sm:block" /> 투윅스는 그 정도의 가벼운 시작이면 충분합니다.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={REGISTER_URL}
              onClick={() =>
                trackTwoWeeksEvent("twoweeks_cta_click", {
                  location: "footer",
                  destination: "register",
                })
              }
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-950 px-8 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d85b48]"
            >
              무료로 시작하기
              <FiArrowUpRight className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a
              href={KAKAO_INQUIRY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackTwoWeeksEvent("twoweeks_consultation_click", {
                  location: "footer",
                  destination: "kakao",
                })
              }
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-8 text-base font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-950"
            >
              <FiMessageCircle aria-hidden="true" />
              먼저 상담하기
            </a>
          </div>
          <p className="mt-5 text-xs font-bold text-slate-500 md:text-sm">
            현재 소개비 무료 · 서울 남부권 중심으로 운영 중
          </p>
        </div>

        <div className="mt-10 grid gap-8 border-t border-slate-200 pt-8 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <LogoMark
              variant="dark"
              decorative={false}
              className="h-8 w-8"
            />
            <div className="mt-3 space-y-1 text-xs leading-6 text-slate-500 md:text-sm md:leading-7">
              <div>
                상호: {LEGAL_META.companyName} · 대표자:{" "}
                {LEGAL_META.representativeName}
              </div>
              <div>
                사업자등록번호: {LEGAL_META.businessRegistrationNumber}
              </div>
              <div>주소: {LEGAL_META.address}</div>
              <div>
                고객센터: {LEGAL_META.phoneNumber} · {LEGAL_META.email}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 md:text-right md:text-sm">
            <div>© 2026 {LEGAL_META.serviceName}. All rights reserved.</div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-bold text-slate-700 underline underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </MobileFrame>
    </footer>
  );
}
