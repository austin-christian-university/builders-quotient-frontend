"use client";

import { cn } from "@/lib/utils";

type ProgressIndicatorProps = {
  step: number;
  totalSteps: number;
};

export function ProgressIndicator({
  step,
  totalSteps,
}: ProgressIndicatorProps) {
  return (
    <div className="w-full px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        {/* Step segments */}
        <div
          className="flex flex-1 gap-1"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Step ${step} of ${totalSteps}`}
        >
          {Array.from({ length: totalSteps }, (_, i) => {
            const segmentStep = i + 1;
            const isCompleted = segmentStep < step;
            const isCurrent = segmentStep === step;
            return (
              <div
                key={segmentStep}
                className={cn(
                  "h-1 flex-1 transition-colors duration-500",
                  isCompleted && "bg-ink",
                  isCurrent && "bg-vermilion",
                  !isCompleted && !isCurrent && "bg-border"
                )}
              />
            );
          })}
        </div>

        {/* Step counter */}
        <span className="shrink-0 text-sm font-medium tabular-nums text-ink">
          {step}/{totalSteps}
        </span>
      </div>
    </div>
  );
}
