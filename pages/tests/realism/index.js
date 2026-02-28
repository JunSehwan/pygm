import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import SharePanel from "../../../components/Tests/Realism/SharePanel";

// ✅ 너가 가진 firebaseConfig.js 활용
import { getTestRealCount } from "../../../firebaseConfig"; // 경로 맞게 수정

const HERO_IMG = "/image/tests/realism_intro.png"; // public/image/tests/realism_intro.png

export default function RealismIntroPage() {
  const router = useRouter();

  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const v = await getTestRealCount();
      if (!alive) return;
      setCount(v);
      setLoading(false);
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
        <title>현실파악 테스트 | 피그말리온 연구소</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
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

        {/* Hero */}
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

        {/* Body */}
        <div className="mx-auto max-w-[520px] px-4 pb-14 pt-5 text-center">
          <div className="my-4 text-[34px] font-black tracking-[-0.02em] text-gray-900">
            연애 능력 테스트
          </div>

          <div className="mt-2 text-blue-600 text-xl font-extrabold leading-relaxed">
            결혼시장에서의 내 위치는?
            <br />
            <span className="opacity-75 text-gray-600 text-sm lg:text-lg">
              내가 원하는 이성상을 만날 수 있을지 테스트합니다.
            </span>
          </div>

          <button
            onClick={() => router.push("/tests/realism/step")}
            className="mt-7 w-full rounded-full border-solid border-4 border-gray-800 bg-pink-500 hover:bg-pink-600 px-4 py-5 text-2xl font-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] active:scale-[0.99]"
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
          
          {/* ✅ 공유 섹션 */}
          <div className="mt-10">
            <SharePanel shareCount={240000} />
          </div>

          <div className="mt-6 text-center text-xs text-gray-300">
            © pygm.co.kr · tests/realism
          </div>
        </div>
      </div>
    </>
  );
}
