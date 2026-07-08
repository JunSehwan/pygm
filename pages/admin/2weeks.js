import Head from "next/head";
import TwoWeeksAdminPage from "components/TwoWeeksAdmin/TwoWeeksAdminPage";

export default function TwoWeeksAdminRoute() {
  return (
    <>
      <Head>
        <title>투윅스 관리자 | 2WEEKS</title>
        <meta
          name="description"
          content="투윅스 신청자, 검토, 입금, 매칭, 결과를 관리하는 운영자 페이지입니다."
        />
      </Head>
      <TwoWeeksAdminPage />
    </>
  );
}
