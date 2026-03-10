"use client";

import { motion } from "motion/react";
import type { NarrativeBlock } from "@/lib/schemas/results";

interface CommunicationNarrativeSlideProps {
  data: {
    narrative: NarrativeBlock[];
  };
}

const ACCENT_COLOR = "#2dd4bf";
const ACCENT_COLOR_MUTED = "rgba(45,212,191,0.7)";

export function CommunicationNarrativeSlide({
  data,
}: CommunicationNarrativeSlideProps) {
  const strengths = data.narrative.filter((b) => b.type === "strength");
  const growthAreas = data.narrative.filter((b) => b.type === "growth");

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-4xl mx-auto">
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
          className="text-2xl font-semibold text-center mb-12"
          style={{
            color: "#f5f6fa",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          Strengths &amp; Growth Areas
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strengths column */}
          <div className="flex flex-col gap-6">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: ACCENT_COLOR }}
            >
              Strengths
            </motion.h3>

            {strengths.map((block, i) => (
              <motion.div
                key={`strength-${block.category}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + i * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-2xl border p-5 flex flex-col gap-2"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <span
                  className="text-xs uppercase tracking-[0.2em] font-semibold"
                  style={{ color: ACCENT_COLOR }}
                >
                  {block.category}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "#f5f6fa" }}>
                  {block.text}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Growth Areas column */}
          <div className="flex flex-col gap-6">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: ACCENT_COLOR_MUTED }}
            >
              Growth Areas
            </motion.h3>

            {growthAreas.map((block, i) => (
              <motion.div
                key={`growth-${block.category}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.35 + i * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-2xl border p-5 flex flex-col gap-2"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <span
                  className="text-xs uppercase tracking-[0.2em] font-semibold"
                  style={{ color: ACCENT_COLOR_MUTED }}
                >
                  {block.category}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "#f5f6fa" }}>
                  {block.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
