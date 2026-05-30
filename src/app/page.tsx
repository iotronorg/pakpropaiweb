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

const _TITLE = "RealTron AI — AI Sales Infrastructure for Real Estate";
const _DESC  = "Enterprise AI platform for real estate developers, agencies, and brokerages. AI lead qualification, WhatsApp automation, CRM intelligence, and deal orchestration — across Pakistan, UAE, UK, and the US.";

export const metadata = {
  title:       _TITLE,
  description: _DESC,
  keywords: [
    "AI real estate platform",
    "real estate CRM",
    "AI sales automation",
    "WhatsApp real estate automation",
    "real estate AI assistant",
    "AI lead qualification",
    "real estate sales infrastructure",
  ],
  openGraph: {
    title:       _TITLE,
    description: _DESC,
    url:         "https://realtron.ai",
    siteName:    "RealTron AI",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "RealTron AI platform" }],
    type:        "website",
    locale:      "en_US",
  },
  twitter: {
    card:        "summary_large_image",
    title:       _TITLE,
    description: _DESC,
    images:      ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RealTron AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: _DESC,
  url: "https://realtron.ai",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free trial available",
  },
  featureList: [
    "AI lead qualification",
    "WhatsApp automation",
    "CRM intelligence",
    "Deal lock & escrow",
    "AML compliance screening",
    "Multi-market support (PK, AE, GB, US)",
  ],
};

export default function LandingPage() {
  return (
    <div className={`${cinzel.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
