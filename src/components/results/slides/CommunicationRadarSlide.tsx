"use client";

import { motion } from "motion/react";
import type { CorpusAverage } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
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

const ACCENT_COLOR = "#e8452c";

/** Ink-to-grey ramp for the 5 meta-category sector arcs (vermilion is the profile line) */
const SECTOR_COLORS: Record<string, string> = {
  "Energy & Dynamism": "#111111",
  "Confidence & Authority": "#4a4844",
  "Warmth & Interpersonal": "#6b6963",
  "Communication Style": "#8c8a84",
  "Self-Presentation": "#b5b1a7",
};

/** Full arc labels */
const SECTOR_FULL_LABELS: Record<string, string> = {
  "Energy & Dynamism": "Energy",
  "Confidence & Authority": "Confidence",
  "Warmth & Interpersonal": "Warmth",
  "Communication Style": "Style",
  "Self-Presentation": "Presentation",
};

export function CommunicationRadarSlide({ data }: CommunicationRadarSlideProps) {
  const [containerRef, containerWidth] = useContainerWidth();
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
    <section className="min-h-full md:h-full flex flex-col md:overflow-hidden px-5 py-14 md:px-10 md:py-16">
      {/* Header */}
      <div className="shrink-0 w-full max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="border-t border-ink pt-3 text-sm text-[#8c8a84]"
        >
          Communication Style
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 font-display text-[clamp(28px,3.6vw,44px)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink"
        >
          How You Present &amp; Connect
        </motion.h2>
      </div>

      {/* Chart — flexes to fill available space */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 min-h-0 flex items-center justify-center py-3"
      >
        <div ref={containerRef} className="w-full max-w-lg mx-auto max-h-full px-2">
          <RadarChart
            categories={categoryNames}
            studentScores={studentScores}
            corpusScores={corpusScores}
            accentColor={ACCENT_COLOR}
            sectorGroups={sectorGroups}
            tooltipLabels={tooltipLabels}
            dotColors={dotColors}
            containerWidth={containerWidth}
          />
        </div>
      </motion.div>

      {/* Footer */}
      <div className="shrink-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="w-full max-w-3xl mx-auto flex flex-wrap items-center justify-start gap-x-6 gap-y-1 border-t border-ink pt-3 mt-2"
          aria-label="Chart legend"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-[3px]"
              style={{ backgroundColor: ACCENT_COLOR }}
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          className="w-full max-w-3xl mx-auto mt-2 text-sm text-left"
          style={{ color: "#8c8a84" }}
        >
          <span className="hidden [@media(hover:hover)]:inline">Hover or click any point to see the dimension</span>
          <span className="[@media(hover:hover)]:hidden">Tap any point to see the dimension</span>
        </motion.p>
      </div>
    </section>
  );
}
