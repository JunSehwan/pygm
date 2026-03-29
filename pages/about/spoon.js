import React from "react";
import Head from "next/head";
import SpoonGuidePage from "components/About/SpoonGuidePage";

export default function AboutSpoonPage() {
  return (
    <>
      <Head>
        <title>차밍스푼 안내 | 차밍수프</title>
        <meta
          name="description"
          content="차밍수프 차밍스푼의 사용 방법, 차감 기준, 복구 기준을 안내합니다."
        />
      </Head>

      <SpoonGuidePage />
    </>
  );
}