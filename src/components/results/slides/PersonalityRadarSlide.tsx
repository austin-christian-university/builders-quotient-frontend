"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { PersonalityData } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
import { FACET_DESCRIPTIONS } from "@/lib/assessment/personality-bank";
import type { PersonalityFacet } from "@/lib/assessment/personality-bank";

interface PersonalityRadarSlideProps {
  data: PersonalityData;
}

const ACCENT_COLOR = "#a78bfa";

export function PersonalityRadarSlide({ data }: PersonalityRadarSlideProps) {
  const [containerRef, containerWidth] = useContainerWidth();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Use only the 8 scored facets (exclude attention-check facet if present)
  const facets = data.facetScores.filter((f) => f.facet !== "AC");

  const categoryNames = facets.map((f) => f.label);
  const studentScores = facets.map((f) => f.rescaledScore);

  const handleCategoryHover = useCallback((index: number | null) => {
    setActiveIndex(index);
  }, []);

  const activeFacet = activeIndex !== null ? facets[activeIndex] : null;
  const activeDescription = activeFacet
    ? FACET_DESCRIPTIONS[activeFacet.facet as Exclude<PersonalityFacet, "AC">]
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
            onCategoryHover={handleCategoryHover}
            activeCategoryIndex={activeIndex}
            tooltipLabels={categoryNames}
          />
        </div>
      </motion.div>

      {/* Footer — tooltip description + legend */}
      <div className="shrink-0">
        {/* Facet description tooltip */}
        <div className="h-16 flex items-center justify-center px-8 md:px-0">
          <AnimatePresence mode="wait">
            {activeFacet && activeDescription ? (
              <motion.div
                key={activeFacet.facet}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-center max-w-md mx-auto"
              >
                <p
                  className="text-xs font-semibold uppercase tracking-[0.2em] mb-1"
                  style={{ color: ACCENT_COLOR }}
                >
                  {activeFacet.label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#9aa0ac" }}>
                  {activeDescription}
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.8, delay: 0.6, ease: "easeOut" } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="text-center text-base"
                style={{ color: "rgba(154,160,172,0.85)" }}
              >
                <span className="hidden [@media(hover:hover)]:inline">Hover or click any point to see its definition</span>
                <span className="[@media(hover:hover)]:hidden">Tap any point to see its definition</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
