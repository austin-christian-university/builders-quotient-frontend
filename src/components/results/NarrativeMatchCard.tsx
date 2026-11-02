"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { EntrepreneurNarrative, NarrativeMatch } from "@/lib/schemas/results";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// The match card: a Swiss Ink "profile sheet" — 2px ink frame, hairline rows,
// big Inter Tight name, small grey labels. `accentColor` colours only the one
// key label (the domain style) so each slide keeps a single highlight.
// ---------------------------------------------------------------------------

interface NarrativeMatchCardProps {
  data: EntrepreneurNarrative;
  accentColor: string;
  domainLabel: string;
}

function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className={cn("mb-2 text-sm", color ? "font-semibold" : "text-[#8c8a84]")}
      style={color ? { color } : undefined}
    >
      {children}
    </p>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-ink px-5 py-5 sm:px-6">{children}</div>;
}

export function NarrativeMatchCard({ data, accentColor, domainLabel }: NarrativeMatchCardProps) {
  const bio = data.bioNarrative ?? data.fallbackBioSnippet;
  const companies = data.companies.slice(0, 5);
  const industries = data.industries.slice(0, 4);

  return (
    <article className="border-2 border-ink bg-[#fbfaf6] text-ink">
      {/* Name block */}
      <div className="px-5 pt-6 pb-6 sm:px-6 sm:pt-8">
        <h3 className="text-[clamp(32px,6vw,52px)] font-semibold leading-[0.95] tracking-[-0.045em]">
          {data.entrepreneurName}
        </h3>
        {companies.length > 0 && (
          <p className="mt-3 text-[15px] text-[#3d3c39]">{companies.join(" · ")}</p>
        )}
        {industries.length > 0 && (
          <p className="mt-1 text-sm text-[#8c8a84]">{industries.join(" · ")}</p>
        )}
      </div>

      {bio && (
        <Row>
          <p className="text-[15px] leading-[1.55] text-[#3d3c39]">{bio}</p>
        </Row>
      )}

      {data.domainStyle && (
        <Row>
          <Label color={accentColor}>{domainLabel}</Label>
          <p className="text-[15px] leading-[1.55] text-[#3d3c39]">{data.domainStyle}</p>
        </Row>
      )}

      {data.signatureMoves.length > 0 && (
        <Row>
          <Label>Signature Moves</Label>
          <ul>
            {data.signatureMoves.slice(0, 3).map((move) => (
              <li
                key={move.title}
                className="border-t border-border py-3 text-[15px] leading-[1.5] text-[#3d3c39] first:border-t-0 first:pt-0 last:pb-0"
              >
                <strong className="font-semibold text-ink">{move.title}</strong>
                {" — "}
                {move.description}
              </li>
            ))}
          </ul>
        </Row>
      )}

      {(data.strengths || data.blindspots) && (
        <div className="grid grid-cols-1 border-t border-ink sm:grid-cols-2">
          {data.strengths && (
            <div className="px-5 py-5 sm:px-6">
              <Label>Strengths</Label>
              <p className="text-[15px] leading-[1.55] text-[#3d3c39]">{data.strengths}</p>
            </div>
          )}
          {data.blindspots && (
            <div
              className={cn(
                "px-5 py-5 sm:px-6",
                data.strengths && "border-t border-ink sm:border-t-0 sm:border-l",
              )}
            >
              <Label>Blindspots</Label>
              <p className="text-[15px] leading-[1.55] text-[#3d3c39]">{data.blindspots}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Shared slide shell for the Reasoning and Communication match slides.
// ---------------------------------------------------------------------------

interface MatchSlideProps {
  data: NarrativeMatch | null;
  accentColor: string;
  label: string;
  domainLabel: string;
  primaryHeading: string;
  runnerUpHeading: string;
  emptyHeading: string;
  emptyBody: React.ReactNode;
}

export function MatchSlide({
  data,
  accentColor,
  label,
  domainLabel,
  primaryHeading,
  runnerUpHeading,
  emptyHeading,
  emptyBody,
}: MatchSlideProps) {
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
    // Re-check when content changes after animation settles
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
    [activeIndex],
  );

  // Null state
  if (!data) {
    return (
      <section className="flex h-full items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md border-2 border-ink bg-[#fbfaf6]"
        >
          <p className="border-b border-ink px-6 py-3.5 text-sm font-semibold">{label}</p>
          <div className="px-6 pt-6 pb-7">
            <h2 className="text-[28px] font-semibold leading-[1.02] tracking-[-0.04em]">{emptyHeading}</h2>
            <p className="mt-3 text-[15px] leading-[1.5] text-text-secondary">{emptyBody}</p>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col overflow-hidden px-5 pt-12 pb-20 md:px-8 md:pt-16 md:pb-16">
      {/* Fixed top: label + heading */}
      <div className="mx-auto mb-5 w-full max-w-2xl shrink-0">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-2 text-sm text-[#8c8a84]"
        >
          {label}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-[clamp(26px,4vw,40px)] font-semibold leading-[1] tracking-[-0.045em] text-ink"
        >
          {isPrimary ? primaryHeading : runnerUpHeading}
        </motion.h2>
      </div>

      {/* Scrollable middle: the sheet */}
      <div className="relative mx-auto min-h-0 w-full max-w-2xl flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-ink transition-opacity duration-200"
          style={{ opacity: canScrollUp ? 1 : 0 }}
        />

        <div ref={scrollRef} className="h-full overflow-y-auto scrollbar-hide" style={{ overscrollBehavior: "contain" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMatch?.entrepreneurId ?? "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeMatch && (
                <NarrativeMatchCard data={activeMatch} accentColor={accentColor} domainLabel={domainLabel} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-ink transition-opacity duration-200"
          style={{ opacity: canScrollDown ? 1 : 0 }}
        />
      </div>

      {/* Fixed bottom: match tabs */}
      {allMatches.length > 1 && (
        <div className="mx-auto w-full max-w-2xl shrink-0 pt-4">
          <div className="flex flex-wrap gap-2">
            {allMatches.map((match, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={match.entrepreneurId}
                  type="button"
                  onClick={() => handlePillClick(i)}
                  className={cn(
                    "min-h-10 border border-ink px-3.5 text-sm font-semibold transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
                    isActive ? "bg-ink text-paper" : "bg-transparent text-ink hover:bg-ink/5",
                  )}
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
