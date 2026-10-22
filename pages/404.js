import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { FiArrowRight, FiHome } from "react-icons/fi";
import { event, getSafeAnalyticsPath } from "lib/gtag";

export default function Custom404Page() {
  useEffect(() => {
    const pagePath = getSafeAnalyticsPath();

    event({
      action: "page_not_found",
      category: "navigation",
      label: pagePath,
      params: {
        page_path: pagePath,
      },
    });
  }, []);

  return (
    <>
      <Head>
        <title>페이지를 찾을 수 없습니다 | 차밍수프</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-5 py-16 text-zinc-950">
        <section className="w-full max-w-[560px] rounded-[32px] border border-zinc-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-lg font-black">
            404
          </div>
          <h1 className="mt-6 break-keep text-3xl font-black tracking-[-0.05em] sm:text-4xl">
            요청하신 페이지를 찾을 수 없어요
          </h1>
          <p className="mt-4 break-keep text-sm font-medium leading-7 text-zinc-500 sm:text-base">
            주소가 변경되었거나 만료된 링크일 수 있습니다.
            아래 버튼을 통해 안전하게 다시 이동해주세요.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/2weeks"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#d85b48]"
            >
              투윅스 홈 <FiArrowRight aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-3.5 text-sm font-black text-zinc-800 transition hover:border-zinc-950"
            >
              <FiHome aria-hidden="true" /> 차밍수프 홈
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
