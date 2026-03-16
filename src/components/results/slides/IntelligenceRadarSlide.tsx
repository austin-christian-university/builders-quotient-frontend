"use client";

import { useState } from "react";
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
  pi: "#4da3ff",
  ci: "#e9b949",
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
    <section className="min-h-full md:h-full flex flex-col md:overflow-hidden px-6 py-8 md:py-16">
      {/* Header */}
      <div className="shrink-0 text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] mb-2 text-center"
          style={{ color: "#9aa0ac" }}
        >
          {eyebrow}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-semibold text-center"
          style={{
            color: "#f5f6fa",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </motion.h2>
      </div>

      {/* Chart — flexes to fill available space */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 min-h-0 flex items-center justify-center py-2"
      >
        <div ref={containerRef} className="w-full max-w-md mx-auto max-h-full px-2">
          <RadarChart
            categories={categoryNames}
            studentScores={studentScores}
            corpusScores={corpusScores.length > 0 ? corpusScores : undefined}
            maxValue={chartMax}
            accentColor={accentColor}
            onCategoryHover={setActiveIndex}
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
          className="h-8 flex items-center justify-center"
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
                className="text-sm text-center"
                style={{ color: "#c8ccd4" }}
              >
                {activeDescription}
              </motion.p>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-center"
                style={{ color: "rgba(154,160,172,0.6)" }}
              >
                <span className="hidden [@media(hover:hover)]:inline">Hover or click a label to learn more</span>
                <span className="[@media(hover:hover)]:hidden">Tap a label to learn more</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center justify-center gap-6 mt-1"
          aria-label="Chart legend"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            <span className="text-sm" style={{ color: "#9aa0ac" }}>
              Your Profile
            </span>
          </div>
          {!hideCorpus && <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.3)",
              }}
              aria-hidden="true"
            />
            <span className="text-sm" style={{ color: "#9aa0ac" }}>
              Entrepreneur Average
            </span>
          </div>}
        </motion.div>
      </div>
    </section>
  );
}
