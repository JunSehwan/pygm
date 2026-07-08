import Head from "next/head";
import TwoWeeksLanding from "components/TwoWeeksLanding";

export default function TwoWeeksPage() {
  return (
    <>
      <Head>
        <title>투윅스 | 2주에 한 번, 새로운 만남</title>
        <meta
          name="description"
          content="85년생부터 00년생까지, 신원 인증 기반으로 2주에 한 번 오프라인 카페 1시간 바이트미팅을 제안하는 투윅스 1기 모집 페이지입니다."
        />
        <meta
          name="keywords"
          content="투윅스, 2WEEKS, 소개팅, 직장인 소개팅, 오프라인 소개팅, 바이트미팅, 로테이션 소개팅"
        />
      </Head>
      <TwoWeeksLanding />
    </>
  );
}
