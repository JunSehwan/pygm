import NavBar from "./NavBar";
import HeroSection from "./HeroSection";
import AudienceSection from "./AudienceSection";
import FlowSection from "./FlowSection";
import PolicySection from "./PolicySection";
import FAQSection from "./FAQSection";
import FooterSection from "./FooterSection";

export default function TwoWeeksLanding() {
  return (
    <div className="bg-black text-zinc-950">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .tw-matrix-column {
          animation-name: tw-matrix-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          filter: drop-shadow(0 0 10px rgba(249, 115, 22, 0.22));
        }

        @keyframes tw-matrix-fall {
          0% {
            transform: translateY(-24%);
            opacity: 0;
          }
          12% {
            opacity: 0.65;
          }
          100% {
            transform: translateY(168%);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tw-matrix-column {
            animation: none;
            opacity: 0.12;
          }
        }
      `}</style>

      <NavBar />

      <main className="overflow-x-hidden bg-black md:snap-y md:snap-mandatory">
        <HeroSection />
        <AudienceSection />
        <FlowSection />
        <PolicySection />
        <FAQSection />
        <FooterSection />
      </main>
    </div>
  );
}
