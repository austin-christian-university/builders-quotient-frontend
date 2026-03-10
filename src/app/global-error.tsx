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
        <main className="flex min-h-[100svh] flex-col items-center justify-center bg-[#0a0a0c] px-6">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#f5f6fa]">
              Something went wrong
            </h1>
            <p className="mt-4 text-base text-[#9aa0ac]">
              An unexpected error occurred. Please try again, or return home if
              the problem persists.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={reset}
                className="inline-flex items-center rounded-full bg-[#4da3ff] px-6 py-3 font-medium text-[#0a0a0c] transition-colors hover:bg-[#6bb3ff]"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center rounded-full border border-[#1f1f23] px-6 py-3 font-medium text-[#9aa0ac] transition-colors hover:text-[#f5f6fa] hover:border-[#2f2f35]"
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
