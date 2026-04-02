import Head from "next/head";
import { useRouter } from "next/router";
import { typeMetaMap } from "data/tests/styleQuestions";
import SEOHead from "components/Common/SEOHead";

export default function StyleSharePage() {
  const router = useRouter();
  const { code } = router.query;

  const type = typeMetaMap[code] || typeMetaMap.DSLR;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://charmingsoup.com";
  const shareUrl = `${siteUrl}/tests/style/share/${type.code}`;
  const imageUrl = `${siteUrl}${result.image}`;

  return (
    <>
      <SEOHead
        title={`내 연애스타일 결과: ${type.ko}`}
        description={`${type.ko} 유형 결과를 확인해보세요. 차밍수프 연애스타일 진단 공유 페이지입니다.`}
      />

      <main className="min-h-screen bg-white px-5 py-10">
        <div className="mx-auto max-w-[420px]">
          <div className="text-[14px] font-bold text-pink-500">공유 결과</div>
          <h1 className="mt-3 text-[32px] font-black text-slate-900">{type.ko}</h1>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-6 text-slate-600">
            {type.summary}
          </p>
          <div className="mt-4 overflow-hidden rounded-[18px] bg-slate-50">
            <img
              src={result.image}
              alt={result.ko}
              className="h-[220px] w-full object-cover sm:h-[250px]"
            />
          </div>
        </div>
      </main>
    </>
  );
}