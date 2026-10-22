import Link from "next/link";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiCheck,
  FiClock,
  FiCoffee,
  FiHelpCircle,
  FiMessageCircle,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import { LEGAL_LINKS, LEGAL_META } from "components/About/LegalMeta";
import LogoMark from "components/TwoWeeksLanding/LogoMark";
import {
  KAKAO_INQUIRY_URL,
  LOGIN_URL,
  REGISTER_URL,
} from "components/TwoWeeksLanding/constants";
import GuideDirectory from "./GuideDirectory";
import GuideScreenExamples from "./GuideScreenExamples";
import { GUIDE_FAQS, GUIDE_FLOW_STEPS } from "./guideData";

const DEPOSIT_ROWS = [
  {
    stage: "프로필 제안 단계",
    situation: "진행 전 쉬어가기·거절",
    rate: "차감 없음",
    tone: "text-emerald-700",
  },
  {
    stage: "두 사람 수락 후",
    situation: "일정·장소 확정 전 취소",
    rate: "기준액 30%",
    tone: "text-amber-700",
  },
  {
    stage: "약속 확정 후",
    situation: "만남 전날까지 취소",
    rate: "기준액 50%",
    tone: "text-orange-700",
  },
  {
    stage: "만남 당일",
    situation: "당일 취소·무단 불참·노쇼",
    rate: "기준액 100%",
    tone: "text-rose-700",
  },
];

function GuideHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/[0.94] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between gap-3 px-5 md:h-[76px] md:px-8">
        <Link href="/2weeks" className="flex min-w-0 items-center gap-2.5" aria-label="투윅스 홈으로 이동">
          <LogoMark variant="dark" decorative={false} className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
          <div className="min-w-0">
            <div className="truncate text-sm font-black tracking-[0.08em] text-slate-950">2WEEKS</div>
            <div className="truncate text-[10px] font-bold text-slate-400">이용안내센터</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 lg:flex" aria-label="이용안내 메뉴">
          <a href="#flow" className="transition hover:text-slate-950">전체 과정</a>
          <a href="#screens" className="transition hover:text-slate-950">화면 미리 보기</a>
          <a href="#guide" className="transition hover:text-slate-950">주제별 안내</a>
          <a href="#deposit-policy" className="transition hover:text-slate-950">예치금 기준</a>
          <a href="#faq" className="transition hover:text-slate-950">자주 묻는 질문</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/2weeks"
            className="hidden rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:inline-flex"
          >
            투윅스 홈
          </Link>
          <Link
            href={LOGIN_URL}
            className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-[#d85b48]"
          >
            신청현황
          </Link>
        </div>
      </div>
    </header>
  );
}

