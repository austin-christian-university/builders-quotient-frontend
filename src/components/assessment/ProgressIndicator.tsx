"use client";

import { cn } from "@/lib/utils";

type ProgressIndicatorProps = {
  step: number;
  totalSteps: number;
  vignetteType: "practical" | "creative";
};

const TYPE_LABELS: Record<string, string> = {
  practical: "Practical Intelligence",
  creative: "Creative Intelligence",
};

export function ProgressIndicator({
  step,
  totalSteps,
  vignetteType,
}: ProgressIndicatorProps) {
  const progress = ((step - 1) / totalSteps) * 100;

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

        {/* Label */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[length:var(--text-fluid-xs)] tabular-nums text-text-secondary">
            {step}/{totalSteps}
          </span>
          <span className="rounded-full border border-border-glass px-2.5 py-0.5 text-[length:var(--text-fluid-xs)] font-medium text-text-secondary">
            {TYPE_LABELS[vignetteType]}
          </span>
        </div>
      </div>
    </div>
  );
}
