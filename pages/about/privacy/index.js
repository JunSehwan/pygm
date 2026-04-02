import React from "react";
import Head from "next/head";
import PrivacyPolicyPage from "components/About/PrivacyPolicyPage";
import SEOHead from "components/Common/SEOHead";

export default function AboutPrivacyPage() {
  return (
    <>
      <SEOHead
        title="개인정보처리방침"
        description="차밍수프 개인정보처리방침을 확인하세요."
        noindex
      />

      <PrivacyPolicyPage />
    </>
  );
}