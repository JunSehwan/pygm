import React from "react";
import LandingTopBar from "./LandingTopBar";
import LandingHero from "./LandingHero";
import FeatureCarousel from "./FeatureCarousel";
import LandingFlow from "./LandingFlow";
import LandingCTA from "./LandingCTA";

export default function Landing() {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-white md:h-[760px]">
      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <LandingTopBar />
        <LandingHero />
        <FeatureCarousel />
        <LandingFlow />
        <LandingCTA />
      </div>
    </div>
  );
}