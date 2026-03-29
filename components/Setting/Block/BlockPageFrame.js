import React from "react";
import { useRouter } from "next/router";
import { PiArrowLeft } from "react-icons/pi";
import BottomNavbar from "components/Common/BottomNavbar";

export default function BlockPageFrame({
  title = "지인 차단",
  children,
  footer = null,
  showBottomNavbar = true,
}) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <section className="relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:min-h-0 md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <header className="shrink-0 border-b border-slate-200 bg-white">
              <div className="flex h-14 items-center px-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{ cursor: "pointer" }}
                  className="mr-2 flex h-9 w-9 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100"
                >
                  <PiArrowLeft className="text-[20px]" />
                </button>

                <div className="text-[16px] font-bold text-slate-900">
                  {title}
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4 pb-4">{children}</div>
            </div>

            {footer ? (
              <div className="shrink-0 border-t border-slate-200 bg-white px-4 pb-3 pt-3">
                {footer}
              </div>
            ) : null}

            {showBottomNavbar ? (
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