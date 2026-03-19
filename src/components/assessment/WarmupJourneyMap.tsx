"use client";

import { cn } from "@/lib/utils";

const sections = ["warmup", "practical", "creative", "done"] as const;

type Section = (typeof sections)[number];

const sectionLabels: Record<Section, string> = {
  warmup: "Warmup",
  practical: "Practical (2)",
  creative: "Creative (2)",
  done: "Done",
};

type WarmupJourneyMapProps = {
  currentSection?: Section;
};

export function WarmupJourneyMap({
  currentSection = "warmup",
}: WarmupJourneyMapProps) {
  const currentIndex = sections.indexOf(currentSection);

  return (
    <div className="w-full px-4 py-3">
      <div
        className="mx-auto flex max-w-2xl gap-1.5"
        role="progressbar"
        aria-label={`Assessment progress: ${sectionLabels[currentSection]}`}
      >
        {sections.map((section, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div
              key={section}
              className={cn(
                "flex flex-col gap-1",
                section === "done" ? "flex-[0.5]" : "flex-1"
              )}
            >
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-500",
                  isCompleted && "bg-primary",
                  isCurrent && "bg-secondary",
                  !isCompleted && !isCurrent && "bg-border-glass"
                )}
              />
              <span className="hidden text-[length:var(--text-fluid-xs)] text-text-secondary md:block">
                {sectionLabels[section]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
