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
          className="flex flex-1 gap-1.5"
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
                  "h-1.5 flex-1 rounded-full transition-colors duration-500",
                  isCompleted && "bg-primary",
                  isCurrent && "bg-secondary",
                  !isCompleted && !isCurrent && "bg-border-glass"
                )}
              />
            );
          })}
        </div>

        {/* Step counter */}
        <span className="shrink-0 text-[length:var(--text-fluid-xs)] tabular-nums text-text-secondary">
          {step}/{totalSteps}
        </span>
      </div>
    </div>
  );
}
