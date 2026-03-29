import React from "react";
import Head from "next/head";
import PrivacyPolicyPage from "components/About/PrivacyPolicyPage";

export default function AboutPrivacyPage() {
  return (
    <>
      <Head>
        <title>개인정보처리방침 | 차밍수프</title>
        <meta
          name="description"
          content="차밍수프의 개인정보 수집 항목, 이용 목적, 보유기간, 제3자 제공 및 처리위탁 기준을 안내합니다."
        />
      </Head>

      <PrivacyPolicyPage />
    </>
  );
}