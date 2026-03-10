"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ResultsPageData, CategoryScore } from "@/lib/schemas/results";
import { PI_TEMPLATES, CI_TEMPLATES } from "@/lib/assessment/narrative-templates";

import { ArchetypeSlide } from "./slides/ArchetypeSlide";
import { ReasoningHighlightsSlide } from "./slides/ReasoningHighlightsSlide";
import { IntelligenceRadarSlide } from "./slides/IntelligenceRadarSlide";
import { IntelligenceNarrativeSlide } from "./slides/IntelligenceNarrativeSlide";
import { ReasoningMatchSlide } from "./slides/ReasoningMatchSlide";
import { CommunicationRadarSlide } from "./slides/CommunicationRadarSlide";
import { CommunicationNarrativeSlide } from "./slides/CommunicationNarrativeSlide";
import { CommunicationMatchSlide } from "./slides/CommunicationMatchSlide";
import { PersonalityRadarSlide } from "./slides/PersonalityRadarSlide";
import { PersonalityNarrativeSlide } from "./slides/PersonalityNarrativeSlide";
import { DisclaimerSlide } from "./slides/DisclaimerSlide";
import { ShareApplySlide } from "./slides/ShareApplySlide";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import * as analytics from "@/lib/analytics/events";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract first sentence from template text for use as a punchy tagline */
function truncateToFirstSentence(text: string): string {
  const match = text.match(/^[^.!]+[.!]/);
  return match ? match[0] : text;
}

function buildHighlights(
  piCategories: CategoryScore[],
  ciCategories: CategoryScore[]
): { category: string; tagline: string; variant: "pi" | "ci" }[] {
  const combined = [
    ...piCategories.map((c) => ({ ...c, variant: "pi" as const })),
    ...ciCategories.map((c) => ({ ...c, variant: "ci" as const })),
  ];
  combined.sort((a, b) => b.score - a.score);
  return combined.slice(0, 4).map((c) => ({
    category: c.category,
    tagline: truncateToFirstSentence(
      PI_TEMPLATES[c.category]?.strength ?? CI_TEMPLATES[c.category]?.strength ?? ""
    ),
    variant: c.variant,
  }));
}

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

  // Analytics: track results viewed
  useEffect(() => {
    analytics.resultsViewed();
  }, []);

  const sections = useMemo(() => {
    const s: React.ReactNode[] = [
      // 1. Archetype Reveal
      <ArchetypeSlide key="archetype" data={data.archetype} />,

      // 2. Reasoning Highlights
      <ReasoningHighlightsSlide
        key="highlights"
        data={{ highlights: buildHighlights(data.piCategories, data.ciCategories) }}
      />,

      // 3. Practical Intelligence Radar
      <IntelligenceRadarSlide
        key="pi-radar"
        data={{ categories: data.piCategories, corpusAverage: data.piCorpusAverage }}
        title="Your Reasoning Profile"
        eyebrow="PRACTICAL INTELLIGENCE"
        variant="pi"
      />,

      // 4. Creative Intelligence Radar
      <IntelligenceRadarSlide
        key="ci-radar"
        data={{ categories: data.ciCategories, corpusAverage: data.ciCorpusAverage }}
        title="Your Thinking Profile"
        eyebrow="CREATIVE INTELLIGENCE"
        variant="ci"
      />,

      // 5. Intelligence Strengths & Growth Areas
      <IntelligenceNarrativeSlide
        key="intel-narrative"
        data={{ narrative: data.intelligenceNarrative }}
      />,

      // 6. Reasoning Match (stubbed if null)
      <ReasoningMatchSlide
        key="reasoning-match"
        data={data.reasoningMatch}
        studentPiCategories={data.piCategories}
      />,
    ];

    // 7-9. Communication domain (conditional — if profile data exists)
    if (data.communicationProfile) {
      s.push(
        <CommunicationRadarSlide
          key="comm-radar"
          data={{
            profile: data.communicationProfile,
            corpusAverage: data.communicationCorpusAverage,
          }}
        />,
        <CommunicationNarrativeSlide
          key="comm-narrative"
          data={{ narrative: data.communicationNarrative }}
        />,
      );

      if (data.communicationMatch) {
        s.push(
          <CommunicationMatchSlide
            key="comm-match"
            data={data.communicationMatch}
            studentProfile={data.communicationMatch.studentProfile}
          />,
        );
      }
    }

    // 10-11. Personality domain (conditional — admissions only)
    if (data.personality) {
      s.push(
        <PersonalityRadarSlide key="personality-radar" data={data.personality} />,
        <PersonalityNarrativeSlide
          key="personality-narrative"
          data={{ narrative: data.personalityNarrative }}
        />,
      );
    }

    // 12. Disclaimer
    s.push(<DisclaimerSlide key="disclaimer" />);

    // 13. Share / Apply CTA
    s.push(
      <ShareApplySlide
        key="share"
        archetype={data.archetype}
        assessmentType={data.applicant.assessmentType}
      />,
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
