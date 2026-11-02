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

const ACCENT_COLOR = "#e8452c";

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
    <section className="min-h-full md:h-full flex flex-col md:overflow-hidden px-5 py-14 md:px-10 md:py-16">
      {/* Header */}
      <div className="shrink-0 w-full max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="border-t border-ink pt-3 text-sm text-[#8c8a84]"
        >
          Entrepreneur Personality
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 font-display text-[clamp(28px,3.6vw,44px)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink"
        >
          Your Entrepreneurial Traits
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-2 text-sm text-[#6b6963]"
        >
          Based on peer-reviewed research on traits correlated with
          entrepreneurial success
        </motion.p>
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
        <div className="w-full max-w-3xl mx-auto h-16 flex items-center justify-start">
          <AnimatePresence mode="wait">
            {activeFacet && activeDescription ? (
              <motion.div
                key={activeFacet.facet}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-left max-w-xl"
              >
                <p
                  className="text-sm font-semibold text-ink mb-1"
                >
                  {activeFacet.label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#6b6963" }}>
                  {activeDescription}
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.8, delay: 0.6, ease: "easeOut" } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="text-left text-sm"
                style={{ color: "#8c8a84" }}
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
