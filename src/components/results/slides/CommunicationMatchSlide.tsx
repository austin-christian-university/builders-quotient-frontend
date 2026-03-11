"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { NarrativeMatch } from "@/lib/schemas/results";
import { NarrativeMatchCard } from "@/components/results/NarrativeMatchCard";

interface CommunicationMatchSlideProps {
  data: NarrativeMatch | null;
}

const ACCENT = "#2dd4bf";

export function CommunicationMatchSlide({ data }: CommunicationMatchSlideProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allMatches = data ? [data.primary, ...data.runnersUp] : [];
  const activeMatch = allMatches[activeIndex] ?? null;
  const isPrimary = activeIndex === 0;

  const handlePillClick = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      setActiveIndex(index);
      scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    },
    [activeIndex]
  );

  // Null state
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
          <p className="mb-3 text-xs uppercase tracking-[0.3em]" style={{ color: "#9aa0ac" }}>
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
            We&rsquo;re building communication-based entrepreneur matching. Check back soon.
          </p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="h-full flex flex-col px-6 py-8">
      {/* Fixed top: Eyebrow + Header */}
      <div className="shrink-0 text-center mb-4">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] mb-2"
          style={{ color: "#9aa0ac" }}
        >
          Communication Match
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl font-semibold sm:text-2xl"
          style={{
            color: "#f5f6fa",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          {isPrimary
            ? "Your communication style most resembles"
            : "You also communicate like"}
        </motion.h2>
      </div>

      {/* Scrollable middle: Narrative card */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="max-w-2xl mx-auto pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMatch?.entrepreneurId ?? "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {activeMatch && (
                <NarrativeMatchCard
                  data={activeMatch}
                  accentColor={ACCENT}
                  domainLabel="Communication Style"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed bottom: Match pills */}
      {allMatches.length > 1 && (
        <div className="shrink-0 pt-4">
          <div className="flex justify-center gap-2 flex-wrap">
            {allMatches.map((match, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={match.entrepreneurId}
                  type="button"
                  onClick={() => handlePillClick(i)}
                  className="rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
                  style={
                    {
                      borderColor: isActive ? `${ACCENT}80` : "rgba(255,255,255,0.12)",
                      backgroundColor: isActive
                        ? `${ACCENT}20`
                        : "rgba(255,255,255,0.05)",
                      color: isActive ? "#fff" : "#9aa0ac",
                      boxShadow: isActive ? `0 0 12px ${ACCENT}30` : "none",
                      "--tw-ring-color": ACCENT,
                    } as React.CSSProperties
                  }
                  aria-label={`View ${match.entrepreneurName}`}
                  aria-pressed={isActive}
                >
                  {match.entrepreneurName}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
