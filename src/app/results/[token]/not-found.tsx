import Link from "next/link";

export default function ResultsNotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-bg-base px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-tight text-text-primary">
          Results not found
        </h1>
        <p className="mt-4 text-[length:var(--text-fluid-base)] text-text-secondary">
          This results link may be expired or invalid. If you recently completed
          the assessment, your results may still be processing.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-full bg-primary px-6 py-3 font-medium text-bg-base transition-colors hover:bg-primary-hover"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
