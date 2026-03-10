"use client";

import { motion } from "motion/react";

interface ReasoningHighlightsSlideProps {
  data: {
    highlights: {
      category: string;
      tagline: string;
      variant: "pi" | "ci";
    }[];
  };
}

const ACCENT_COLOR: Record<"pi" | "ci", string> = {
  pi: "#4da3ff",
  ci: "#e9b949",
};

export function ReasoningHighlightsSlide({
  data,
}: ReasoningHighlightsSlideProps) {
  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] mb-12 text-center"
          style={{ color: "#9aa0ac" }}
        >
          Your Strengths
        </motion.p>

        <div className="flex flex-col gap-10">
          {data.highlights.map((highlight, i) => {
            const accent = ACCENT_COLOR[highlight.variant];
            return (
              <motion.div
                key={`${highlight.category}-${i}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.5 + i * 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col gap-2"
              >
                <span
                  className="text-xs uppercase tracking-[0.2em] font-semibold"
                  style={{ color: accent }}
                >
                  {highlight.category}
                </span>
                <p
                  className="text-xl font-semibold leading-snug"
                  style={{
                    color: "#f5f6fa",
                    fontFamily: "'Inter Tight', Inter, sans-serif",
                  }}
                >
                  {highlight.tagline}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
