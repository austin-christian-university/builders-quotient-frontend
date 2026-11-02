"use client";

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

  return (
    <div className="w-full px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center gap-4">
        <div
          className="relative h-0.5 flex-1 overflow-hidden bg-border"
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={totalItems}
          aria-label={`${answeredCount} of ${totalItems} questions answered`}
        >
          <div
            className="h-full bg-ink transition-[width] duration-500 ease-[var(--ease-out-expo)]"
            style={{ width: `${pct}%` }}
          />
        </div>

        <span className="shrink-0 text-sm tabular-nums text-text-secondary">
          Page&nbsp;{currentPage + 1}/{totalPages}
        </span>
      </div>
    </div>
  );
}
