import { Cinzel } from "next/font/google";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustBar from "@/components/landing/TrustBar";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorks from "@/components/landing/HowItWorks";
import WhatsAppSection from "@/components/landing/WhatsAppSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AiCapabilitiesSection from "@/components/landing/AiCapabilitiesSection";
import WorkflowVisualization from "@/components/landing/WorkflowVisualization";
import DeveloperBenefits from "@/components/landing/DeveloperBenefits";
import AgentBenefits from "@/components/landing/AgentBenefits";
import ClientBenefits from "@/components/landing/ClientBenefits";
import GlobalSection from "@/components/landing/GlobalSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import PricingTeaser from "@/components/landing/PricingTeaser";
import CtaSection from "@/components/landing/CtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata = {
  title: "RealTron AI — AI Sales Infrastructure for Real Estate",
  description:
    "Enterprise AI platform for real estate developers, agencies, and brokerages. AI lead qualification, WhatsApp automation, CRM intelligence, and deal orchestration.",
  keywords: [
    "AI real estate platform",
    "real estate CRM",
    "AI sales automation",
    "WhatsApp real estate automation",
    "real estate AI assistant",
    "AI lead qualification",
    "real estate sales infrastructure",
  ],
};

export default function LandingPage() {
  return (
    <div className={`${cinzel.variable}`}>
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <ProblemSection />
        <HowItWorks />
        <WhatsAppSection />
        <FeaturesSection />
        <AiCapabilitiesSection />
        <WorkflowVisualization />
        <DeveloperBenefits />
        <AgentBenefits />
        <ClientBenefits />
        <GlobalSection />
        <SocialProofSection />
        <PricingTeaser />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
