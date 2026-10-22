import NavBar from "./NavBar";
import HeroSection from "./HeroSection";
import QuickProcessSection from "./QuickProcessSection";
import ActivityTicker from "./ActivityTicker";
import EmotionSection from "./EmotionSection";
import CompareSection from "./CompareSection";
import SafetySection from "./SafetySection";
import ProfileExamplesSection from "./ProfileExamplesSection";
import PricingSection from "./PricingSection";
import DetailedJourneySection from "./DetailedJourneySection";
import ProductPreviewSection from "./ProductPreviewSection";
import FooterSection from "./FooterSection";
import RecruitmentDock from "./RecruitmentDock";
import CampaignAttributionTracker from "./CampaignAttributionTracker";

export default function TwoWeeksLanding() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <CampaignAttributionTracker />
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 88px;
        }

        body {
          background: #ffffff;
        }

        html,
        body,
        div#__next {
          overflow-x: clip !important;
        }

        @supports not (overflow: clip) {
          div#__next {
            overflow-x: visible !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
      `}</style>

      <NavBar />

      <main>
        <HeroSection />
        <QuickProcessSection />
        <EmotionSection />
        <CompareSection />
        <SafetySection />
        <ProfileExamplesSection />
        <ActivityTicker />
        <PricingSection />
        <DetailedJourneySection />
        <ProductPreviewSection />
        <FooterSection />
      </main>

      <RecruitmentDock />
    </div>
  );
}
