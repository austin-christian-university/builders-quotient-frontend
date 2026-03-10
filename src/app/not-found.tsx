import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-bg-base px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-[length:var(--text-fluid-base)] font-semibold tracking-widest text-primary uppercase">
          404
        </p>
        <h1 className="mt-2 font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-tight text-text-primary">
          Page not found
        </h1>
        <p className="mt-4 text-[length:var(--text-fluid-base)] text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
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
