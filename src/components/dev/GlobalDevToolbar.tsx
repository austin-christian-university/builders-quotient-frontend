"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  devResetSession,
  devGetSessionStatus,
} from "@/lib/actions/dev";

export function GlobalDevToolbar() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = useCallback(() => setVisible((v) => !v), []);

  // Fetch session status on mount and when toolbar opens
  useEffect(() => {
    if (!visible) return;
    devGetSessionStatus().then(({ status, sessionId: id }) => {
      setSessionStatus(status);
      setSessionId(id);
    });
  }, [visible]);

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

  const handleReset = () => {
    startTransition(async () => {
      await devResetSession();
      setSessionStatus(null);
      setSessionId(null);
      router.refresh();
    });
  };

  // Collapsed pill
  if (!visible) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-4 right-4 z-50 rounded-full border border-green-500/40 bg-green-950/80 px-3 py-1.5 font-mono text-xs text-green-400 backdrop-blur-sm"
      >
        DEV
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-xl border border-green-500/30 bg-green-950/90 p-3 font-mono text-xs shadow-lg shadow-green-900/20 backdrop-blur-md">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-green-500">
          Global Dev
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

      {/* Session status */}
      <div className="mb-2 rounded-md bg-green-900/40 px-2 py-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              sessionStatus ? "bg-green-400" : "bg-green-500/30"
            }`}
          />
          <span className="text-green-300">
            {sessionStatus
              ? `Session: ${sessionStatus}`
              : "No session"}
          </span>
        </div>
        {sessionId && (
          <div className="mt-1 truncate text-green-500/50">
            {sessionId}
          </div>
        )}
      </div>

      {/* Actions */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleReset}
        className="w-full rounded bg-red-900/50 px-2 py-1.5 text-[11px] text-red-300 transition-colors hover:bg-red-800/60 disabled:opacity-50"
      >
        {isPending ? "Resetting\u2026" : "Reset Session"}
      </button>

      {/* Keyboard shortcut hint */}
      <div className="mt-2 text-center text-[10px] text-green-500/40">
        &#x2318;&#x21E7;D to toggle
      </div>
    </div>
  );
}
