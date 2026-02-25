"use client";

import { useState } from "react";
import { devSkipToComplete } from "@/lib/actions/dev";

export function DevSkipButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await devSkipToComplete();
    // Only reaches here on failure (success redirects server-side)
    setLoading(false);
    setError(result.error ?? "Unknown error");
    console.error("[DEV] Skip failed:", result.error);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-full border border-green-500/40 bg-green-950/80 px-4 py-2 font-mono text-xs text-green-400 backdrop-blur-sm transition-colors hover:bg-green-900/80 disabled:opacity-50"
      >
        {loading ? "DEV: Skipping\u2026" : "DEV: Skip to Complete"}
      </button>
      {error && (
        <p className="max-w-xs text-center font-mono text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
