import React from "react";
import CardCreateFlow from "components/Cards/Create/CardCreateFlow";

export default function CardsCreatePage() {
  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-[#ffd6df]/60 blur-3xl" />
          <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-[#efe9ff]/80 blur-3xl" />
          <div className="absolute left-1/2 bottom-[40px] h-[240px] w-[240px] -translate-x-[120px] rounded-full bg-[#ffe5ea]/70 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <section
            id="app-surface"
            className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
          >
            <CardCreateFlow />
          </section>
        </div>
      </div>
    </main>
  );
}