"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <main className="flex min-h-[100svh] flex-col items-center justify-center bg-[#f4f1ea] px-6">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#111111]">
              Something went wrong
            </h1>
            <p className="mt-4 text-base text-[#6b6963]">
              An unexpected error occurred. Please try again, or return home if
              the problem persists.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={reset}
                className="inline-flex items-center rounded-full bg-[#e8452c] px-6 py-3 font-medium text-[#f4f1ea] transition-colors hover:bg-[#d93d25]"
              >
                Try again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error replaces the root layout; Link may not have router context */}
              <a
                href="/"
                className="inline-flex items-center rounded-full border border-[#d9d5cb] px-6 py-3 font-medium text-[#6b6963] transition-colors hover:text-[#111111] hover:border-[#d9d5cb]"
              >
                Back to home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
