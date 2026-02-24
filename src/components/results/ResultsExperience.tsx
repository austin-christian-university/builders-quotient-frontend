"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ResultsPageData } from "@/lib/schemas/results";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false,
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mql.matches);

    function onChange(e: MediaQueryListEvent) {
      setIsDesktop(e.matches);
    }

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    function onChange(e: MediaQueryListEvent) {
      setReduced(e.matches);
    }

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

// ---------------------------------------------------------------------------
// Section placeholder (unchanged)
// ---------------------------------------------------------------------------

type SectionPlaceholderProps = {
  name: string;
  data: unknown;
};

function SectionPlaceholder({ name, data }: SectionPlaceholderProps) {
  return (
    <section className="flex h-full items-center justify-center px-6">
      <div className="text-center">
        <h2 className="font-display text-[length:var(--text-fluid-2xl)] font-semibold text-text-primary">
          {name}
        </h2>
        <pre className="mt-4 max-w-lg overflow-auto text-left text-sm text-text-secondary">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Nav arrow button
// ---------------------------------------------------------------------------

type NavArrowProps = {
  direction: "forward" | "back";
  onClick: () => void;
  isDesktop: boolean;
};

function NavArrow({ direction, onClick, isDesktop }: NavArrowProps) {
  const isForward = direction === "forward";

  // Mobile: left/right edges. Desktop: top/bottom center.
  const position = isForward
    ? "right-4 top-1/2 -translate-y-1/2 md:right-auto md:top-auto md:translate-y-0 md:bottom-8 md:left-1/2 md:-translate-x-1/2"
    : "left-4 top-1/2 -translate-y-1/2 md:top-8 md:translate-y-0 md:left-1/2 md:-translate-x-1/2";

  const label = isForward ? "Next section" : "Previous section";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${position}`}
    >
      {/* Chevron: points right/left on mobile, down/up on desktop via md:rotate-90 */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className={
          isForward
            ? isDesktop
              ? "rotate-90"
              : ""
            : isDesktop
              ? "-rotate-90"
              : "rotate-180"
        }
      >
        <path
          d="M7.5 4L13.5 10L7.5 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  data: ResultsPageData;
};

export function ResultsExperience({ data }: Props) {
  const isDesktop = useIsDesktop();
  const reducedMotion = usePrefersReducedMotion();
  const [currentSection, setCurrentSection] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Build sections array — conditionally exclude empty data sections
  const sections = useMemo(() => {
    const s: { name: string; data: unknown }[] = [
      {
        name: "The Reveal",
        data: {
          displayName: data.applicant.displayName,
          bqPercentile: data.overall.bqPercentile,
        },
      },
      { name: "Your Archetype", data: data.archetype },
      {
        name: "Practical Intelligence",
        data: {
          headline: data.overall.piHeadlinePercentile,
          categories: data.piCategories,
        },
      },
      {
        name: "Creative Intelligence",
        data: {
          headline: data.overall.ciHeadlinePercentile,
          categories: data.ciCategories,
        },
      },
    ];

    if (data.signatureMoves.length > 0) {
      s.push({ name: "Your Signature Moves", data: data.signatureMoves });
    }

    if (data.rarestMove) {
      s.push({ name: "The Rarest Thing You Did", data: data.rarestMove });
    }

    s.push(
      {
        name:
          data.growthEdges.length > 0
            ? "Your Growth Edge"
            : "You Covered All the Bases",
        data:
          data.growthEdges.length > 0
            ? data.growthEdges
            : { message: "No significant gaps detected" },
      },
      {
        name: "You vs. Entrepreneurs",
        data: {
          overall: data.overall,
          piCategories: data.piCategories,
          ciCategories: data.ciCategories,
        },
      },
      {
        name: "Entrepreneur Match",
        data: { status: "Coming in Phase D \u2014 needs Python pipeline" },
      },
      {
        name: "Your Profile Shape",
        data: {
          pi: data.piCategories.map((c) => ({
            category: c.category,
            percentile: c.percentile,
          })),
          ci: data.ciCategories.map((c) => ({
            category: c.category,
            percentile: c.percentile,
          })),
        },
      },
      {
        name: "Industry Alignment",
        data: { status: "Coming in Phase D \u2014 needs matching pipeline" },
      },
      { name: "By the Numbers", data: data.stats },
      { name: "Your Strengths Narrative", data: data.narrative },
      {
        name: "Share Your Results",
        data: {
          displayName: data.applicant.displayName,
          bqPercentile: data.overall.bqPercentile,
          archetype: data.archetype.name,
        },
      },
    );

    return s;
  }, [data]);

  const isFirst = currentSection === 0;
  const isLast = currentSection === sections.length - 1;

  const goNext = useCallback(() => {
    setCurrentSection((prev) => {
      if (prev >= sections.length - 1) return prev;
      setDirection(1);
      return prev + 1;
    });
  }, [sections.length]);

  const goPrev = useCallback(() => {
    setCurrentSection((prev) => {
      if (prev <= 0) return prev;
      setDirection(-1);
      return prev - 1;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture if user is in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Animation variants
  const axis = isDesktop ? "y" : "x";
  const variants = {
    enter: (d: number) => ({
      [axis]: d > 0 ? "50%" : "-50%",
      opacity: 0,
    }),
    center: {
      [axis]: 0,
      opacity: 1,
    },
    exit: (d: number) => ({
      [axis]: d > 0 ? "-50%" : "50%",
      opacity: 0,
    }),
  };

  const transition = {
    duration: 0.4,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  const current = sections[currentSection];

  return (
    <main className="relative h-[100svh] overflow-hidden bg-bg-base">
      {/* Progress indicator */}
      <div className="absolute right-4 top-4 z-10 text-xs text-text-secondary md:bottom-4 md:left-4 md:right-auto md:top-auto">
        {currentSection + 1}&thinsp;/&thinsp;{sections.length}
      </div>

      {/* Section content */}
      {reducedMotion ? (
        <div className="h-full" key={currentSection}>
          <SectionPlaceholder name={current.name} data={current.data} />
        </div>
      ) : (
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSection}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="h-full"
          >
            <SectionPlaceholder name={current.name} data={current.data} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation arrows */}
      {!isFirst && (
        <NavArrow direction="back" onClick={goPrev} isDesktop={isDesktop} />
      )}
      {!isLast && (
        <NavArrow direction="forward" onClick={goNext} isDesktop={isDesktop} />
      )}
    </main>
  );
}
