"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ResultsPageData } from "@/lib/schemas/results";

import { RevealSlide } from "./slides/RevealSlide";
import { ArchetypeSlide } from "./slides/ArchetypeSlide";
import { IntelligenceSlide } from "./slides/IntelligenceSlide";
import { HighlightSlide } from "./slides/HighlightSlide";
import { PersonalitySlide } from "./slides/PersonalitySlide";
import { RadarSlide } from "./slides/RadarSlide";
import { StatsSlide } from "./slides/StatsSlide";
import { ShareSlide } from "./slides/ShareSlide";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

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
    function onChange(e: MediaQueryListEvent) {
      setIsDesktop(e.matches);
    }
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
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

  // Build components array based on data presence
  const sections = useMemo(() => {
    const s: React.ReactNode[] = [
      <RevealSlide
        key="reveal"
        data={{
          displayName: data.applicant.displayName,
          bqPercentile: data.overall.bqPercentile,
        }}
      />,
      <ArchetypeSlide key="archetype" data={data.archetype} />,
      <IntelligenceSlide
        key="pi"
        title="Practical Intelligence"
        variant="pi"
        data={{
          headline: data.overall.piHeadlinePercentile,
          categories: data.piCategories,
        }}
      />,
      <IntelligenceSlide
        key="ci"
        title="Creative Intelligence"
        variant="ci"
        data={{
          headline: data.overall.ciHeadlinePercentile,
          categories: data.ciCategories,
        }}
      />,
    ];

    if (data.personality) {
      s.push(<PersonalitySlide key="personality" data={data.personality} />);
    }

    if (data.signatureMoves.length > 0) {
      s.push(
        <HighlightSlide
          key="signatureMoves"
          data={{ title: "Your Signature Moves", items: data.signatureMoves }}
        />
      );
    }

    if (data.rarestMove) {
      s.push(
        <HighlightSlide
          key="rarestMove"
          data={{ title: "The Rarest Thing You Did", items: [data.rarestMove] }}
        />
      );
    }

    s.push(
      <RadarSlide
        key="radar"
        data={{
          pi: data.piCategories.map((c) => ({
            category: c.category,
            percentile: c.percentile,
          })),
          ci: data.ciCategories.map((c) => ({
            category: c.category,
            percentile: c.percentile,
          })),
        }}
      />,
      <StatsSlide key="stats" data={data.stats} />,
      <ShareSlide
        key="share"
        data={{
          displayName: data.applicant.displayName,
          bqPercentile: data.overall.bqPercentile,
          archetype: data.archetype.name,
        }}
      />
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

  return (
    <main className="relative h-[100svh] overflow-hidden bg-bg-base">
      {/* Progress indicator */}
      <div className="absolute right-4 top-4 z-10 text-xs text-text-secondary md:bottom-4 md:left-4 md:right-auto md:top-auto">
        {currentSection + 1}&thinsp;/&thinsp;{sections.length}
      </div>

      {/* Section content */}
      {reducedMotion ? (
        <div className="h-full" key={currentSection}>
          {sections[currentSection]}
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
            {sections[currentSection]}
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
