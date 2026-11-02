"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function ResumeBanner() {
  const searchParams = useSearchParams();
  const isResume = searchParams.get("resume") === "true";
  const [dismissed, setDismissed] = useState(false);

  if (!isResume || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative mx-auto mb-6 w-full max-w-2xl border border-ink border-l-4 border-l-vermilion bg-bg-elevated px-5 py-4 pr-12 text-sm leading-relaxed text-ink"
    >
      <p className="font-semibold tracking-[-0.01em]">Welcome back!</p>
      <p className="mt-1 text-[#3d3c39]">
        We noticed you were in the middle of your assessment. Even if you feel
        unsure about your responses so far, keep going &mdash; finish this
        attempt and you can take it again in two&nbsp;hours with a
        fresh&nbsp;start.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center text-text-secondary transition-colors hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
        aria-label="Dismiss"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
