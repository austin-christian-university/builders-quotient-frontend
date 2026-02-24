"use client";

export default function ResultsError({
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
          We couldn&apos;t load your results. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-flex items-center rounded-full bg-primary px-6 py-3 font-medium text-bg-base transition-colors hover:bg-primary-hover"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
