"use client";

import { motion } from "motion/react";
import type { CorpusAverage } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";
import {
  PERSONALITY_DIMENSION_NAMES,
  PERSONALITY_DIMENSION_CATEGORIES,
} from "@/lib/assessment/personality-dimensions";

interface CommunicationRadarSlideProps {
  data: {
    profile: { category: string; value: number }[];
    corpusAverage: CorpusAverage | null;
  };
}

const ACCENT_COLOR = "#2dd4bf";

/** Colors for the 5 meta-category sector arcs */
const SECTOR_COLORS: Record<string, string> = {
  "Energy & Dynamism": "#2dd4bf",
  "Confidence & Authority": "#63b3ed",
  "Warmth & Interpersonal": "#f87171",
  "Communication Style": "#a78bfa",
  "Self-Presentation": "#fbbf24",
};

/** Full arc labels */
const SECTOR_FULL_LABELS: Record<string, string> = {
  "Energy & Dynamism": "Energy & Dynamism",
  "Confidence & Authority": "Confidence & Authority",
  "Warmth & Interpersonal": "Warmth & Interpersonal",
  "Communication Style": "Communication Style",
  "Self-Presentation": "Self-Presentation",
};

export function CommunicationRadarSlide({ data }: CommunicationRadarSlideProps) {
  // Build an index map: pv_key -> position in the profile array
  const keyToIndex = new Map(data.profile.map((p, i) => [p.category, i]));

  // Category names are just keys here — we pass human-readable names via tooltipLabels
  const categoryNames = data.profile.map((p) => p.category);
  const studentScores = data.profile.map((p) => p.value * 100);
  const tooltipLabels = data.profile.map(
    (p) => PERSONALITY_DIMENSION_NAMES[p.category] ?? p.category
  );

  // Build sector groups from the 5 meta-categories
  const sectorGroups = Object.entries(PERSONALITY_DIMENSION_CATEGORIES).map(
    ([catName, keys]) => ({
      label: SECTOR_FULL_LABELS[catName] ?? catName,
      color: SECTOR_COLORS[catName] ?? ACCENT_COLOR,
      indices: keys
        .map((k) => keyToIndex.get(k))
        .filter((i): i is number => i !== undefined),
    })
  );

  // Per-dot colors: each dot gets its sector group color
  const dotColors = data.profile.map((p) => {
    for (const [catName, keys] of Object.entries(PERSONALITY_DIMENSION_CATEGORIES)) {
      if (keys.includes(p.category)) {
        return SECTOR_COLORS[catName] ?? ACCENT_COLOR;
      }
    }
    return ACCENT_COLOR;
  });

  // Build corpus scores aligned to the same category order
  const corpusScores = data.corpusAverage
    ? data.profile.map((p) => {
        const match = data.corpusAverage!.categories.find(
          (c) => c.category === p.category
        );
        return match?.averageScore ?? 0;
      })
    : undefined;

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
          Communication Style
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
          How You Present &amp; Connect
        </motion.h2>
      </div>

      {/* Chart — flexes to fill available space */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 min-h-0 flex items-center justify-center py-2"
      >
        <div className="w-full max-w-md mx-auto max-h-full">
          <RadarChart
            categories={categoryNames}
            studentScores={studentScores}
            corpusScores={corpusScores}
            accentColor={ACCENT_COLOR}
            sectorGroups={sectorGroups}
            tooltipLabels={tooltipLabels}
            dotColors={dotColors}
          />
        </div>
      </motion.div>

      {/* Footer */}
      <div className="shrink-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center justify-center gap-6 mt-2"
          aria-label="Chart legend"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: ACCENT_COLOR }}
              aria-hidden="true"
            />
            <span className="text-sm" style={{ color: "#9aa0ac" }}>
              Your Profile
            </span>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-center mt-2 text-xs"
          style={{ color: "rgba(154,160,172,0.6)" }}
        >
          Hover or tap any point to see the dimension
        </motion.p>
      </div>
    </section>
  );
}
