import React from "react";
import { useRouter } from "next/router";
import { PiArrowLeft, PiShieldCheckDuotone } from "react-icons/pi";

export default function AdminFrame({
  title = "관리자 페이지",
  subtitle = "",
  children,
  rightSlot = null,
}) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[420px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <section className="relative flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-slate-50 md:h-[780px] md:max-w-[1120px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <header className="shrink-0 border-b border-slate-200 bg-white">
              <div className="flex h-14 items-center gap-3 px-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{ cursor: "pointer" }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100"
                >
                  <PiArrowLeft className="text-[20px]" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <PiShieldCheckDuotone className="text-[18px] text-violet-600" />
                    <div className="truncate text-[16px] font-bold text-slate-900">{title}</div>
                  </div>
                  {subtitle ? (
                    <div className="mt-0.5 truncate text-[12px] text-slate-500">{subtitle}</div>
                  ) : null}
                </div>

                {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              <div className="space-y-4 pb-4">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
