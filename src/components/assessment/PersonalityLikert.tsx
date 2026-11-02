"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { LikertValue } from "@/lib/assessment/personality-bank";

const LIKERT_OPTIONS: { value: LikertValue; label: string }[] = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

type PersonalityLikertProps = {
  itemId: string;
  questionText?: string;
  value: LikertValue | undefined;
  onChange: (itemId: string, value: LikertValue) => void;
};

export function PersonalityLikert({
  itemId,
  questionText,
  value,
  onChange,
}: PersonalityLikertProps) {
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Arrow key navigation (WAI-ARIA APG Radio Group pattern)
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
      e.preventDefault();

      const currentIndex = value ? value - 1 : 0;
      let nextIndex: number;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % LIKERT_OPTIONS.length;
      } else {
        nextIndex = (currentIndex - 1 + LIKERT_OPTIONS.length) % LIKERT_OPTIONS.length;
      }

      const nextOption = LIKERT_OPTIONS[nextIndex];
      onChange(itemId, nextOption.value);

      // Focus the new option
      const options = groupRef.current?.querySelectorAll<HTMLDivElement>('[role="radio"]');
      options?.[nextIndex]?.focus();
    },
    [itemId, onChange, value]
  );

  useEffect(() => {
    const el = groupRef.current;
    if (!el) return;
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const labelId = questionText ? `likert-label-${itemId}` : undefined;

  return (
    <div>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={questionText ? undefined : "Rating scale"}
        aria-labelledby={labelId}
        className="flex justify-between"
      >
        {LIKERT_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <div
              key={option.value}
              role="radio"
              aria-checked={isSelected}
              aria-label={option.label}
              tabIndex={isSelected || (!value && option.value === 1) ? 0 : -1}
              onClick={() => onChange(itemId, option.value)}
              className={cn(
                "flex size-11 cursor-pointer items-center justify-center border font-display text-sm font-semibold tabular-nums select-none",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
                isSelected
                  ? "border-vermilion bg-vermilion text-ink"
                  : "border-ink bg-transparent text-ink hover:bg-ink/5"
              )}
            >
              {option.value}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-text-secondary">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  );
}
