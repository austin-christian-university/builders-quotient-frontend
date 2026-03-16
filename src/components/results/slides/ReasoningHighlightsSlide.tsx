"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
      {/* Fixed top: Eyebrow */}
      <div className="shrink-0 text-center mb-4">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: "#9aa0ac" }}
        >
          Your Strengths
        </motion.p>
      </div>

      {/* Scrollable middle */}
      <div className="relative flex-1 min-h-0">
        {/* Scroll indicator — top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-10 h-px w-full max-w-3xl transition-opacity duration-300"
          style={{
            opacity: canScrollUp ? 1 : 0,
            background: `linear-gradient(90deg, transparent 0%, ${ACCENT_COLOR.pi}90 50%, transparent 100%)`,
          }}
        />

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-hide"
          style={{ overscrollBehavior: "contain" }}
        >
          <div className="w-full max-w-3xl mx-auto">
            <div className="flex flex-col gap-10 pb-8">
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
        </div>

        {/* Scroll indicator — bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-10 h-px w-full max-w-3xl transition-opacity duration-300"
          style={{
            opacity: canScrollDown ? 1 : 0,
            background: `linear-gradient(90deg, transparent 0%, ${ACCENT_COLOR.pi}90 50%, transparent 100%)`,
          }}
        />
      </div>

      {/* Fixed bottom: Key */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 + data.highlights.length * 0.4 + 0.3 }}
        className="shrink-0 flex items-center justify-center gap-6 pt-6 pb-6 md:pb-8"
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: ACCENT_COLOR.pi }}
          />
          <span className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "#6b7080" }}>
            Practical Intelligence
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: ACCENT_COLOR.ci }}
          />
          <span className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "#6b7080" }}>
            Creative Intelligence
          </span>
        </div>
      </motion.div>
    </section>
  );
}
