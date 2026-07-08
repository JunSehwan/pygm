import React from "react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import Link from "next/link";
import { LEGAL_LINKS, LEGAL_META } from "components/About/LegalMeta";

function NaverIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.2 4.5h5.1l5.4 7.7V4.5h5.1v15h-5.1l-5.4-7.7v7.7H4.2v-15Z"
      />
    </svg>
  );
}

function KakaoTalkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 4.2c-4.75 0-8.6 3.05-8.6 6.8 0 2.38 1.55 4.46 3.88 5.68l-.82 3.02c-.1.36.31.64.62.43l3.64-2.43c.42.05.85.08 1.28.08 4.75 0 8.6-3.05 8.6-6.78 0-3.75-3.85-6.8-8.6-6.8Z"
      />
    </svg>
  );
}

const socialLinks = [
  {
    label: "네이버 카페",
    href: "https://cafe.naver.com/pygm",
    icon: NaverIcon,
    // className: "bg-[#03C75A] text-white",
    className: "bg-slate-900 text-white",
  },
  {
    label: "인스타그램",
    href: "https://www.instagram.com/charmingsoup.lv/",
    icon: FaInstagram,
    className:
      // "bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 text-white",
      "bg-slate-900 text-white text-[20px]",
  },
  {
    label: "페이스북",
    href: "https://www.facebook.com/charmingsoup/",
    icon: FaFacebookF,
    className: 
    // "bg-[#1877F2] text-white",
      "bg-slate-900 text-white text-[20px]",
  },
  {
    label: "카카오톡 상담",
    href: "https://open.kakao.com/o/sAJwMNCe",
    icon: KakaoTalkIcon,
    className: 
    // "bg-[#FEE500] text-slate-900",
      "bg-slate-900 text-white",
  },
];

function FooterLine({ children }) {
  return (
    <div className="break-keep text-[12px] leading-4 text-slate-500">
      {children}
    </div>
  );
}

function SocialIconButton({ item }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.label}
      title={item.label}
      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-[0_8px_18px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 ${item.className}`}
    >
      <Icon />
    </a>
  );
}

export default function LandingFooter() {
  const {
    serviceName,
    companyName,
    representativeName,
    businessRegistrationNumber,
    address,
    email,
    phoneNumber,
  } = LEGAL_META;

  return (
    <footer className="bg-[#f5f5f7] px-4 pb-7 pt-2">
      <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-slate-800">
              &copy;{serviceName}
            </div>
            <p className="mt-1 break-keep text-[11px] leading-4 text-slate-500">
              CharmingSoup.com
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {socialLinks.map((item) => (
              <SocialIconButton key={item.label} item={item} />
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3">
          <div className="space-y-1.5">
            <FooterLine>
              <span className="font-medium text-slate-700">상호</span>{" "}
              {companyName}
            </FooterLine>

            <FooterLine>
              <span className="font-medium text-slate-700">대표자</span>{" "}
              {representativeName}
            </FooterLine>

            <FooterLine>
              <span className="font-medium text-slate-700">
                사업자등록번호
              </span>{" "}
              {businessRegistrationNumber}
            </FooterLine>

            <FooterLine>
              <span className="font-medium text-slate-700">주소</span>{" "}
              {address}
            </FooterLine>

            <FooterLine>
              <span className="font-medium text-slate-700">고객센터 전화</span>{" "}
              {phoneNumber}
            </FooterLine>

            <FooterLine>
              <span className="font-medium text-slate-700">이메일</span>{" "}
              {email}
            </FooterLine>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[12px] font-medium text-slate-600">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="underline underline-offset-4">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}