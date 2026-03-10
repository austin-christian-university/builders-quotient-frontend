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
                "flex size-11 cursor-pointer items-center justify-center rounded-full border text-sm font-medium select-none",
                "transition-all duration-300 ease-[var(--ease-out-expo)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
                isSelected
                  ? "border-primary/60 bg-primary/10 text-text-primary shadow-[0_0_16px_rgb(77_163_255/0.2)]"
                  : "border-border-glass bg-bg-elevated/60 text-text-secondary hover:border-white/20 hover:bg-white/5"
              )}
            >
              {option.value}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between px-1 text-xs text-text-secondary/60">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  );
}
