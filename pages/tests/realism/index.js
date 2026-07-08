import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import SharePanel from "../../../components/Tests/Realism/SharePanel";
import BottomNavbar from "components/Common/BottomNavbar";
import { getTestRealCount } from "../../../firebaseConfig";

const HERO_IMG = "/image/tests/realism_intro.png";

export default function RealismIntroPage() {
  const router = useRouter();

  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const v = await getTestRealCount();

        if (!alive) return;
        setCount(v);
      } catch (error) {
        console.error("[tests/realism] count load error:", error);
        if (!alive) return;
        setCount(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const participantText = useMemo(() => {
    if (loading) return "불러오는 중…";
    if (typeof count !== "number") return "—";
    return count.toLocaleString("ko-KR");
  }, [count, loading]);

  return (
    <>
      <Head>
        <title>현실파악 테스트 | 차밍수프</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-pink-200/35 blur-3xl" />
            <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-violet-200/30 blur-3xl" />
          </div>

          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <section
              id="app-surface"
              className="relative flex min-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-white md:min-h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="sticky top-0 z-10 flex h-14 items-center border-b border-gray-100 bg-white px-3">
                  <button
                    onClick={() => router.back()}
                    aria-label="back"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-3xl font-black text-gray-900 hover:bg-slate-100"
                  >
                    ‹
                  </button>

                  <div className="flex-1 text-center text-xl font-black text-gray-900">
                    피그말리온 연구소
                  </div>

                  <div className="h-10 w-10" />
                </div>

                <div className="w-full bg-white">
                  <img
                    src={HERO_IMG}
                    alt="hero"
                    className="block h-auto w-full max-h-[360px] object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div className="mx-auto w-full max-w-[520px] px-4 pb-10 pt-5 text-center">
                  <div className="my-4 text-[34px] font-black tracking-[-0.02em] text-gray-900">
                    연애 능력 테스트
                  </div>

                  <div className="mt-2 text-xl font-extrabold leading-relaxed text-blue-600">
                    결혼시장에서의 내 위치는?
                    <br />
                    <span className="text-sm text-gray-600 opacity-75 lg:text-lg">
                      내가 원하는 이성상을 만날 수 있을지 테스트합니다.
                    </span>
                  </div>

                  <button
                    onClick={() => router.push("/tests/realism/step")}
                    className="mt-7 w-full rounded-full border-4 border-solid border-gray-800 bg-pink-500 px-4 py-5 text-2xl font-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] active:scale-[0.99] hover:bg-pink-600"
                  >
                    테스트 시작!
                  </button>

                  <div className="mt-8 inline-block pb-1 text-xl font-black text-gray-900">
                    <span className="border-b-8 border-[rgba(255,43,134,0.35)]">
                      참여자 수
                    </span>
                  </div>

                  <div className="mt-2 text-[54px] font-black tracking-[-0.02em] text-gray-900">
                    {participantText}
                  </div>

                  <div className="mt-10">
                    <SharePanel shareCount={240000} />
                  </div>

                  <div className="mt-6 text-center text-xs text-gray-300">
                    © charmingsoup.com · tests/realism
                  </div>
                </div>
              </div>

              <BottomNavbar contained />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}