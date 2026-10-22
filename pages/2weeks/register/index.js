import Head from "next/head";
import TwoWeeksRegister from "components/TwoWeeksRegister";

export default function TwoWeeksRegisterPage() {
  return (
    <>
      <Head>
        <title>내 소개 준비하기 | 투윅스</title>
        <meta
          name="description"
          content="한 화면에 한 가지씩 답하며 투윅스 소개 프로필을 준비하세요. 본인확인부터 실제 만남 조건까지 자동 저장됩니다."
        />
      </Head>
      <TwoWeeksRegister />
    </>
  );
}
