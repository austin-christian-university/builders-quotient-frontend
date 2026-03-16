"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { NarrativeMatch } from "@/lib/schemas/results";
import { NarrativeMatchCard } from "@/components/results/NarrativeMatchCard";

interface ReasoningMatchSlideProps {
  data: NarrativeMatch | null;
}

const ACCENT = "#4da3ff";

export function ReasoningMatchSlide({ data }: ReasoningMatchSlideProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allMatches = data ? [data.primary, ...data.runnersUp] : [];
  const activeMatch = allMatches[activeIndex] ?? null;
  const isPrimary = activeIndex === 0;

  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

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
  }, [checkScroll, activeIndex]);

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
      <section className="h-full flex items-center justify-center px-6">
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
          Reasoning Match
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
          {isPrimary ? "Your reasoning most resembles" : "You also reason like"}
        </motion.h2>
      </div>

      {/* Scrollable middle: Narrative card */}
      <div className="relative flex-1 min-h-0">
        {/* Scroll indicator — top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-10 h-px w-full max-w-2xl transition-opacity duration-300"
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
                    domainLabel="Reasoning Style"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Scroll indicator — bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-full max-w-2xl transition-opacity duration-300"
          style={{
            opacity: canScrollDown ? 1 : 0,
            background: `linear-gradient(90deg, transparent 0%, ${ACCENT}90 50%, transparent 100%)`,
          }}
        />
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
                      borderColor: isActive
                        ? `${ACCENT}80`
                        : "rgba(255,255,255,0.12)",
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
