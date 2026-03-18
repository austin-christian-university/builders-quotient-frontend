"use client";

import { useCallback, useEffect, useState } from "react";
import { OrbGuide } from "@/components/assessment/OrbGuide";
import { CI_TRANSITION_SCRIPT } from "@/lib/assessment/orb-scripts";

const SESSION_STORAGE_KEY = "ci_briefing_seen";

export function StepWithCiBriefing({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read sessionStorage after mount to avoid hydration mismatch
  const [briefingSeen, setBriefingSeen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
    setBriefingSeen(seen);
    setMounted(true);
  }, []);

  const handleContinue = useCallback(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    setBriefingSeen(true);
  }, []);

  const handleSkip = useCallback(() => {
    // Skip just enables Continue — analytics wired in Task 9
  }, []);

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
