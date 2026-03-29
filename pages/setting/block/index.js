import React from "react";
import Head from "next/head";
import RequireAuth from "components/Common/RequireAuth";
import BlockSettingPage from "components/Setting/Block/BlockSettingPage";

export default function SettingBlockPage() {
  return (
    <>
      <Head>
        <title>지인 차단 | 차밍수프</title>
        <meta
          name="description"
          content="이름, 전화번호, 회사명 기준으로 추천 제외 대상을 관리합니다."
        />
      </Head>

      <RequireAuth
        redirect="/setting/block"
        fallback={
          <div className="min-h-screen bg-white md:bg-[#f6f7fb]">
            <div className="mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center md:items-center md:px-6 md:py-10">
              <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]" />
            </div>
          </div>
        }
      >
        <BlockSettingPage />
      </RequireAuth>
    </>
  );
}