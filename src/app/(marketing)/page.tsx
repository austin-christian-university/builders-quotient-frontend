"use client";

import { useState } from "react";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { WhatYouDiscover } from "@/components/marketing/WhatYouDiscover";
import { Credibility } from "@/components/marketing/Credibility";
import { Requirements } from "@/components/marketing/Requirements";
import { FAQ } from "@/components/marketing/FAQ";
import { FooterCTA } from "@/components/marketing/FooterCTA";
import { SplashScreen } from "@/components/marketing/SplashScreen";

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <main id="main-content" className="relative">
      <SplashScreen onComplete={() => setShowSplash(false)} />

      <div
        className={`transition-opacity duration-1000 ${showSplash ? "opacity-0 invisible" : "opacity-100 visible"}`}
        inert={showSplash || undefined}
      >
        <Hero />
        <HowItWorks />
        <WhatYouDiscover />
        <Credibility />
        <Requirements />
        <FAQ />
        <FooterCTA />
      </div>
    </main>
  );
}
