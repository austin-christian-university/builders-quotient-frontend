"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { OrbGuide } from "@/components/assessment/OrbGuide";
import { CI_TRANSITION_SCRIPT } from "@/lib/assessment/orb-scripts";
import * as analytics from "@/lib/analytics/events";

const SESSION_STORAGE_KEY = "ci_briefing_seen";

function getSnapshot() {
  return sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  // sessionStorage doesn't fire events in the same tab,
  // but we trigger re-renders via the forceUpdate pattern below
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function StepWithCiBriefing({
  sessionId,
  children,
}: {
  sessionId: string;
  children: React.ReactNode;
}) {
  const briefingSeen = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const skippedRef = useRef(false);

  const handleContinue = useCallback(() => {
    if (!skippedRef.current) {
      analytics.briefingCompleted(sessionId, "ci_transition");
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    // Force re-render by dispatching a storage event
    window.dispatchEvent(new StorageEvent("storage", { key: SESSION_STORAGE_KEY }));
  }, [sessionId]);

  const handleSkip = useCallback(() => {
    skippedRef.current = true;
    analytics.briefingSkipped(sessionId, "ci_transition");
  }, [sessionId]);

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
