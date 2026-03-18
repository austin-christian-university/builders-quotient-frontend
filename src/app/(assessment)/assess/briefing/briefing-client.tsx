"use client";

import { useTransition } from "react";
import { OrbGuide } from "@/components/assessment/OrbGuide";
import { PRE_EXAM_SCRIPT } from "@/lib/assessment/orb-scripts";
import { completeBriefing } from "@/lib/actions/briefing";

export function BriefingClient() {
  const [isPending, startTransition] = useTransition();

  const handleContinue = () => {
    startTransition(async () => {
      await completeBriefing();
    });
  };

  const handleSkip = () => {
    // Analytics differentiation happens here if needed.
    // Skip just enables Continue — the user still clicks Continue to navigate.
  };

  return (
    <OrbGuide
      script={PRE_EXAM_SCRIPT}
      onContinue={handleContinue}
      onSkip={handleSkip}
    />
  );
}
