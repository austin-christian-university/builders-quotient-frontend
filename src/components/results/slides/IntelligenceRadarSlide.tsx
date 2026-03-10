"use client";

import { motion } from "motion/react";
import type { CategoryScore, CorpusAverage } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";

interface IntelligenceRadarSlideProps {
  data: {
    categories: CategoryScore[];
    corpusAverage: CorpusAverage | null;
  };
  title: string;
  eyebrow: string;
  variant: "pi" | "ci";
}

// Abbreviated radar labels to keep the chart readable
const SHORT_LABELS: Record<string, string> = {
  // PI categories
  "Situation Diagnosis": "Diagnosis",
  "Information Gathering": "Info Gathering",
  "Constraint Analysis": "Constraints",
  "Option Generation": "Options",
  "Tradeoff Evaluation": "Tradeoffs",
  "Risk Assessment": "Risk",
  "Decision Architecture": "Decision",
  "Action Planning": "Action",
  "People & Stakeholders": "People",
  "Communication Strategy": "Communication",
  "Emotional & Values Reasoning": "Values",
  "Meta-Cognition": "Meta-Cognition",
  // CI categories
  "Pattern Recognition & Observation": "Patterns",
  "Information Seeking & Market Research": "Market Research",
  "Reframing & Category Innovation": "Reframing",
  "Cross-Domain Connection": "Cross-Domain",
  "Opportunity Articulation": "Opportunity",
  "Customer & Market Insight": "Customer Insight",
  "Timing & Context Assessment": "Timing",
  "Validation & Testing Strategy": "Validation",
  "Risk & Feasibility Evaluation": "Feasibility",
  "Vision Communication": "Vision",
  "Creative Confidence & Persistence": "Persistence",
  "Meta-Creative Thinking": "Meta-Creative",
};

function getShortLabel(category: string): string {
  return SHORT_LABELS[category] ?? category;
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
}: IntelligenceRadarSlideProps) {
  const accentColor = ACCENT_COLOR[variant];

  const categoryNames = data.categories.map((c) => getShortLabel(c.category));
  const studentScores = data.categories.map((c) => c.score);

  // Build corpus scores aligned to the same category order
  const corpusScores = data.corpusAverage
    ? data.categories.map((cat) => {
        const match = data.corpusAverage!.categories.find(
          (c) => c.category === cat.category
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
          {eyebrow}
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
          {title}
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
            accentColor={accentColor}
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
              style={{ backgroundColor: accentColor }}
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
