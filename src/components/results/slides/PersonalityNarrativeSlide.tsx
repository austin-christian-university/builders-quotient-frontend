"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import type { NarrativeBlock } from "@/lib/schemas/results";

interface PersonalityNarrativeSlideProps {
  data: {
    narrative: NarrativeBlock[];
  };
}

const ACCENT = "#a78bfa";
const ACCENT_MUTED = "rgba(167,139,250,0.7)";

export function PersonalityNarrativeSlide({
  data,
}: PersonalityNarrativeSlideProps) {
  const strengths = data.narrative.filter((b) => b.type === "strength");
  const growthAreas = data.narrative.filter((b) => b.type === "growth");

  // Limit cards so content fits within the viewport on desktop
  const maxCards = 3;
  const visibleStrengths = strengths.slice(0, maxCards);
  const visibleGrowth = growthAreas.slice(0, maxCards);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollHeight > el.clientHeight + 8;
    setCanScrollDown(overflows && el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    setCanScrollUp(overflows && el.scrollTop > 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const timer = setTimeout(checkScroll, 350);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll]);

  return (
    <section className="h-full flex flex-col overflow-hidden px-6 py-8 md:py-16">
      {/* Fixed top: Eyebrow + Header */}
      <div className="shrink-0 text-center mb-4">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em] mb-2"
          style={{ color: "#9aa0ac" }}
        >
          Entrepreneur Personality
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-semibold"
          style={{
            color: "#f5f6fa",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          Strengths &amp; Growth Areas
        </motion.h2>
      </div>

      {/* Scrollable middle */}
      <div className="relative flex-1 min-h-0">
        {/* Scroll indicator — top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-10 h-px w-full max-w-4xl transition-opacity duration-300"
          style={{
            opacity: canScrollUp ? 1 : 0,
            background: `linear-gradient(90deg, transparent 0%, ${ACCENT}90 50%, transparent 100%)`,
          }}
        />

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto"
          style={{ overscrollBehavior: "contain" }}
        >
          <div className="w-full max-w-4xl mx-auto pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Strengths column */}
              <div className="flex flex-col gap-3">
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-sm font-semibold uppercase tracking-[0.2em]"
                  style={{ color: ACCENT }}
                >
                  Strengths
                </motion.h3>

                {visibleStrengths.map((block, i) => (
                  <motion.div
                    key={`strength-${block.category}-${i}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.3 + i * 0.15,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="rounded-2xl border p-4 flex flex-col gap-1.5"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(167,139,250,0.12)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <span
                      className="text-xs uppercase tracking-[0.2em] font-semibold"
                      style={{ color: ACCENT }}
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
              <div className="flex flex-col gap-3">
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="text-sm font-semibold uppercase tracking-[0.2em]"
                  style={{ color: ACCENT_MUTED }}
                >
                  Growth Areas
                </motion.h3>

                {visibleGrowth.map((block, i) => (
                  <motion.div
                    key={`growth-${block.category}-${i}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.35 + i * 0.15,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="rounded-2xl border p-4 flex flex-col gap-1.5"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(167,139,250,0.08)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <span
                      className="text-xs uppercase tracking-[0.2em] font-semibold"
                      style={{ color: ACCENT_MUTED }}
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
        </div>

        {/* Scroll indicator — bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-10 h-px w-full max-w-4xl transition-opacity duration-300"
          style={{
            opacity: canScrollDown ? 1 : 0,
            background: `linear-gradient(90deg, transparent 0%, ${ACCENT}90 50%, transparent 100%)`,
          }}
        />
      </div>
    </section>
  );
}
