import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { WhatYouDiscover } from "@/components/marketing/WhatYouDiscover";
import { Credibility } from "@/components/marketing/Credibility";
import { Requirements } from "@/components/marketing/Requirements";
import { FAQ } from "@/components/marketing/FAQ";
import { FooterCTA } from "@/components/marketing/FooterCTA";

export default function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <HowItWorks />
      <WhatYouDiscover />
      <Credibility />
      <Requirements />
      <FAQ />
      <FooterCTA />
    </main>
  );
}
