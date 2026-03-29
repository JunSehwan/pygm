import React from "react";
import Head from "next/head";
import ServiceTermsPage from "components/About/ServiceTermsPage";

export default function AboutServicePage() {
  return (
    <>
      <Head>
        <title>이용약관 | 차밍수프</title>
        <meta
          name="description"
          content="차밍수프 서비스 이용약관, 회원 의무, 차밍스푼 결제 및 환불 기준을 안내합니다."
        />
      </Head>

      <ServiceTermsPage />
    </>
  );
}