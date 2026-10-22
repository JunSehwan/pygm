import NavBar from "./NavBar";
import HeroSection from "./HeroSection";
import ValueSection from "./ValueSection";
import CompareSection from "./CompareSection";
import FlowSection from "./FlowSection";
import PolicySection from "./PolicySection";
import MarketingStoriesSection from "./MarketingStoriesSection";
import FAQSection from "./FAQSection";
import FooterSection from "./FooterSection";

export default function TwoWeeksLanding() {
  return (
    <div className="min-h-screen bg-black text-zinc-950">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        body {
          background: #000;
        }
      `}</style>

      <NavBar />

      <main className="overflow-x-hidden">
        <HeroSection />
        <ValueSection />
        <CompareSection />
        <FlowSection />
        <MarketingStoriesSection />
        <PolicySection />
        <FAQSection />
        <FooterSection />
      </main>
    </div>
  );
}
