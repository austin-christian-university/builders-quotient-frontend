"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { PersonalityCTASlide } from "./slides/PersonalityCTASlide";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useSwipeNavigation } from "@/lib/hooks/use-swipe-navigation";
import * as analytics from "@/lib/analytics/events";
import { PERSONALITY_QUIZ_ENABLED } from "@/lib/constants";

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
  // Top 2 from each domain for balanced representation
  const piSorted = [...piCategories].sort((a, b) => b.score - a.score);
  const ciSorted = [...ciCategories].sort((a, b) => b.score - a.score);

  return [
    ...piSorted.slice(0, 2).map((c) => ({
      category: c.category,
      tagline: truncateToFirstSentence(PI_TEMPLATES[c.category]?.strength ?? ""),
      variant: "pi" as const,
    })),
    ...ciSorted.slice(0, 2).map((c) => ({
      category: c.category,
      tagline: truncateToFirstSentence(CI_TEMPLATES[c.category]?.strength ?? ""),
      variant: "ci" as const,
    })),
  ];
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: must read window in effect
    setIsDesktop(mql.matches);
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
  /** Solid ink on the first slide so the way forward is obvious */
  prominent?: boolean;
};

function NavArrow({ direction, onClick, isDesktop, prominent }: NavArrowProps) {
  const isForward = direction === "forward";

  // Mobile: bottom corners. Desktop: top/bottom center, tight to edge.
  const position = isForward
    ? "right-4 bottom-4 md:right-auto md:left-1/2 md:-translate-x-1/2"
    : "left-4 bottom-4 md:bottom-auto md:top-4 md:left-1/2 md:-translate-x-1/2";

  const label = isForward ? "Next section" : "Previous section";

  // Square, ink-hairline, no blur or shadow (Swiss Ink).
  const baseStyle = prominent
    ? "h-11 w-11 border border-ink bg-ink text-paper hover:bg-[#2a2a2a]"
    : "h-11 w-11 border border-ink bg-paper text-ink hover:bg-ink hover:text-paper";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute z-10 flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${baseStyle} ${position}`}
    >
      <svg
        width="16"
        height="16"
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
        <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  data: ResultsPageData;
  token: string;
};

export function ResultsExperience({ data, token }: Props) {
  const isDesktop = useIsDesktop();
  const reducedMotion = usePrefersReducedMotion();
  // The crest splash was removed in the Swiss Ink rebrand; content shows immediately.
  const splashComplete = true;
  const [currentSection, setCurrentSection] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const slideScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkSlideScroll = useCallback(() => {
    const el = slideScrollRef.current;
    if (!el) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }
    const overflows = el.scrollHeight > el.clientHeight + 8;
    setCanScrollUp(overflows && el.scrollTop > 8);
    setCanScrollDown(overflows && el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }, []);

  // Attach scroll listener to current slide container
  useEffect(() => {
    const el = slideScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkSlideScroll, { passive: true });
    // Re-check after animation settles
    const timer = setTimeout(checkSlideScroll, 450);
    return () => {
      el.removeEventListener("scroll", checkSlideScroll);
      clearTimeout(timer);
    };
  }, [checkSlideScroll, currentSection, splashComplete]);

  // Analytics: track results viewed (after splash)
  useEffect(() => {
    if (splashComplete) {
      analytics.resultsViewed();
    }
  }, [splashComplete]);

  const sections = useMemo(() => {
    const s: React.ReactNode[] = [
      // 1. Archetype Reveal — key includes splashComplete so it remounts
      // after the splash exits, replaying its entrance animations visibly
      <ArchetypeSlide key={`archetype-${splashComplete}`} data={data.archetype} />,

      // 2. Reasoning Highlights
      <ReasoningHighlightsSlide
        key="highlights"
        data={{ highlights: buildHighlights(data.piCategories, data.ciCategories) }}
      />,

      // 3. Practical Intelligence Radar
      <IntelligenceRadarSlide
        key="pi-radar"
        data={{ radar: data.piRadar }}
        title="Your Reasoning Profile"
        eyebrow="Practical intelligence"
        variant="pi"
        hideCorpus
      />,

      // 4. Creative Intelligence Radar
      <IntelligenceRadarSlide
        key="ci-radar"
        data={{ radar: data.ciRadar }}
        title="Your Thinking Profile"
        eyebrow="Creative intelligence"
        variant="ci"
        hideCorpus
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

    // 13. Personality CTA (prospective students who haven't taken quiz yet).
    // The quiz is archived; existing personality results above still show.
    const needsPersonality =
      PERSONALITY_QUIZ_ENABLED &&
      data.applicant.leadType === "prospective_student" &&
      !data.applicant.personalityCompleted;

    if (needsPersonality) {
      s.push(<PersonalityCTASlide key="personality-cta" token={token} />);
    }

    // 14. Share / Apply CTA
    s.push(
      <ShareApplySlide
        key="share"
        data={data}
      />,
    );

    return s;
  }, [data, token, splashComplete]);

  const isFirst = currentSection === 0;
  const isLast = currentSection === sections.length - 1;

  // Track whether user has navigated — skip enter animation on first mount
  // to avoid axis-flip bug (isDesktop SSR mismatch causes stuck translateX)
  const [hasNavigated, setHasNavigated] = useState(false);

  const goNext = useCallback(() => {
    setHasNavigated(true);
    setCurrentSection((prev) => {
      if (prev >= sections.length - 1) return prev;
      setDirection(1);
      return prev + 1;
    });
  }, [sections.length]);

  const goPrev = useCallback(() => {
    setHasNavigated(true);
    setCurrentSection((prev) => {
      if (prev <= 0) return prev;
      setDirection(-1);
      return prev - 1;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!splashComplete) return;
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
  }, [goNext, goPrev, splashComplete]);

  // Swipe navigation (mobile only)
  const swipeRef = useSwipeNavigation({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
    enabled: !isDesktop && splashComplete,
  });

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
    <>
      <motion.main
        ref={swipeRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: splashComplete ? 1 : 0 }}
        transition={reducedMotion ? { duration: 0.15 } : { duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-[100svh] overflow-hidden bg-paper text-ink touch-manipulation"
      >
        {/* Progress indicator — counter plus an ink rule that fills as you go */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2.5 text-xs tabular-nums text-text-secondary md:bottom-5 md:left-5 md:right-auto md:top-auto">
          <span>
            <b className="font-semibold text-ink">{String(currentSection + 1).padStart(2, "0")}</b>
            &thinsp;/&thinsp;{String(sections.length).padStart(2, "0")}
          </span>
          <span aria-hidden="true" className="relative hidden h-px w-24 bg-border md:block">
            <span
              className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-300"
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            />
          </span>
        </div>

        {/* Section content */}
        {reducedMotion ? (
          <div
            ref={slideScrollRef}
            className="h-full overflow-y-auto md:overflow-hidden overscroll-contain scrollbar-hide"
            key={currentSection}
          >
            {sections[currentSection]}
          </div>
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              ref={slideScrollRef}
              key={currentSection}
              custom={direction}
              variants={variants}
              initial={hasNavigated ? "enter" : false}
              animate="center"
              exit="exit"
              transition={transition}
              className="h-full overflow-y-auto md:overflow-hidden overscroll-contain scrollbar-hide"
            >
              {sections[currentSection]}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Mobile scroll indicators — ink hairlines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 right-0 z-10 h-px bg-ink transition-opacity duration-200 md:hidden"
          style={{ opacity: canScrollUp ? 1 : 0 }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-px bg-ink transition-opacity duration-200 md:hidden"
          style={{ opacity: canScrollDown ? 1 : 0 }}
        />

        {/* Navigation arrows */}
        {!isFirst && (
          <NavArrow direction="back" onClick={goPrev} isDesktop={isDesktop} />
        )}
        {!isLast && (
          <NavArrow direction="forward" onClick={goNext} isDesktop={isDesktop} prominent={isFirst} />
        )}
      </motion.main>
    </>
  );
}
