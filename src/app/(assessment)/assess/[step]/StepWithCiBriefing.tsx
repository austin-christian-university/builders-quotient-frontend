"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OrbGuide } from "@/components/assessment/OrbGuide";
import { CI_TRANSITION_SCRIPT } from "@/lib/assessment/orb-scripts";
import * as analytics from "@/lib/analytics/events";

const SESSION_STORAGE_KEY = "ci_briefing_seen";

export function StepWithCiBriefing({
  sessionId,
  children,
}: {
  sessionId: string;
  children: React.ReactNode;
}) {
  // Read sessionStorage after mount to avoid hydration mismatch
  const [briefingSeen, setBriefingSeen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const skippedRef = useRef(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
    setBriefingSeen(seen);
    setMounted(true);
  }, []);

  const handleContinue = useCallback(() => {
    if (!skippedRef.current) {
      analytics.briefingCompleted(sessionId, "ci_transition");
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    setBriefingSeen(true);
  }, [sessionId]);

  const handleSkip = useCallback(() => {
    skippedRef.current = true;
    analytics.briefingSkipped(sessionId, "ci_transition");
  }, [sessionId]);

  // Show nothing until mounted to avoid hydration mismatch
  if (!mounted) return null;

  if (!briefingSeen) {
    return (
      <OrbGuide
        script={CI_TRANSITION_SCRIPT}
        onContinue={handleContinue}
        onSkip={handleSkip}
      />
    );
  }

  return <>{children}</>;
}
