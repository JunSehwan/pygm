import React from "react";
import Head from "next/head";
import ServiceTermsPage from "components/About/ServiceTermsPage";
import SEOHead from "components/Common/SEOHead";

export default function AboutServicePage() {
  return (
    <>
      <SEOHead
        title="이용약관"
        description="차밍수프 서비스 이용약관을 확인하세요."
        noindex
      />

      <ServiceTermsPage />
    </>
  );
}