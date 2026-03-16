"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ResultsPageData, CategoryScore } from "@/lib/schemas/results";
import { PI_TEMPLATES, CI_TEMPLATES } from "@/lib/assessment/narrative-templates";

import { ResultsSplashScreen } from "./ResultsSplashScreen";
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
import { useSwipeNavigation } from "@/lib/hooks/use-swipe-navigation";
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
  const [isDesktop, setIsDesktop] = useState(false);

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

// ---------------------------------------------------------------------------
// Nav arrow button
// ---------------------------------------------------------------------------

type NavArrowProps = {
  direction: "forward" | "back";
  onClick: () => void;
  isDesktop: boolean;
  /** Prominent glassmorphism style with infinite bounce */
  prominent?: boolean;
};

function NavArrow({ direction, onClick, isDesktop, prominent }: NavArrowProps) {
  const isForward = direction === "forward";

  // Mobile: left/right edges. Desktop: top/bottom center, tight to edge.
  const position = isForward
    ? "right-2 top-[85%] -translate-y-1/2 md:right-auto md:top-auto md:translate-y-0 md:bottom-3 md:left-1/2 md:-translate-x-1/2"
    : "left-2 top-[85%] -translate-y-1/2 md:top-3 md:translate-y-0 md:left-1/2 md:-translate-x-1/2";

  const label = isForward ? "Next section" : "Previous section";

  const baseStyle = prominent
    ? "h-11 w-11 rounded-full border border-white/15 bg-white/10 backdrop-blur-md text-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:bg-white/20 hover:text-white/90"
    : "h-10 w-10 rounded-full border border-white/8 bg-white/5 backdrop-blur-md text-white/40 shadow-[0_2px_12px_rgba(0,0,0,0.2)] hover:bg-white/10 hover:text-white/60";

  // Bounce: vertical on desktop, horizontal on mobile
  const bounceAxis = isDesktop ? "y" : "x";
  const bounceDir = isForward ? 1 : -1;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute z-10 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-full ${baseStyle} ${position}`}
      animate={
        prominent
          ? { [bounceAxis]: [0, 6 * bounceDir, 0] }
          : undefined
      }
      transition={
        prominent
          ? {
              delay: 2,
              duration: 1.2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.8,
            }
          : undefined
      }
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
        <path
          d="M7.5 4L13.5 10L7.5 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
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
  const [splashComplete, setSplashComplete] = useState(false);
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

  const handleSplashComplete = useCallback(() => {
    setSplashComplete(true);
  }, []);

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
        eyebrow="PRACTICAL INTELLIGENCE"
        variant="pi"
        hideCorpus
      />,

      // 4. Creative Intelligence Radar
      <IntelligenceRadarSlide
        key="ci-radar"
        data={{ radar: data.ciRadar }}
        title="Your Thinking Profile"
        eyebrow="CREATIVE INTELLIGENCE"
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

    // 13. Share / Apply CTA
    s.push(
      <ShareApplySlide
        key="share"
        data={data}
      />,
    );

    return s;
  }, [data, splashComplete]);

  const isFirst = currentSection === 0;
  const isLast = currentSection === sections.length - 1;

  // Track whether user has navigated — skip enter animation on first mount
  // to avoid axis-flip bug (isDesktop SSR mismatch causes stuck translateX)
  const hasNavigated = useRef(false);

  const goNext = useCallback(() => {
    hasNavigated.current = true;
    setCurrentSection((prev) => {
      if (prev >= sections.length - 1) return prev;
      setDirection(1);
      return prev + 1;
    });
  }, [sections.length]);

  const goPrev = useCallback(() => {
    hasNavigated.current = true;
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
      {!splashComplete && (
        <ResultsSplashScreen onComplete={handleSplashComplete} />
      )}

      <motion.main
        ref={swipeRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: splashComplete ? 1 : 0 }}
        transition={reducedMotion ? { duration: 0.15 } : { duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-[100svh] overflow-hidden bg-bg-base touch-manipulation"
      >
        {/* Progress indicator */}
        <div className="absolute right-4 top-4 z-10 text-xs text-text-secondary md:bottom-4 md:left-4 md:right-auto md:top-auto">
          {currentSection + 1}&thinsp;/&thinsp;{sections.length}
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
              initial={hasNavigated.current ? "enter" : false}
              animate="center"
              exit="exit"
              transition={transition}
              className="h-full overflow-y-auto md:overflow-hidden overscroll-contain scrollbar-hide"
            >
              {sections[currentSection]}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Mobile scroll indicators */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 right-0 z-10 h-px transition-opacity duration-300 md:hidden"
          style={{
            opacity: canScrollUp ? 1 : 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-px transition-opacity duration-300 md:hidden"
          style={{
            opacity: canScrollDown ? 1 : 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
          }}
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
