"use client";

import { motion } from "motion/react";
import type { PersonalityData } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";
import { useContainerWidth } from "@/lib/hooks/use-container-width";

interface PersonalityRadarSlideProps {
  data: PersonalityData;
}

const ACCENT_COLOR = "#a78bfa";

export function PersonalityRadarSlide({ data }: PersonalityRadarSlideProps) {
  const [containerRef, containerWidth] = useContainerWidth();
  // Use only the 8 scored facets (exclude attention-check facet if present)
  const facets = data.facetScores.filter((f) => f.facet !== "AC");

  const categoryNames = facets.map((f) => f.label);
  const studentScores = facets.map((f) => f.rescaledScore);

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
          Entrepreneur Personality
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-semibold text-center mb-1"
          style={{
            color: "#f5f6fa",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          Your Entrepreneurial Traits
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm text-center italic"
          style={{ color: "#9aa0ac" }}
        >
          Based on peer-reviewed research on traits correlated with
          entrepreneurial success
        </motion.p>
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
            accentColor={ACCENT_COLOR}
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
        </motion.div>
      </div>
    </section>
  );
}
