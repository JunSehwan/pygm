import TwoWeeksLanding from "components/TwoWeeksLanding";
import SEOHead from "components/Common/SEOHead";

const TWO_WEEKS_URL = "https://charmingsoup.com/2weeks";
const TWO_WEEKS_OG_IMAGE =
  "https://charmingsoup.com/image/twoweeks/landing_image_2weeks.png";

export default function TwoWeeksPage() {
  return (
    <>
      <SEOHead
        title="투윅스 | 2주에 한 번, 카페에서 만나는 한 사람"
        description="한 번 등록해두면 약 2주마다 조건을 검토한 한 사람을 제안합니다. 서로 원할 때 일정과 카페를 정해 약 60분 동안 편하게 만나는 1:1 소개팅 서비스입니다."
        keywords="투윅스, 2WEEKS, 1대1 소개팅, 카페 소개팅, 서울 소개팅, 오프라인 소개팅, 직장인 소개팅, 60분 소개팅"
        canonical={TWO_WEEKS_URL}
        image={TWO_WEEKS_OG_IMAGE}
        imageAlt="투윅스 2주에 한 번 카페에서 만나는 1대1 소개팅"
        siteName="투윅스"
        appendSiteName={false}
      />
      <TwoWeeksLanding />
    </>
  );
}
