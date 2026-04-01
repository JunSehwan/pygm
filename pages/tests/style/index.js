import React from "react";
import Head from "next/head";
import { useSelector } from "react-redux";
import { getAuth } from "firebase/auth";
import StyleTestFlow from "components/Tests/Style/StyleTestFlow";
import dynamic from "next/dynamic";

const BottomNavbar = dynamic(
  () => import("components/Common/BottomNavbar"),
  { ssr: false }
);

export default function StyleTestPage() {
  const auth = getAuth();
  const currentUser = useSelector((state) => state.user?.user ?? null);

  const showNavbar = !!(currentUser?.userID || auth?.currentUser?.uid);

  return (
    <>
      <Head>
        <title>연애스타일 진단 | 차밍수프</title>
        <meta
          name="description"
          content="내 연애스타일을 진단하고 더 잘 맞는 상대를 만나보세요."
        />
      </Head>

      <main className="h-[100dvh] overflow-hidden overscroll-none bg-white md:bg-[#f6f7fb]">
        <div className="relative h-full overflow-hidden">
          <div className="relative mx-auto flex h-full w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6">
            <section className="relative flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-white md:h-[760px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <div
                className={`min-h-0 flex-1 overflow-hidden ${showNavbar ? "pb-[64px]" : ""
                  }`}
              >
                <StyleTestFlow />
              </div>

              {showNavbar ? <BottomNavbar contained /> : null}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}