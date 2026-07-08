import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import { LEGAL_LINKS, LEGAL_META } from "components/About/LegalMeta";
import MobileFrame from "./MobileFrame";
import LogoMark from "./LogoMark";
import { REGISTER_URL } from "./constants";
import { reveal } from "./motionConfig";

export default function FooterSection() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-black md:min-h-screen md:snap-start">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(255,102,0,0.12),transparent_20%),radial-gradient(circle_at_right_bottom,rgba(255,102,0,0.18),transparent_22%)]" />
      <div className="absolute bottom-0 right-0 h-[48%] w-[70%] bg-[radial-gradient(circle_at_bottom_right,rgba(255,150,80,0.16),transparent_36%)]" />
      <LogoMark
        variant="dark"
        className="pointer-events-none absolute bottom-8 right-8 hidden h-72 w-72 opacity-[0.08] md:block"
        imgClassName="scale-125"
      />

      <MobileFrame className="relative flex min-h-[100svh] flex-col justify-between py-16 md:min-h-screen md:py-20">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.div {...reveal("scale")}>
            <div className="mb-3 inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300 md:text-xs">
              2WEEKS BETA
            </div>

            <h2 className="text-[36px] font-black leading-tight tracking-[-0.055em] text-white md:text-6xl">
              투윅스 <span className="text-orange-500">1기</span>에 참여해볼까요?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl break-keep text-[15px] leading-7 text-zinc-300 md:text-lg md:leading-8">
              85년생부터 00년생까지, 2주에 한 번 이어지는 새로운 오프라인 만남.
            </p>

            <div className="mt-8">
              <Link
                href={REGISTER_URL}
                className="group inline-flex items-center justify-center rounded-full bg-orange-500 px-8 py-4 text-base font-semibold text-white shadow-[0_18px_50px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-400"
              >
                투윅스 1기에 신청하기
                <FiArrowRight className="ml-2 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.footer
          {...reveal("up", 0.12)}
          className="mt-16 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-xl md:rounded-[28px] md:p-8"
        >
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <div className="text-lg font-bold text-white md:text-xl">{LEGAL_META.serviceName}</div>

              <div className="mt-3 space-y-1 text-xs leading-6 text-zinc-300 md:text-sm md:leading-7">
                <div>상호: {LEGAL_META.companyName}</div>
                <div>대표자: {LEGAL_META.representativeName}</div>
                <div>사업자등록번호: {LEGAL_META.businessRegistrationNumber}</div>
                <div>주소: {LEGAL_META.address}</div>
                <div>고객센터 전화: {LEGAL_META.phoneNumber}</div>
                <div>이메일: {LEGAL_META.email}</div>
              </div>
            </div>

            <div className="text-xs text-zinc-400 md:text-right md:text-sm">
              <div>© 2026 {LEGAL_META.serviceName}</div>
              <div className="mt-1">All rights reserved.</div>
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 md:justify-end">
                {LEGAL_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="underline underline-offset-4">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.footer>
      </MobileFrame>
    </section>
  );
}
