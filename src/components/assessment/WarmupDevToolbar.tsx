"use client";

import { useCallback, useEffect, useState } from "react";

type WarmupPhase =
  | "intro_orb"
  | "recording"
  | "transition_orb"
  | "consent"
  | "uploading"
  | "pre_exam_orb"
  | "done"
  | "declined";

const PHASE_LABELS: Record<WarmupPhase, string> = {
  intro_orb: "Intro Orb",
  recording: "Recording",
  transition_orb: "Transition Orb",
  consent: "Consent",
  uploading: "Uploading",
  pre_exam_orb: "Pre-Exam Orb",
  done: "Done",
  declined: "Declined",
};

type WarmupDevToolbarProps = {
  phase: WarmupPhase;
  promptIndex: number;
  onSkipToConsent: () => void;
  onSkipToExam: () => void;
};

export function WarmupDevToolbar({
  phase,
  promptIndex,
  onSkipToConsent,
  onSkipToExam,
}: WarmupDevToolbarProps) {
  const [visible, setVisible] = useState(true);

  const toggle = useCallback(() => setVisible((v) => !v), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.shiftKey && e.key === "d") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-4 left-4 z-[70] rounded-full border border-green-500/40 bg-green-950/80 px-3 py-1.5 font-mono text-xs text-green-400 backdrop-blur-sm"
      >
        DEV: {PHASE_LABELS[phase]}
        {phase === "recording" ? ` (Q${promptIndex + 1})` : ""}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[70] w-64 rounded-xl border border-green-500/30 bg-green-950/90 p-3 font-mono text-xs shadow-lg shadow-green-900/20 backdrop-blur-md">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-green-500">
          Warmup Dev
        </span>
        <button
          type="button"
          onClick={toggle}
          className="text-green-500/60 hover:text-green-400"
          aria-label="Hide dev toolbar"
        >
          <span className="text-xs">&#x2715;</span>
        </button>
      </div>

      {/* Phase indicator */}
      <div className="mb-2 rounded-md bg-green-900/40 px-2 py-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
          <span className="font-semibold text-green-300">
            {PHASE_LABELS[phase]}
            {phase === "recording" ? ` (Q${promptIndex + 1}/3)` : ""}
          </span>
        </div>
      </div>

      {/* Skip actions */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onSkipToConsent}
          disabled={phase === "consent" || phase === "uploading" || phase === "done"}
          className="rounded bg-green-900/50 px-2 py-1.5 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-30"
        >
          Skip to Consent
        </button>
        <button
          type="button"
          onClick={onSkipToExam}
          className="rounded bg-green-900/50 px-2 py-1.5 text-[11px] text-green-400 transition-colors hover:bg-green-800/60"
        >
          Skip to Exam (assess/1)
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mt-2 text-center text-[10px] text-green-500/40">
        &#x2318;&#x21E7;D to toggle
      </div>
    </div>
  );
}
