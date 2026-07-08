import Head from "next/head";
import { useRouter } from "next/router";

const SITE_NAME = "차밍수프";
const SITE_URL = "https://charmingsoup.com";

const DEFAULT_TITLE = "차밍수프 | 결을 보는 소개팅";
const DEFAULT_DESCRIPTION =
  "차밍수프는 외모와 조건만이 아니라, 연애 상황 속 답변과 가치관을 통해 더 잘 맞는 이성을 연결하는 소개팅 서비스입니다.";

const DEFAULT_IMAGE = `${SITE_URL}/logo/logo.png`;

const DEFAULT_KEYWORDS =
  "차밍수프, 소개팅, 소개팅앱, 소개팅사이트, 연애, 연애테스트, 연애스타일테스트, 가치관 소개팅, 성향 소개팅, 차밍카드, 매칭 서비스";

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  keywords = DEFAULT_KEYWORDS,
  noindex = false,
  canonical,
  type = "website",
}) {
  const router = useRouter();

  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

  const cleanPath = (router.asPath || "/").split("?")[0].split("#")[0];

  const currentUrl =
    canonical || `${SITE_URL}${cleanPath === "/" ? "" : cleanPath}`;

  return (
    <Head>
      <title>{pageTitle}</title>

      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}

      <meta
        name="robots"
        content={
          noindex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large"
        }
      />

      <link rel="canonical" href={currentUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={`${SITE_NAME} 대표 이미지`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}