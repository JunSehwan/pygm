import { useEffect } from "react";
import Head from "next/head";
import ReviewPendingCompletePage from "components/TwoWeeksRegister/ReviewPendingCompletePage";
import { trackTwoWeeksEvent } from "lib/gtag";

export default function TwoWeeksComplete() {
  useEffect(() => {
    trackTwoWeeksEvent("twoweeks_application_complete_view");
  }, []);

  return (
    <>
      <Head>
        <title>투윅스 신청 완료 | 2WEEKS</title>
        <meta name="description" content="투윅스 신청 접수가 완료되었습니다. 프로필 검토 후 다음 진행을 안내드립니다." />
        <meta name="robots" content="noindex" />
      </Head>
      <ReviewPendingCompletePage />
    </>
  );
}
