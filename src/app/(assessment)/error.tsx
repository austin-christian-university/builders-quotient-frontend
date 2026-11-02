"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AssessmentError({
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
    <div className="flex min-h-[100svh] flex-col justify-center bg-bg-base px-[clamp(20px,4vw,48px)] text-ink">
      <div className="mx-auto w-full max-w-[1240px] border-t border-ink pt-6">
        <h1 className="max-w-[14ch] font-display text-[clamp(40px,7vw,88px)] font-semibold leading-[0.92] tracking-[-0.05em] text-ink">
          Something went wrong
        </h1>
        <p className="mt-6 max-w-[44ch] text-lg leading-[1.45] text-[#3d3c39]">
          The assessment encountered an error. Your progress has been saved
          automatically — you can pick up where you left off.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button type="button" size="lg" onClick={reset}>
            Try again
          </Button>
          <Button as={Link} href="/" variant="outline" size="lg">
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
