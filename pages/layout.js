import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function LegacyLayoutRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <>
      <Head>
        <title>차밍수프</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-white px-5 text-center">
        <div>
          <p className="text-base font-semibold text-zinc-600">
            차밍수프 홈으로 이동하고 있습니다.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white"
          >
            홈으로 이동하기
          </Link>
        </div>
      </main>
    </>
  );
}
