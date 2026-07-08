import Head from "next/head";
import Link from "next/link";
import SEOHead from "components/Common/SEOHead";
import { typeMetaMap } from "data/tests/styleQuestions";

const ALL_CODES = Object.keys(typeMetaMap);

export async function getStaticPaths() {
  return {
    paths: ALL_CODES.map((code) => ({
      params: { code },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const code = String(params?.code || "").toUpperCase();
  const type = typeMetaMap[code] || null;

  if (!type) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      code,
      type,
    },
  };
}

export default function StyleSharePage({ code, type }) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://charmingsoup.com";
  const shareUrl = `${siteUrl}/tests/style/share/${code}`;
  const introUrl = `${siteUrl}/tests/style`;
  const imageUrl = `${siteUrl}${type.image}`;

  return (
    <>
      <SEOHead
        title={`내 연애스타일 결과: ${type.ko}`}
        description={`${type.ko} 유형 결과를 확인해보세요. 차밍수프 연애스타일 진단 공유 페이지입니다.`}
        canonical={shareUrl}
        image={imageUrl}
      />

      <Head>
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content={`내 연애스타일 결과: ${type.ko} | 차밍수프`}
        />
        <meta
          property="og:description"
          content={`${type.ko} 유형 결과를 확인해보세요. 차밍수프 연애스타일 진단 공유 페이지입니다.`}
        />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:secure_url" content={imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>

      <main className="min-h-screen bg-white px-5 py-10">
        <div className="mx-auto max-w-[420px]">
          <div className="text-[14px] font-bold text-pink-500">공유 결과</div>

          <h1 className="mt-3 text-[32px] font-black leading-tight text-slate-900">
            {type.ko}
          </h1>

          <p className="mt-3 whitespace-pre-line text-[15px] leading-6 text-slate-600">
            {type.summary}
          </p>

          <div className="mt-4 overflow-hidden rounded-[18px] bg-slate-50">
            <img
              src={type.image}
              alt={type.ko}
              className="h-[220px] w-full object-contain sm:h-[250px]"
            />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[14px] leading-6 text-slate-700">
              나와 비슷한 연애스타일이 궁금하다면
              <br />
              아래에서 바로 테스트해보세요.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={introUrl}
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-violet-600 px-4 text-[15px] font-semibold text-white"
              >
                나도 테스트 해보기
              </Link>

              <Link
                href="/"
                className="inline-flex h-12 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-700"
              >
                차밍수프 홈으로 가기
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}