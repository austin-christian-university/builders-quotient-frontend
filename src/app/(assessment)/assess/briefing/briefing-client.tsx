"use client";

import { useRef, useTransition } from "react";
import { OrbGuide } from "@/components/assessment/OrbGuide";
import { PRE_EXAM_SCRIPT } from "@/lib/assessment/orb-scripts";
import { completeBriefing } from "@/lib/actions/briefing";
import * as analytics from "@/lib/analytics/events";

export function BriefingClient({ sessionId }: { sessionId: string }) {
  const [, startTransition] = useTransition();
  const skippedRef = useRef(false);

  const handleContinue = () => {
    if (!skippedRef.current) {
      analytics.briefingCompleted(sessionId, "pre_exam");
    }
    startTransition(async () => {
      await completeBriefing();
    });
  };

  const handleSkip = () => {
    skippedRef.current = true;
    analytics.briefingSkipped(sessionId, "pre_exam");
  };

  return (
    <OrbGuide
      script={PRE_EXAM_SCRIPT}
      onContinue={handleContinue}
      onSkip={handleSkip}
    />
  );
}
