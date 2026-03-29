import React from "react";
import LandingHero from "./LandingHero";
import FeatureCarousel from "./FeatureCarousel";
import LandingCTA from "./LandingCTA";

const Landing = () => {
  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      {/* Web background frame */}
      <div className="relative min-h-screen overflow-hidden">
        {/* soft background blobs (desktop only) */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-pink-200/40 blur-3xl" />
          <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute left-1/2 bottom-[40px] h-[240px] w-[240px] -translate-x-[120px] rounded-full bg-rose-100/50 blur-3xl" />
        </div>

        {/* stage: top on mobile / centered-ish on web */}
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          {/* mobile app surface */}
          <section className="
            w-full max-w-[390px] overflow-hidden bg-white
            md:max-w-[410px] md:rounded-[16px] md:border md:border-slate-200/80
            md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]
          ">
            <LandingHero />
            <FeatureCarousel />
            <LandingCTA />
          </section>
        </div>
      </div>
    </main>
  );
};

export default Landing;