"use client";

import { motion } from "motion/react";
import type { CommunicationMatch } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";
import {
  PERSONALITY_DIMENSION_NAMES,
  PERSONALITY_DIMENSION_CATEGORIES,
} from "@/lib/assessment/personality-dimensions";

interface CommunicationMatchSlideProps {
  data: CommunicationMatch | null;
  studentProfile: { category: string; value: number }[];
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

// Stagger timing helper
function staggerDelay(index: number, base = 0.3, step = 0.1): number {
  return base + index * step;
}

export function CommunicationMatchSlide({
  data,
  studentProfile,
}: CommunicationMatchSlideProps) {
  // --- Null / placeholder state ---
  if (!data) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          <p
            className="mb-3 text-xs uppercase tracking-[0.3em]"
            style={{ color: "#9aa0ac" }}
          >
            Communication Match
          </p>
          <h2
            className="mb-3 text-xl font-semibold"
            style={{
              color: "#f5f6fa",
              fontFamily: "'Inter Tight', Inter, sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            Communication match coming soon
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9aa0ac" }}>
            We&rsquo;re building communication-based entrepreneur matching. Check back
            soon.
          </p>
        </motion.div>
      </section>
    );
  }

  // --- Build radar data from full 20-dim profiles ---
  const radarSource = data.studentProfile.length > 0 ? data.studentProfile : studentProfile;

  // Build an index map: pv_key -> position in the profile array
  const keyToIndex = new Map(radarSource.map((p, i) => [p.category, i]));

  const categoryNames = radarSource.map((p) => p.category);
  const studentScores = radarSource.map((p) => p.value * 100);
  const tooltipLabels = radarSource.map(
    (p) => PERSONALITY_DIMENSION_NAMES[p.category] ?? p.category
  );

  // Align entrepreneur profile scores to the same category order
  const entrepreneurScores = radarSource.map((studentCat) => {
    const match = data.entrepreneurProfile.find(
      (e) => e.category === studentCat.category
    );
    return (match?.value ?? 0) * 100;
  });

  // Build sector groups from the 5 meta-categories
  const sectorGroups = Object.entries(PERSONALITY_DIMENSION_CATEGORIES).map(
    ([catName, keys]) => ({
      label: catName,
      color: SECTOR_COLORS[catName] ?? ACCENT_COLOR,
      indices: keys
        .map((k) => keyToIndex.get(k))
        .filter((i): i is number => i !== undefined),
    })
  );

  // Per-dot colors: each dot gets its sector group color
  const dotColors = radarSource.map((p) => {
    for (const [catName, keys] of Object.entries(PERSONALITY_DIMENSION_CATEGORIES)) {
      if (keys.includes(p.category)) {
        return SECTOR_COLORS[catName] ?? ACCENT_COLOR;
      }
    }
    return ACCENT_COLOR;
  });

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl mx-auto">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] mb-3 text-center"
          style={{ color: "#9aa0ac" }}
        >
          Communication Match
        </motion.p>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-semibold text-center mb-2"
          style={{
            color: "#f5f6fa",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          Your communication style most resembles
        </motion.h2>

        {/* Entrepreneur name */}
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-center text-3xl font-bold mb-8"
          style={{ color: "#ffffff" }}
        >
          {data.entrepreneurName}
        </motion.p>

        {/* Main entrepreneur card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl border overflow-hidden mb-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Subtle accent glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at top left, ${ACCENT_COLOR}14 0%, transparent 55%)`,
            }}
          />

          <div className="relative z-10 p-6">
            {/* Bio */}
            {data.bioSnippet && (
              <p
                className="mb-4 text-sm leading-relaxed"
                style={{ color: "rgba(245,246,250,0.7)" }}
              >
                {data.bioSnippet}
              </p>
            )}

            {/* Company pills */}
            {data.companies.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {data.companies.slice(0, 5).map((company) => (
                  <span
                    key={company}
                    className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      borderColor: `${ACCENT_COLOR}40`,
                      backgroundColor: `${ACCENT_COLOR}12`,
                      color: ACCENT_COLOR,
                    }}
                  >
                    {company}
                  </span>
                ))}
              </div>
            )}

            {/* Industry pills */}
            {data.industries.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-1.5">
                {data.industries.slice(0, 4).map((industry) => (
                  <span
                    key={industry}
                    className="rounded-full border px-2.5 py-0.5 text-xs"
                    style={{
                      borderColor: "rgba(255,255,255,0.1)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      color: "#9aa0ac",
                    }}
                  >
                    {industry}
                  </span>
                ))}
              </div>
            )}

            {/* Dual radar overlay — full 20-dim comparison */}
            <div className="w-full max-w-lg mx-auto mb-4">
              <RadarChart
                categories={categoryNames}
                studentScores={studentScores}
                corpusScores={entrepreneurScores}
                accentColor={ACCENT_COLOR}
                sectorGroups={sectorGroups}
                tooltipLabels={tooltipLabels}
                dotColors={dotColors}
              />
            </div>

            {/* Chart legend */}
            <div
              className="flex items-center justify-center gap-5 mb-6"
              aria-label="Chart legend"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: ACCENT_COLOR }}
                  aria-hidden="true"
                />
                <span className="text-xs" style={{ color: "#9aa0ac" }}>
                  Your Profile
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full border"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                  aria-hidden="true"
                />
                <span className="text-xs" style={{ color: "#9aa0ac" }}>
                  {data.entrepreneurName}
                </span>
              </div>
            </div>

            {/* Shared traits */}
            {data.topSharedTraits.length > 0 && (
              <div
                className="border-t pt-5"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <p
                  className="mb-3 text-xs uppercase tracking-[0.25em] font-semibold"
                  style={{ color: ACCENT_COLOR }}
                >
                  Shared Traits
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.topSharedTraits.slice(0, 4).map((trait, i) => (
                    <motion.span
                      key={trait.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.35,
                        delay: staggerDelay(i, 0.6, 0.08),
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="rounded-full border px-3 py-1 text-sm"
                      style={{
                        borderColor: `${ACCENT_COLOR}35`,
                        backgroundColor: `${ACCENT_COLOR}10`,
                        color: "rgba(245,246,250,0.85)",
                      }}
                    >
                      {trait.name}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Runner-up pills */}
        {data.runnersUp.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="mb-3 text-xs uppercase tracking-[0.3em] text-center"
              style={{ color: "#9aa0ac" }}
            >
              Also similar to&hellip;
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {data.runnersUp.slice(0, 4).map((runnerUp, i) => (
                <motion.span
                  key={runnerUp.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.35,
                    delay: staggerDelay(i, 0.75, 0.07),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="rounded-full border px-4 py-2 text-sm font-medium"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    color: "#f5f6fa",
                  }}
                >
                  {runnerUp.name}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
