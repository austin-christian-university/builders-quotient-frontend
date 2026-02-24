"use client";

import { cn } from "@/lib/utils";

type PersonalityProgressProps = {
  answeredCount: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
};

export function PersonalityProgress({
  answeredCount,
  totalItems,
  currentPage,
  totalPages,
}: PersonalityProgressProps) {
  const pct = totalItems > 0 ? (answeredCount / totalItems) * 100 : 0;
  const isComplete = answeredCount === totalItems;

  return (
    <div className="w-full px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div
          className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border-glass"
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={totalItems}
          aria-label={`${answeredCount} of ${totalItems} questions answered`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-[var(--ease-out-expo)]",
              isComplete ? "bg-secondary" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        <span className="shrink-0 text-[length:var(--text-fluid-xs)] tabular-nums text-text-secondary">
          Page&nbsp;{currentPage + 1}/{totalPages}
        </span>
      </div>
    </div>
  );
}
