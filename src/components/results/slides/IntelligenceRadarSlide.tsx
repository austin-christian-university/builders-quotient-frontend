"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
import type { RadarCategory } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";
import {
  getShortLabel,
  getCategoryDescription,
} from "@/components/results/short-labels";

interface IntelligenceRadarSlideProps {
  data: {
    radar: RadarCategory[];
  };
  title: string;
  eyebrow: string;
  variant: "pi" | "ci";
  /**
   * "chart" (default) — single max across both polygons hits 100%.
   * "perPolygon" — each polygon's max hits 100% independently.
   * false — raw 0–1 scale, no normalization.
   */
  scaleToMax?: "chart" | "perPolygon" | false;
  gridStyle?: "full" | "axesOnly" | "crosshair";
  /** Hide the entrepreneur average polygon. Default false. */
  hideCorpus?: boolean;
}

const ACCENT_COLOR: Record<"pi" | "ci", string> = {
  pi: "#e8452c",
  ci: "#111111",
};

export function IntelligenceRadarSlide({
  data,
  title,
  eyebrow,
  variant,
  scaleToMax = "chart",
  gridStyle = "full",
  hideCorpus = false,
}: IntelligenceRadarSlideProps) {
  const accentColor = ACCENT_COLOR[variant];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [containerRef, containerWidth] = useContainerWidth();

  const handleCategoryHover = useCallback((index: number | null) => {
    setActiveIndex(index);
  }, []);

  const categoryNames = data.radar.map((c) => getShortLabel(c.category));

  const rawStudent = data.radar.map((c) => c.studentScore);
  const rawCorpus = data.radar.map((c) => c.entrepreneurScore);

  let studentScores: number[];
  let corpusScores: number[];
  let chartMax: number;

  if (hideCorpus) {
    // Student only — scale to student max
    studentScores = rawStudent;
    corpusScores = [];
    chartMax = Math.max(...rawStudent) || 1;
  } else if (scaleToMax === "perPolygon") {
    const sMax = Math.max(...rawStudent) || 1;
    const cMax = Math.max(...rawCorpus) || 1;
    studentScores = rawStudent.map((s) => (s / sMax) * 100);
    corpusScores = rawCorpus.map((s) => (s / cMax) * 100);
    chartMax = 100;
  } else if (scaleToMax === "chart") {
    studentScores = rawStudent;
    corpusScores = rawCorpus;
    chartMax = Math.max(...rawStudent, ...rawCorpus) || 1;
  } else {
    studentScores = rawStudent;
    corpusScores = rawCorpus;
    chartMax = 1;
  }

  const activeDescription =
    activeIndex != null
      ? getCategoryDescription(data.radar[activeIndex].category)
      : null;

  return (
    <section className="min-h-full md:h-full flex flex-col md:overflow-hidden px-5 py-14 md:px-10 md:py-16">
      {/* Header */}
      <div className="shrink-0 w-full max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="border-t border-ink pt-3 text-sm text-[#8c8a84]"
        >
          {eyebrow}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 font-display text-[clamp(28px,3.6vw,44px)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink"
        >
          {title}
        </motion.h2>
      </div>

      {/* Chart — flexes to fill available space */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 min-h-0 flex items-center justify-center py-3"
      >
        <div ref={containerRef} className="w-full max-w-md mx-auto max-h-full px-2">
          <RadarChart
            categories={categoryNames}
            studentScores={studentScores}
            corpusScores={corpusScores.length > 0 ? corpusScores : undefined}
            maxValue={chartMax}
            accentColor={accentColor}
            onCategoryHover={handleCategoryHover}
            activeCategoryIndex={activeIndex}
            gridStyle={gridStyle}
            containerWidth={containerWidth}
          />
        </div>
      </motion.div>

      {/* Footer */}
      <div className="shrink-0">
        {/* Category description (tap/hover reveal) */}
        <div
          className="w-full max-w-3xl mx-auto min-h-8 flex items-center justify-start"
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            {activeDescription ? (
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-sm text-left"
                style={{ color: "#3d3c39" }}
              >
                {activeDescription}
              </motion.p>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.8, delay: 0.6, ease: "easeOut" } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="text-sm text-left"
                style={{ color: "#8c8a84" }}
              >
                <span className="hidden [@media(hover:hover)]:inline">Hover or click a label to learn more</span>
                <span className="[@media(hover:hover)]:hidden">Tap a label to learn more</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Legend — only shown when corpus polygon is visible (two things to distinguish) */}
        {!hideCorpus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="w-full max-w-3xl mx-auto flex flex-wrap items-center justify-start gap-x-6 gap-y-1 border-t border-ink pt-3 mt-1"
            aria-label="Chart legend"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-4 h-[3px]"
                style={{ backgroundColor: accentColor }}
                aria-hidden="true"
              />
              <span className="text-[13px] text-[#6b6963]">
                Your Profile
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-4 border-t-[1.5px] border-dashed border-[#8c8a84]"
                aria-hidden="true"
              />
              <span className="text-[13px] text-[#6b6963]">
                Entrepreneur Average
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
