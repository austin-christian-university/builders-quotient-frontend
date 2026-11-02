"use client";

import { BqMark } from "@/components/brand/BqMark";
import { Button } from "@/components/ui/button";

export default function ResultsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[100svh] flex-col bg-paper px-[clamp(20px,4vw,48px)] text-ink">
      <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-center py-16">
        <BqMark className="mb-10 h-10 w-10 text-ink" />
        <div className="max-w-xl border-t border-ink pt-6">
          <h1 className="text-[clamp(40px,7vw,80px)] font-semibold leading-[0.92] tracking-[-0.055em]">
            Something went wrong
          </h1>
          <p className="mt-6 max-w-[40ch] text-[clamp(17px,1.5vw,19px)] leading-[1.5] text-[#3d3c39]">
            We couldn&apos;t load your results. Please try again.
          </p>
          <Button onClick={reset} size="lg" className="mt-8">
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
