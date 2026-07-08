import Head from "next/head";
import TwoWeeksCompletePage from "components/TwoWeeksRegister/CompletePage";

export default function TwoWeeksComplete() {
  return (
    <>
      <Head>
        <title>투윅스 신청 완료 | 2WEEKS</title>
        <meta
          name="description"
          content="투윅스 신청이 완료되었습니다. 예치금 20,000원 입금 확인 및 운영자 검토 후 매칭 가능 여부를 안내드립니다."
        />
      </Head>
      <TwoWeeksCompletePage />
    </>
  );
}
