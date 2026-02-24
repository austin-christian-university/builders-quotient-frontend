"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { LikertValue } from "@/lib/assessment/personality-bank";

const LIKERT_OPTIONS: { value: LikertValue; label: string; short: string }[] = [
  { value: 1, label: "Strongly Disagree", short: "SD" },
  { value: 2, label: "Disagree", short: "D" },
  { value: 3, label: "Neutral", short: "N" },
  { value: 4, label: "Agree", short: "A" },
  { value: 5, label: "Strongly Agree", short: "SA" },
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
      // Number key shortcuts
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 5) {
        onChange(itemId, num as LikertValue);
        // Focus the newly selected button
        const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
        buttons?.[num - 1]?.focus();
        return;
      }

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

      // Focus the new button
      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[nextIndex]?.focus();
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
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={questionText ? undefined : "Rating scale"}
      aria-labelledby={labelId}
      className="flex gap-2"
    >
      {LIKERT_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            tabIndex={isSelected || (!value && option.value === 1) ? 0 : -1}
            onClick={() => onChange(itemId, option.value)}
            className={cn(
              "flex min-h-11 min-w-11 flex-1 items-center justify-center rounded-full border text-sm font-medium",
              "transition-all duration-300 ease-[var(--ease-out-expo)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
              isSelected
                ? "border-primary/60 bg-primary/10 text-text-primary shadow-[0_0_16px_rgb(77_163_255/0.2)]"
                : "border-border-glass bg-bg-elevated/60 text-text-secondary hover:border-white/20 hover:bg-white/5"
            )}
          >
            <span className="sm:hidden">{option.short}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
