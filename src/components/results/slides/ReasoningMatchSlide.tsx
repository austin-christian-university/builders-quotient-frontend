"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { ReasoningMatch, CategoryScore, MatchRunnerUp } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";
import { getShortLabel } from "@/components/results/short-labels";
import { EntrepreneurCardModal } from "@/components/results/EntrepreneurCardModal";

interface ReasoningMatchSlideProps {
  data: ReasoningMatch | null;
  studentPiCategories: CategoryScore[];
}

const ACCENT_COLOR = "#4da3ff";

// Stagger timing helper
function staggerDelay(index: number, base = 0.3, step = 0.1): number {
  return base + index * step;
}

export function ReasoningMatchSlide({
  data,
  studentPiCategories,
}: ReasoningMatchSlideProps) {
  const [selectedRunnerUp, setSelectedRunnerUp] = useState<MatchRunnerUp | null>(null);

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
            Reasoning Match
          </p>
          <h2
            className="mb-3 text-xl font-semibold"
            style={{
              color: "#f5f6fa",
              fontFamily: "'Inter Tight', Inter, sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            Reasoning match coming soon
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9aa0ac" }}>
            We&rsquo;re building intelligence-based entrepreneur matching. Check back
            soon.
          </p>
        </motion.div>
      </section>
    );
  }

  // --- Build radar data ---
  // Use categories from student scores for ordering
  const categoryNames = data.studentCategoryScores.map((c) =>
    getShortLabel(c.category)
  );
  const studentScores = data.studentCategoryScores.map((c) => c.score);

  // Align entrepreneur scores to the same category order
  const entrepreneurScores = data.studentCategoryScores.map((studentCat) => {
    const match = data.entrepreneurCategoryScores.find(
      (e) => e.category === studentCat.category
    );
    return match?.score ?? 0;
  });

  // Raw category names (not short labels) for the modal
  const rawCategories = data.studentCategoryScores.map((c) => c.category);

  // Student scores keyed by category for modal reuse
  const studentScoresForModal = data.studentCategoryScores.map((c) => ({
    category: c.category,
    score: c.score,
  }));

  return (
    <>
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
            Reasoning Match
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
            Your reasoning most resembles
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

              {/* Dual radar overlay */}
              <div className="w-full max-w-md mx-auto mb-4">
                <RadarChart
                  categories={categoryNames}
                  studentScores={studentScores}
                  corpusScores={entrepreneurScores}
                  accentColor={ACCENT_COLOR}
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

              {/* Shared strengths */}
              {data.topSharedStrengths.length > 0 && (
                <div className="border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <p
                    className="mb-3 text-xs uppercase tracking-[0.25em] font-semibold"
                    style={{ color: ACCENT_COLOR }}
                  >
                    Shared Strengths
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {data.topSharedStrengths.slice(0, 4).map((strength, i) => (
                      <motion.div
                        key={strength.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: staggerDelay(i, 0.6, 0.08),
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="flex items-center justify-between"
                      >
                        <span
                          className="text-sm"
                          style={{ color: "rgba(245,246,250,0.8)" }}
                        >
                          {strength.name}
                        </span>
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: ACCENT_COLOR }}
                        >
                          {Math.round(strength.value)}
                        </span>
                      </motion.div>
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
                Also similar to…
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {data.runnersUp.slice(0, 4).map((runnerUp, i) => (
                  <motion.button
                    key={runnerUp.entrepreneurName}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.35,
                      delay: staggerDelay(i, 0.75, 0.07),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onClick={() => setSelectedRunnerUp(runnerUp)}
                    className="rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                    style={
                      {
                        borderColor: "rgba(255,255,255,0.12)",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: "#f5f6fa",
                        "--tw-ring-color": ACCENT_COLOR,
                      } as React.CSSProperties
                    }
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(255,255,255,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        `${ACCENT_COLOR}60`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(255,255,255,0.12)";
                    }}
                    aria-label={`View details for ${runnerUp.entrepreneurName}`}
                  >
                    {runnerUp.entrepreneurName}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Runner-up modal */}
      {selectedRunnerUp && (
        <EntrepreneurCardModal
          isOpen={selectedRunnerUp !== null}
          onClose={() => setSelectedRunnerUp(null)}
          entrepreneur={selectedRunnerUp}
          studentCategoryScores={studentScoresForModal}
          accentColor={ACCENT_COLOR}
          categories={rawCategories}
        />
      )}
    </>
  );
}
