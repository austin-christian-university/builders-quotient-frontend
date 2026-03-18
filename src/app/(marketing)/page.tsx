"use client";

import { useState } from "react";
import { Hero } from "@/components/marketing/Hero";
import { Explainer } from "@/components/marketing/Explainer";
import { Requirements } from "@/components/marketing/Requirements";
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
        <Explainer />
        <Requirements />
        <FooterCTA />
      </div>
    </main>
  );
}
