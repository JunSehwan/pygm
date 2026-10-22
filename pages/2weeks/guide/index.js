import SEOHead from "components/Common/SEOHead";
import TwoWeeksGuide from "components/TwoWeeksGuide";

const GUIDE_URL = "https://charmingsoup.com/2weeks/guide";
const GUIDE_IMAGE = "https://charmingsoup.com/image/twoweeks/landing_image_2weeks.png";

export default function TwoWeeksGuidePage() {
  return (
    <>
      <SEOHead
        title="투윅스 이용안내 | 가입부터 실제 만남까지"
        description="투윅스 신청, 프로필 승인, 예치금, 한 사람 제안, 일정과 카페 선택, 만남 당일, 피드백과 연락처 공개까지 실제 진행 과정을 자세히 안내합니다."
        keywords="투윅스 이용방법, 투윅스 이용안내, 투윅스 예치금, 카페 소개팅, 1대1 소개팅, 일정조율, 연락처 공개"
        canonical={GUIDE_URL}
        image={GUIDE_IMAGE}
        imageAlt="투윅스 가입부터 실제 만남까지 이용안내"
        siteName="투윅스"
        appendSiteName={false}
      />
      <TwoWeeksGuide />
    </>
  );
}
