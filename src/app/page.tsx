import { Cinzel } from "next/font/google";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustBar from "@/components/landing/TrustBar";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorks from "@/components/landing/HowItWorks";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ClientBenefits from "@/components/landing/ClientBenefits";
import AgentBenefits from "@/components/landing/AgentBenefits";
import DeveloperBenefits from "@/components/landing/DeveloperBenefits";
import AgentRegisterSection from "@/components/landing/AgentRegisterSection";
import CtaSection from "@/components/landing/CtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata = {
  title: "PakProp AI — Pakistan's First AI Real Estate Assistant",
  description:
    "Find properties, verify listings, detect scams, and close deals on WhatsApp. Pakistan's first AI-powered real estate assistant with built-in trust verification.",
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
        <FeaturesSection />
        <ClientBenefits />
        <AgentBenefits />
        <DeveloperBenefits />
        <AgentRegisterSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
