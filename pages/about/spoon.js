import React from "react";
import Head from "next/head";
import SpoonGuidePage from "components/About/SpoonGuidePage";
import SEOHead from "components/Common/SEOHead";

export default function AboutSpoonPage() {
  return (
    <>
      <SEOHead
        title="차밍스푼 안내"
        description="차밍수프에서 사용하는 차밍스푼의 사용처와 충전 방식, 서비스 이용 흐름을 확인해보세요."
        keywords="차밍스푼, 차밍수프 결제, 스푼 안내"
      />

      <SpoonGuidePage />
    </>
  );
}