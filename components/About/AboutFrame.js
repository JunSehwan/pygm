import React from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { PiArrowLeft } from "react-icons/pi";

import { auth } from "firebaseConfig";
import BottomNavbar from "components/Common/BottomNavbar";
import AboutTabs from "./AboutTabs";

export default function AboutFrame({
  title,
  description,
  activeTab = "spoon",
  hero,
  children,
}) {
  const router = useRouter();
  const reduxUser = useSelector((state) => state.user?.user || null);
  const isLoggedIn =
    !!reduxUser?.userID || !!reduxUser?.uid || !!auth?.currentUser;

  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="absolute left-1/2 top-[-90px] h-[260px] w-[260px] -translate-x-[280px] rounded-full bg-violet-200/30 blur-3xl" />
          <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[150px] rounded-full bg-sky-100/35 blur-3xl" />
          <div className="absolute left-1/2 bottom-[20px] h-[220px] w-[220px] -translate-x-[60px] rounded-full bg-pink-100/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <header className="shrink-0 border-b border-slate-200 bg-white">
              <div className="flex h-14 items-center justify-between px-4">
                <div className="text-[16px] font-bold text-slate-900">
                  {title}
                </div>

                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{ cursor: "pointer" }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <PiArrowLeft className="text-[22px]" />
                </button>
              </div>

              <AboutTabs activeKey={activeTab} />
            </header>

            <div className="min-h-0 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 pb-4 pt-4">
                {hero ? hero : null}

                <div className="mt-4">
                  <div className="text-[24px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
                    {title}
                  </div>
                  <p className="mt-2 break-keep text-[14px] leading-6 text-slate-500">
                    {description}
                  </p>
                </div>

                <div className="mt-4 space-y-3 pb-4">{children}</div>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="shrink-0 border-t border-slate-200 bg-white">
                <BottomNavbar contained />
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}