"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Action, Phase, State } from "@/lib/assessment/vignette-reducer";
import { devSkipToComplete } from "@/lib/actions/dev";

const PHASES: Phase[] = [
  "ready",
  "countdown",
  "narrating",
  "buffer",
  "recording",
  "submitting",
  "transitioning",
  "error",
];

const PHASE_LABELS: Record<Phase, string> = {
  ready: "Ready",
  countdown: "Countdown",
  narrating: "Narrating",
  buffer: "Buffer",
  recording: "Recording",
  submitting: "Submitting",
  transitioning: "Transitioning",
  error: "Error",
};

type DevToolbarProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  bufferRemaining: number;
  recorderDuration: number;
  recorderStatus: string;
  streamStatus: string;
  sessionId: string;
};

export function DevToolbar({
  state,
  dispatch,
  bufferRemaining,
  recorderDuration,
  recorderStatus,
  streamStatus,
  sessionId,
}: DevToolbarProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [skipping, setSkipping] = useState(false);

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

  const jumpTo = (phase: Phase) => {
    dispatch({ type: "DEV_SET_PHASE", phase });
  };

  // Collapsed pill
  if (!visible) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-4 left-4 z-50 rounded-full border border-green-500/40 bg-green-950/80 px-3 py-1.5 font-mono text-xs text-green-400 backdrop-blur-sm"
      >
        DEV: {PHASE_LABELS[state.phase]}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 rounded-xl border border-green-500/30 bg-green-950/90 p-3 font-mono text-xs shadow-lg shadow-green-900/20 backdrop-blur-md">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-green-500">
          Dev Toolbar
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
            {PHASE_LABELS[state.phase]}
          </span>
        </div>
        <div className="mt-1 text-green-500/70">
          {state.phase === "buffer" && `${bufferRemaining}s remaining`}
          {state.phase === "recording" && `${recorderDuration}s recorded`}
          {state.phase === "error" && state.errorMessage}
          {(state.phase === "ready" || state.phase === "narrating" || state.phase === "submitting" || state.phase === "transitioning") && (
            <span>
              stream: {streamStatus} | rec: {recorderStatus}
            </span>
          )}
        </div>
      </div>

      {/* Phase jump buttons */}
      <div className="mb-2">
        <div className="mb-1 text-[10px] text-green-500/60">Jump to phase</div>
        <div className="grid grid-cols-3 gap-1">
          {PHASES.map((phase) => (
            <button
              key={phase}
              type="button"
              onClick={() => jumpTo(phase)}
              className={`rounded px-1.5 py-1 text-[11px] transition-colors ${
                state.phase === phase
                  ? "bg-green-500 text-green-950 font-semibold"
                  : "bg-green-900/50 text-green-400 hover:bg-green-800/60"
              }`}
            >
              {PHASE_LABELS[phase]}
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="mb-1 text-[10px] text-green-500/60">Quick actions</div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "NARRATION_COMPLETE" })}
            disabled={state.phase !== "narrating"}
            className="flex-1 rounded bg-green-900/50 px-1.5 py-1 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-30 disabled:hover:bg-green-900/50"
          >
            Skip Narration
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "BUFFER_COMPLETE" })}
            disabled={state.phase !== "buffer"}
            className="flex-1 rounded bg-green-900/50 px-1.5 py-1 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-30 disabled:hover:bg-green-900/50"
          >
            Skip Buffer
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-2 border-t border-green-500/20 pt-2">
        <div className="mb-1 text-[10px] text-green-500/60">Navigation</div>
        <button
          type="button"
          disabled={skipping}
          onClick={async () => {
            setSkipping(true);
            const result = await devSkipToComplete();
            if (result.success) {
              router.push("/assess/complete");
            } else {
              setSkipping(false);
              console.error("[DEV] Skip failed:", result.error);
            }
          }}
          className="w-full rounded bg-green-900/50 px-1.5 py-1 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-50"
        >
          {skipping ? "Skipping\u2026" : "Skip to Complete"}
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mt-2 text-center text-[10px] text-green-500/40">
        &#x2318;&#x21E7;D to toggle
      </div>
    </div>
  );
}
