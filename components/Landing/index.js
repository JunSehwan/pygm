import React from "react";
import LandingTopBar from "./LandingTopBar";
import LandingHero from "./LandingHero";
import LandingAudience from "./LandingAudience";
import CharmingCardPreview from "./CharmingCardPreview";
import LandingFlow from "./LandingFlow";
import LandingMembers from "./LandingMembers";
import LandingPricing from "./LandingPricing";
import LandingCTA from "./LandingCTA";
import LandingFooter from "./LandingFooter";

function LandingSection({ children, className = "" }) {
  return (
    <section className={`relative shrink-0 overflow-visible ${className}`}>
      {children}
    </section>
  );
}

export default function Landing() {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#f5f5f7] md:h-[760px]">
      <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#f5f5f7]">
        <LandingTopBar />

        <LandingSection className="bg-white">
          <LandingHero />
        </LandingSection>

        <LandingSection className="bg-[#f5f5f7]">
          <LandingAudience />
        </LandingSection>

        <LandingSection className="bg-[#f5f5f7]">
          <CharmingCardPreview />
        </LandingSection>

        <LandingSection className="bg-[#f5f5f7]">
          <LandingFlow />
        </LandingSection>

        <LandingSection className="bg-[#f5f5f7]">
          <LandingMembers />
        </LandingSection>

        <LandingSection className="bg-[#f5f5f7]">
          <LandingPricing />
        </LandingSection>

        <LandingSection className="bg-[#f5f5f7]">
          <LandingCTA />
          <LandingFooter />
        </LandingSection>
      </div>
    </div>
  );
}
