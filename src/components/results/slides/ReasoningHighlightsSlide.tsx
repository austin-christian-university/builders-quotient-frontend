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
  pi: "#e8452c",
  ci: "#111111",
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
    <section className="h-full flex flex-col overflow-hidden px-5 py-14 md:px-10 md:py-16">
      {/* Fixed top: label */}
      <div className="shrink-0 w-full max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="border-t-2 border-ink pt-3 pb-1 text-sm font-semibold text-ink"
        >
          Your Strengths
        </motion.p>
      </div>

      {/* Scrollable middle */}
      <div className="relative flex-1 min-h-0">
        {/* Scroll indicator — top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-10 h-px w-full max-w-4xl bg-ink transition-opacity duration-300"
          style={{ opacity: canScrollUp ? 1 : 0 }}
        />

        <div
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-hide"
          style={{ overscrollBehavior: "contain" }}
        >
          <ol className="w-full max-w-4xl mx-auto pb-2">
            {data.highlights.map((highlight, i) => {
              const accent = ACCENT_COLOR[highlight.variant];
              return (
                <motion.li
                  key={`${highlight.category}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3 + i * 0.25,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="grid grid-cols-[auto_1fr] gap-x-3 border-t border-ink py-5 first:border-t-0 md:grid-cols-[2.5rem_14rem_1fr] md:gap-x-6 md:py-6"
                >
                  <span className="text-sm font-semibold tabular-nums text-ink md:pt-1.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-[#6b6963] md:items-start md:pt-1.5">
                    <span
                      aria-hidden="true"
                      className="mt-0 inline-block h-2 w-2 shrink-0 md:mt-1.5"
                      style={{ backgroundColor: accent }}
                    />
                    {highlight.category}
                  </span>
                  <p className="col-span-2 mt-2 font-display text-[clamp(22px,2.6vw,32px)] font-semibold leading-[1.1] tracking-[-0.035em] text-ink md:col-span-1 md:mt-0">
                    {highlight.tagline}
                  </p>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* Scroll indicator — bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-10 h-px w-full max-w-4xl bg-ink transition-opacity duration-300"
          style={{ opacity: canScrollDown ? 1 : 0 }}
        />
      </div>

      {/* Fixed bottom: Key */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 + data.highlights.length * 0.25 + 0.2 }}
        className="shrink-0 w-full max-w-4xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink pt-3"
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block w-2 h-2"
            style={{ backgroundColor: ACCENT_COLOR.pi }}
          />
          <span className="text-[13px] text-[#6b6963]">
            Practical Intelligence
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block w-2 h-2"
            style={{ backgroundColor: ACCENT_COLOR.ci }}
          />
          <span className="text-[13px] text-[#6b6963]">
            Creative Intelligence
          </span>
        </div>
      </motion.div>
    </section>
  );
}
