"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import type { NarrativeBlock } from "@/lib/schemas/results";

interface IntelligenceNarrativeSlideProps {
  data: {
    narrative: NarrativeBlock[];
  };
}

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Shared Swiss Ink layout for the three "Strengths & Growth Areas" slides:
 * a ruled two-column sheet, strengths marked with the one vermilion square.
 */
export function NarrativeSheet({
  label,
  narrative,
}: {
  label: string;
  narrative: NarrativeBlock[];
}) {
  const strengths = narrative.filter((b) => b.type === "strength");
  const growthAreas = narrative.filter((b) => b.type === "growth");

  // Limit cards so content fits within the viewport on desktop
  // (nav arrows occupy top/bottom zones on md+)
  const maxCards = 2;
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

  const columns = [
    { key: "strength", title: "Strengths", blocks: visibleStrengths, marker: "bg-vermilion", delay: 0.3 },
    {
      key: "growth",
      title: "Growth Areas",
      blocks: visibleGrowth,
      marker: "bg-[#8c8a84]",
      delay: 0.45 + visibleStrengths.length * 0.25,
    },
  ];

  return (
    <section className="h-full flex flex-col overflow-hidden px-5 py-14 md:px-10 md:py-16">
      {/* Fixed top: label + title */}
      <div className="shrink-0 w-full max-w-5xl mx-auto mb-5 md:mb-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="border-t border-ink pt-3 text-sm text-[#8c8a84]"
        >
          {label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="mt-3 font-display text-[clamp(30px,4.6vw,56px)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink"
        >
          Strengths &amp; Growth Areas
        </motion.h2>
      </div>

      {/* Scrollable middle */}
      <div className="relative flex-1 min-h-0">
        {/* Scroll indicator — top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-10 h-px w-full max-w-5xl bg-ink transition-opacity duration-300"
          style={{ opacity: canScrollUp ? 1 : 0 }}
        />

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-hide"
          style={{ overscrollBehavior: "contain" }}
        >
          <div className="w-full max-w-5xl mx-auto pb-4">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
              {columns.map((col) => (
                <div key={col.key} className="flex flex-col">
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: col.delay }}
                    className="flex items-center gap-2 border-t-2 border-ink pt-3 pb-1 text-sm font-semibold text-ink"
                  >
                    <span aria-hidden="true" className={`inline-block h-2 w-2 ${col.marker}`} />
                    {col.title}
                  </motion.h3>

                  {col.blocks.map((block, i) => (
                    <motion.div
                      key={`${col.key}-${block.category}-${i}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: col.delay + 0.15 + i * 0.25, ease }}
                      className="flex flex-col gap-1.5 border-b border-ink py-4 md:py-5"
                    >
                      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                        {block.category}
                      </span>
                      <p className="text-[15px] leading-[1.55] text-[#3d3c39]">
                        {block.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator — bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-10 h-px w-full max-w-5xl bg-ink transition-opacity duration-300"
          style={{ opacity: canScrollDown ? 1 : 0 }}
        />
      </div>
    </section>
  );
}

export function IntelligenceNarrativeSlide({
  data,
}: IntelligenceNarrativeSlideProps) {
  return <NarrativeSheet label="Your Intelligence Profile" narrative={data.narrative} />;
}
