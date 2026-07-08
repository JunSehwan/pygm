import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { PiArrowLeft } from "react-icons/pi";
import { LEGAL_LINKS, LEGAL_META } from "./LegalMeta";

export function LegalSection({ title, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-2 break-keep text-[13px] leading-6 text-slate-600">
        {children}
      </div>
    </section>
  );
}

export function LegalInfoBox() {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <h2 className="text-[16px] font-bold text-slate-900">사업자 정보</h2>
      <div className="mt-3 grid gap-1.5 break-keep text-[13px] leading-6 text-slate-600">
        <p>상호: {LEGAL_META.companyName}</p>
        <p>대표자: {LEGAL_META.representativeName}</p>
        <p>사업자등록번호: {LEGAL_META.businessRegistrationNumber}</p>
        {LEGAL_META.mailOrderSalesNumber ? <p>통신판매업신고번호: {LEGAL_META.mailOrderSalesNumber}</p> : null}
        <p>주소: {LEGAL_META.address}</p>
        <p>고객센터 전화: {LEGAL_META.phoneNumber}</p>
        <p>이메일: {LEGAL_META.email}</p>
        <p>운영시간: {LEGAL_META.customerCenterHours}</p>
      </div>
    </section>
  );
}

export default function LegalPage({ title, description, children }) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{title} | {LEGAL_META.serviceName}</title>
        <meta name="description" content={description || `${LEGAL_META.serviceName} ${title}`} />
      </Head>

      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center md:px-6 md:py-10">
          <section className="relative flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 md:min-h-[760px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <header className="shrink-0 bg-white px-4 pb-4 pt-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-800"
                  aria-label="뒤로가기"
                >
                  <PiArrowLeft className="text-[22px]" />
                </button>
                <div className="min-w-0 flex-1 text-center">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-violet-500">
                    {LEGAL_META.serviceName}
                  </div>
                  <h1 className="mt-1 text-[20px] font-black tracking-[-0.04em] text-slate-950">{title}</h1>
                </div>
                <div className="h-9 w-9" />
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3 pb-8">
                {children}
                <LegalInfoBox />

                <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex flex-wrap gap-x-3 gap-y-2 text-[12px] font-semibold text-slate-600">
                    {LEGAL_LINKS.map((link) => (
                      <Link key={link.href} href={link.href} className="underline underline-offset-4">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
