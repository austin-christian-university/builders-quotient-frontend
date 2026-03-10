"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-bg-base px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-tight text-text-primary">
          Something went wrong
        </h1>
        <p className="mt-4 text-[length:var(--text-fluid-base)] text-text-secondary">
          An unexpected error occurred. Please try again, or return home if the
          problem persists.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 font-medium text-bg-base transition-colors hover:bg-primary-hover"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-border-default px-6 py-3 font-medium text-text-secondary transition-colors hover:text-text-primary hover:border-border-hover"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
