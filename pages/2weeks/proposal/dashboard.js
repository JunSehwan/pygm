import Head from "next/head";
import TwoWeeksProposalDashboard from "components/TwoWeeksProposal";

export default function TwoWeeksProposalDashboardPage() {
  return (
    <>
      <Head>
        <title>투윅스 신청 현황 | 2WEEKS</title>
        <meta
          name="description"
          content="투윅스 신청 현황과 매칭 후보를 본인인증 후 확인하는 페이지입니다."
        />
      </Head>
      <TwoWeeksProposalDashboard />
    </>
  );
}
