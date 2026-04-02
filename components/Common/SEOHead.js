import Head from "next/head";
import { useRouter } from "next/router";

const SITE_NAME = "차밍수프";
const SITE_URL = "https://charmingsoup.com";
const DEFAULT_TITLE = "차밍수프 | 매너와 인성 기반 매칭";
const DEFAULT_DESCRIPTION =
  "차밍수프는 외모나 조건만이 아니라, 연애 상황 속 반응과 가치관을 통해 더 잘 맞는 이성을 연결하는 매칭 서비스입니다.";
const DEFAULT_IMAGE = `${SITE_URL}/logo/logo.png`;

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  keywords = "",
  noindex = false,
  canonical,
}) {
  const router = useRouter();
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const currentUrl = canonical || `${SITE_URL}${router.asPath === "/" ? "" : router.asPath}`;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}

      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}
      />
      <link rel="canonical" href={currentUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}