function GuideHero() {
  return (
    <section className="overflow-hidden border-b border-slate-100 bg-white pb-16 pt-[108px] md:pb-24 md:pt-[140px]">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.06fr_0.94fr] lg:gap-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm">
            <FiHelpCircle className="text-[#d85b48]" aria-hidden="true" /> 처음 이용하는 분을 위한 안내
          </div>
          <h1 className="mt-6 max-w-3xl break-keep text-[40px] font-black leading-[1.09] tracking-[-0.065em] text-slate-950 sm:text-5xl md:text-[64px]">
            처음이라 낯설 수 있으니까,
            <br />
            <span className="text-[#d85b48]">실제 진행 순서대로.</span>
          </h1>
          <p className="mt-6 max-w-2xl break-keep text-base font-medium leading-8 text-slate-600 md:text-lg md:leading-9">
            프로필 등록부터 한 사람의 제안, 일정과 카페 선택, 만남 당일과 연락처 공개까지 투윅스가 어떻게 진행되는지 한곳에 정리했습니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#flow"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-950 px-7 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d85b48]"
            >
              전체 과정 1분 보기 <FiArrowRight aria-hidden="true" />
            </a>
            <a
              href="#guide"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 text-base font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-950"
            >
              <FiSearch aria-hidden="true" /> 궁금한 내용 찾기
            </a>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-500 md:text-sm">
            <span className="flex items-center gap-1.5"><FiCheck className="text-emerald-600" /> 운영자 직접 검토</span>
            <span className="flex items-center gap-1.5"><FiClock className="text-blue-600" /> 제안 응답 48시간</span>
            <span className="flex items-center gap-1.5"><FiShield className="text-[#d85b48]" /> 연락처는 상호 동의 시 공개</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#fff0ec]" />
          <div className="absolute -bottom-12 -right-8 h-52 w-52 rounded-full bg-blue-50" />
          <div className="relative rounded-[36px] border border-slate-200 bg-[#f7f8fa] p-5 shadow-[0_32px_90px_rgba(15,23,42,0.13)] md:p-7">
            <div className="rounded-[26px] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black tracking-[0.14em] text-[#d85b48]">2WEEKS</div>
                  <div className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">새로운 소개가 도착했어요</div>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white">
                  <FiCoffee aria-hidden="true" />
                </span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {["프로필 확인", "진행 여부 선택", "일정·카페 조율"].map((item, index) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                    <div className="text-[10px] font-black text-[#d85b48]">0{index + 1}</div>
                    <div className="mt-1 text-[11px] font-black text-slate-700">{item}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 rounded-[24px] border border-emerald-100 bg-emerald-50 px-5 py-4">
              <div className="text-sm font-black text-emerald-900">내가 만나고 싶을 때만 진행</div>
              <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800">
                상대도 같은 마음이면 다음 주말의 일정과 카페를 함께 선택합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowSection() {
  return (
    <section id="flow" className="scroll-mt-24 border-b border-slate-100 bg-[#fbfbfa] py-16 md:py-24">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-black tracking-[0.1em] text-[#d85b48]">전체 과정</p>
          <h2 className="mt-3 break-keep text-[32px] font-black leading-[1.18] tracking-[-0.055em] text-slate-950 md:text-5xl">
            가입부터 연락처 공개까지
          </h2>
          <p className="mt-4 break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            필요한 순간마다 문자와 신청현황 화면으로 다음 행동을 안내합니다.
          </p>
        </div>

        <ol className="-mx-5 mt-9 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
          {GUIDE_FLOW_STEPS.map((step) => (
            <li
              key={step.number}
              className="min-w-[270px] snap-start rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)] md:min-w-0 md:p-6"
            >
              <div className="text-xs font-black tracking-[0.12em] text-[#d85b48]">{step.number}</div>
              <h3 className="mt-5 text-xl font-black tracking-[-0.04em] text-slate-950">{step.title}</h3>
              <p className="mt-3 break-keep text-sm font-medium leading-7 text-slate-600">{step.desc}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold leading-6 text-blue-900">
          핵심은 간단합니다. 소개받은 상대를 확인하고 내가 원할 때만 진행하며, 두 사람 모두 원해야 실제 약속과 연락처 공개로 이어집니다.
        </div>
      </div>
    </section>
  );
}

function DepositPolicySection() {
  return (
    <section id="deposit-policy" className="scroll-mt-24 border-y border-slate-100 bg-[#f7f8fa] py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.38fr_0.62fr] lg:gap-16">
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-[#d85b48] shadow-sm">
            <FiShield aria-hidden="true" />
          </span>
          <h2 className="mt-5 break-keep text-[32px] font-black leading-[1.18] tracking-[-0.055em] text-slate-950 md:text-5xl">
            예치금은 소개비가 아닌 약속 보증금입니다.
          </h2>
          <p className="mt-5 break-keep text-base font-medium leading-8 text-slate-600">
            기본 기준은 30,000원이며 외부 플랫폼 참여자는 안내된 회원별 기준 금액이 적용될 수 있습니다. 실제 잔액과 기준 금액은 신청현황에서 확인합니다.
          </p>
          <Link
            href="/about/refund"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-black text-slate-950 underline decoration-[#d85b48] decoration-2 underline-offset-4"
          >
            환불정책 전문 보기 <FiArrowUpRight aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="hidden grid-cols-[0.8fr_1.35fr_0.65fr] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-black text-slate-500 sm:grid">
            <div>진행 단계</div>
            <div>상황</div>
            <div className="text-right">차감 기준</div>
          </div>
          <div className="divide-y divide-slate-100">
            {DEPOSIT_ROWS.map((row) => (
              <div key={row.stage} className="grid gap-2 px-5 py-5 sm:grid-cols-[0.8fr_1.35fr_0.65fr] sm:items-center sm:gap-4 sm:px-6">
                <div className="text-sm font-black text-slate-950">{row.stage}</div>
                <div className="text-sm font-medium leading-6 text-slate-600">{row.situation}</div>
                <div className={`text-sm font-black sm:text-right ${row.tone}`}>{row.rate}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 bg-[#fff8f6] px-5 py-4 text-xs font-bold leading-6 text-[#8e3a2e] sm:px-6 sm:text-sm">
            기준 30,000원은 9,000원·15,000원·30,000원, 기준 20,000원은 6,000원·10,000원·20,000원입니다.
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 bg-white py-16 md:py-24">
      <div className="mx-auto w-full max-w-4xl px-5 md:px-8">
        <div className="text-center">
          <p className="text-xs font-black tracking-[0.1em] text-[#d85b48]">FAQ</p>
          <h2 className="mt-3 break-keep text-[32px] font-black leading-[1.18] tracking-[-0.055em] text-slate-950 md:text-5xl">
            자주 묻는 질문
          </h2>
        </div>
        <div className="mt-9 space-y-3">
          {GUIDE_FAQS.map((item) => (
            <details key={item.q} className="group rounded-[22px] border border-slate-200 bg-white px-5 py-1 md:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 marker:content-none">
                <span className="break-keep text-base font-black text-slate-950 md:text-lg">{item.q}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-open:rotate-45 group-open:bg-slate-950 group-open:text-white">
                  +
                </span>
              </summary>
              <p className="border-t border-slate-100 pb-6 pt-5 break-keep text-sm font-medium leading-7 text-slate-600 md:text-base md:leading-8">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-white px-5 pb-24 md:px-8 md:pb-28">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-slate-950 px-6 py-12 text-center text-white md:rounded-[44px] md:px-12 md:py-20">
        <p className="text-xs font-black tracking-[0.1em] text-[#ff998a]">이제 흐름을 확인하셨다면</p>
        <h2 className="mt-4 break-keep text-[34px] font-black leading-[1.14] tracking-[-0.055em] md:text-6xl">
          한 번 등록해두고,
          <br />
          좋은 소개를 기다려보세요.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl break-keep text-sm font-medium leading-7 text-slate-300 md:text-lg md:leading-8">
          소개를 받았다고 반드시 만날 필요는 없습니다. 프로필을 확인한 뒤 편하게 선택하면 됩니다.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={REGISTER_URL}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#fff0ec]"
          >
            무료로 시작하기 <FiArrowUpRight aria-hidden="true" />
          </Link>
          <a
            href={KAKAO_INQUIRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/25 px-8 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            <FiMessageCircle aria-hidden="true" /> 먼저 상담하기
          </a>
        </div>
      </div>
    </section>
  );
}

function GuideFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#f7f8fa]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 text-xs text-slate-500 md:grid-cols-[1fr_auto] md:px-8 md:text-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark variant="dark" decorative={false} className="h-8 w-8" />
            <span className="font-black tracking-[0.08em] text-slate-900">2WEEKS GUIDE</span>
          </div>
          <div className="mt-4 space-y-1 leading-6">
            <div>{LEGAL_META.companyName} · 대표자 {LEGAL_META.representativeName}</div>
            <div>고객센터 {LEGAL_META.phoneNumber} · {LEGAL_META.email}</div>
          </div>
        </div>
        <div className="md:text-right">
          <div>© 2026 {LEGAL_META.serviceName}. All rights reserved.</div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="font-bold text-slate-700 underline underline-offset-4">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function TwoWeeksGuide() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 92px;
        }

        body {
          background: #ffffff;
        }

        html,
        body,
        div#__next {
          overflow-x: clip !important;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
      `}</style>

      <GuideHeader />
      <main>
        <GuideHero />
        <FlowSection />
        <GuideScreenExamples />
        <GuideDirectory supportUrl={KAKAO_INQUIRY_URL} />
        <DepositPolicySection />
        <FaqSection />
        <FinalCta />
      </main>
      <GuideFooter />
    </div>
  );
}
