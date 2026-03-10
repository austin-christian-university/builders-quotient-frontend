"use client";

import { motion } from "motion/react";
import type { CorpusAverage } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";

interface CommunicationRadarSlideProps {
  data: {
    profile: { category: string; value: number }[];
    corpusAverage: CorpusAverage | null;
  };
}

const ACCENT_COLOR = "#2dd4bf";

export function CommunicationRadarSlide({ data }: CommunicationRadarSlideProps) {
  const categoryNames = data.profile.map((p) => p.category);
  const studentScores = data.profile.map((p) => p.value);

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
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] mb-3 text-center"
          style={{ color: "#9aa0ac" }}
        >
          Communication Style
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-semibold text-center mb-10"
          style={{
            color: "#f5f6fa",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          How You Present &amp; Connect
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto"
        >
          <RadarChart
            categories={categoryNames}
            studentScores={studentScores}
            corpusScores={corpusScores}
            accentColor={ACCENT_COLOR}
          />
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center justify-center gap-6 mt-6"
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
      </div>
    </section>
  );
}
