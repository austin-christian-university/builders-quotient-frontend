"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PersonalityItem, LikertValue } from "@/lib/assessment/personality-bank";
import {
  devFillPersonality,
  type FillStrategy,
} from "@/lib/actions/dev";
import { submitPersonalityQuiz } from "@/lib/actions/personality";

type PersonalityDevToolbarProps = {
  sessionId: string;
  responses: Record<string, LikertValue>;
  setResponses: (r: Record<string, LikertValue>) => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  totalPages: number;
  pages: PersonalityItem[][];
  onSubmit: () => void;
};

export function PersonalityDevToolbar({
  sessionId,
  responses,
  setResponses,
  currentPage,
  setCurrentPage,
  totalPages,
  pages,
}: PersonalityDevToolbarProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [jumpPage, setJumpPage] = useState(String(currentPage + 1));

  const answeredCount = Object.keys(responses).length;
  const toggle = useCallback(() => setVisible((v) => !v), []);

  // Sync jumpPage when currentPage changes externally
  useEffect(() => {
    setJumpPage(String(currentPage + 1));
  }, [currentPage]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  const fillPage = useCallback(() => {
    const currentItems = pages[currentPage] ?? [];
    const updated = { ...responses };
    for (const item of currentItems) {
      updated[item.id] = 4;
    }
    setResponses(updated);
  }, [pages, currentPage, responses, setResponses]);

  const fillAll = useCallback(
    async (strategy: FillStrategy) => {
      setLoading(strategy);
      const result = await devFillPersonality(sessionId, strategy);
      if (result.success && result.responses) {
        setResponses(result.responses);
      } else {
        console.error("[DEV] Fill failed:", result.error);
      }
      setLoading(null);
    },
    [sessionId, setResponses]
  );

  const fillAndSubmit = useCallback(async () => {
    setLoading("fill-submit");
    const fillResult = await devFillPersonality(sessionId, "all-5");
    if (!fillResult.success) {
      console.error("[DEV] Fill failed:", fillResult.error);
      setLoading(null);
      return;
    }
    if (fillResult.responses) {
      setResponses(fillResult.responses);
    }

    const submitResult = await submitPersonalityQuiz({ sessionId });
    if (!submitResult.success) {
      console.error("[DEV] Submit failed:", submitResult.error);
      setLoading(null);
      return;
    }

    router.push("/assess/personality/debug");
  }, [sessionId, setResponses, router]);

  const handleJump = useCallback(
    (value: string) => {
      setJumpPage(value);
      const page = parseInt(value, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        setCurrentPage(page - 1);
      }
    },
    [totalPages, setCurrentPage]
  );

  // Collapsed pill
  if (!visible) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-4 left-4 z-50 rounded-full border border-green-500/40 bg-green-950/80 px-3 py-1.5 font-mono text-xs text-green-400 backdrop-blur-sm"
      >
        DEV: Page {currentPage + 1}/{totalPages}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 rounded-xl border border-green-500/30 bg-green-950/90 p-3 font-mono text-xs shadow-lg shadow-green-900/20 backdrop-blur-md">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-green-500">
          Personality Dev
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

      {/* Status bar */}
      <div className="mb-2 rounded-md bg-green-900/40 px-2 py-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
          <span className="font-semibold text-green-300">
            Page {currentPage + 1}/{totalPages}
          </span>
          <span className="text-green-500/70">
            {answeredCount}/96 answered
          </span>
        </div>
      </div>

      {/* Fill current page */}
      <div className="mb-2">
        <div className="mb-1 text-[10px] text-green-500/60">Current page</div>
        <button
          type="button"
          onClick={fillPage}
          className="w-full rounded bg-green-900/50 px-1.5 py-1 text-[11px] text-green-400 transition-colors hover:bg-green-800/60"
        >
          Fill Page (value=4)
        </button>
      </div>

      {/* Fill all strategies */}
      <div className="mb-2">
        <div className="mb-1 text-[10px] text-green-500/60">Fill all (DB)</div>
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              ["all-1", "All 1"],
              ["all-3", "All 3"],
              ["all-5", "All 5"],
              ["random", "Random"],
              ["realistic", "Realistic"],
            ] as [FillStrategy, string][]
          ).map(([strategy, label]) => (
            <button
              key={strategy}
              type="button"
              disabled={loading !== null}
              onClick={() => fillAll(strategy)}
              className="rounded bg-green-900/50 px-1.5 py-1 text-[11px] text-green-400 transition-colors hover:bg-green-800/60 disabled:opacity-40"
            >
              {loading === strategy ? "\u2026" : label}
            </button>
          ))}
        </div>
      </div>

      {/* Fill & Submit */}
      <div className="mb-2">
        <button
          type="button"
          disabled={loading !== null}
          onClick={fillAndSubmit}
          className="w-full rounded bg-green-700/50 px-1.5 py-1.5 text-[11px] font-semibold text-green-300 transition-colors hover:bg-green-600/50 disabled:opacity-40"
        >
          {loading === "fill-submit"
            ? "Filling & submitting\u2026"
            : "Fill & Submit \u2192 Debug"}
        </button>
      </div>

      {/* Page jump */}
      <div className="mb-2 border-t border-green-500/20 pt-2">
        <div className="mb-1 text-[10px] text-green-500/60">Jump to page</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpPage}
            onChange={(e) => handleJump(e.target.value)}
            className="w-14 rounded bg-green-900/50 px-2 py-1 text-center text-[11px] text-green-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-green-500/60">/ {totalPages}</span>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mt-2 text-center text-[10px] text-green-500/40">
        &#x2318;&#x21E7;D to toggle
      </div>
    </div>
  );
}
