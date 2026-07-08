import Head from "next/head";
import TwoWeeksRegister from "components/TwoWeeksRegister";

export default function TwoWeeksRegisterPage() {
  return (
    <>
      <Head>
        <title>투윅스 신청 | 2WEEKS</title>
        <meta
          name="description"
          content="투윅스 1기 신청 페이지입니다. 기본 정보, 사진, 신원 인증 자료를 제출하고 운영자 검토를 거쳐 매칭 안내를 받을 수 있습니다."
        />
      </Head>
      <TwoWeeksRegister />
    </>
  );
}
