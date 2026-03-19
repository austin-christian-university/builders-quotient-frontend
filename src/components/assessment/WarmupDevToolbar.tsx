"use client";

import { useCallback, useEffect, useState } from "react";
import type { WarmupPhase } from "@/lib/assessment/warmup-reducer";

const PHASE_LABELS: Record<WarmupPhase, string> = {
  intro_orb: "Intro Orb",
  countdown: "Countdown",
  narrating: "Narrating",
  buffer_1: "Buffer 1 (Think)",
  recording_1: "Recording 1",
  buffer_2: "Buffer 2 (Think)",
  recording_2: "Recording 2",
  buffer_3: "Buffer 3 (Think)",
  recording_3: "Recording 3",
  transition_orb: "Transition Orb",
  consent: "Consent",
  uploading: "Uploading",
  pre_exam_orb: "Pre-Exam Orb",
  done: "Done",
  declined: "Declined",
};

const RECORDING_PHASES: ReadonlySet<WarmupPhase> = new Set([
  "buffer_1",
  "recording_1",
  "buffer_2",
  "recording_2",
  "buffer_3",
  "recording_3",
]);

const LATE_PHASES: ReadonlySet<WarmupPhase> = new Set([
  "transition_orb",
  "consent",
  "uploading",
  "pre_exam_orb",
  "done",
  "declined",
]);

type WarmupDevToolbarProps = {
  phase: WarmupPhase;
  onDevSetPhase: (phase: WarmupPhase) => void;
  onSkipToExam: () => void;
};

export function WarmupDevToolbar({
  phase,
  onDevSetPhase,
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
      </button>
    );
  }

  const isInRecording = RECORDING_PHASES.has(phase);
  const isLate = LATE_PHASES.has(phase);

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
          </span>
        </div>
      </div>

      {/* Skip actions */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onDevSetPhase("narrating")}
          disabled={phase !== "intro_orb" && phase !== "countdown"}
          className="rounded bg-green-900/50 px-2 py-1.5 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-30"
        >
          Skip to Narration
        </button>
        <button
          type="button"
          onClick={() => onDevSetPhase("buffer_1")}
          disabled={phase === "buffer_1" || isLate}
          className="rounded bg-green-900/50 px-2 py-1.5 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-30"
        >
          Skip to Buffer 1
        </button>
        <button
          type="button"
          onClick={() => {
            if (phase === "buffer_1" || phase === "recording_1") {
              onDevSetPhase("buffer_2");
            } else if (phase === "buffer_2" || phase === "recording_2") {
              onDevSetPhase("buffer_3");
            } else if (phase === "buffer_3" || phase === "recording_3") {
              onDevSetPhase("transition_orb");
            } else {
              onDevSetPhase("buffer_2");
            }
          }}
          disabled={!isInRecording}
          className="rounded bg-green-900/50 px-2 py-1.5 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-30"
        >
          Skip to Next Phase
        </button>
        <button
          type="button"
          onClick={() => onDevSetPhase("consent")}
          disabled={phase === "consent" || phase === "uploading" || phase === "done"}
          className="rounded bg-green-900/50 px-2 py-1.5 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-30"
        >
          Skip to Consent
        </button>
        <button
          type="button"
          onClick={() => onDevSetPhase("pre_exam_orb")}
          disabled={phase === "pre_exam_orb" || phase === "done"}
          className="rounded bg-green-900/50 px-2 py-1.5 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-30"
        >
          Skip to Pre-Exam Orb
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
