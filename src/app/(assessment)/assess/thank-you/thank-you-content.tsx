"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { SplashSequence } from "@/components/assessment/SplashSequence";
import { CooldownBanner } from "@/components/assessment/CooldownBanner";
import { ACU_URLS, PERSONALITY_QUIZ_ENABLED } from "@/lib/constants";
import * as analytics from "@/lib/analytics/events";

type Variant = "student" | "general" | "default";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1] as const,
};

const intelligenceLoadingSteps = [
  "Submitting your responses\u2026",
];

// --- Explore card ---

function ExploreCard({
  heading,
  body,
  buttonLabel,
  href,
  external,
}: {
  heading: string;
  body: string;
  buttonLabel: string;
  href: string;
  external?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex h-full flex-col border-t border-ink pt-6"
    >
      <div className="flex flex-grow flex-col">
        <h2 className="font-display text-[clamp(24px,3vw,30px)] font-semibold leading-tight tracking-[-0.035em] text-text-primary">
          {heading}
        </h2>
        <p className="mt-3 text-[length:var(--text-fluid-base)] leading-relaxed text-[#3d3c39]">
          {body}
        </p>
      </div>

      <div className="mt-8">
        <Button
          as="a"
          href={href}
          variant="outline"
          size="md"
          className="w-full sm:w-auto"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {buttonLabel}
        </Button>
      </div>
    </motion.div>
  );
}

// --- Radar chart for personality dimensions ---

const personalityDimensions = [
  { label: "Ambition", value: 82 },
  { label: "Risk Tolerance", value: 68 },
  { label: "Innovativeness", value: 91 },
  { label: "Autonomy", value: 75 },
  { label: "Self-Efficacy", value: 88 },
  { label: "Stress Tolerance", value: 64 },
  { label: "Locus of Control", value: 79 },
  { label: "Grit", value: 85 },
];

function PersonalityRadarChart() {
  const cx = 250;
  const cy = 200;
  const maxR = 110;
  const levels = 4;
  const n = personalityDimensions.length;

  function polarToXY(angle: number, r: number) {
    // Start from top (-90deg), go clockwise
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const angleStep = 360 / n;

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = (maxR / levels) * (i + 1);
    const points = Array.from({ length: n }, (_, j) => {
      const { x, y } = polarToXY(j * angleStep, r);
      return `${x},${y}`;
    }).join(" ");
    return points;
  });

  // Data polygon
  const dataPoints = personalityDimensions.map((d, i) => {
    const r = (d.value / 100) * maxR;
    const { x, y } = polarToXY(i * angleStep, r);
    return `${x},${y}`;
  }).join(" ");

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => {
    const { x, y } = polarToXY(i * angleStep, maxR);
    return { x, y };
  });

  // Label positions pushed further out, with dynamic anchor
  const labels = personalityDimensions.map((d, i) => {
    const angleDeg = i * angleStep;
    const { x, y } = polarToXY(angleDeg, maxR + 22);
    // Anchor based on which side of the chart the label sits on
    const dx = x - cx;
    let anchor: "start" | "middle" | "end" = "middle";
    if (dx > 10) anchor = "start";
    else if (dx < -10) anchor = "end";
    return { ...d, x, y, anchor };
  });

  return (
    <svg viewBox="0 0 500 410" className="mx-auto h-full w-full max-w-[432px]" aria-hidden="true">
      {/* Grid rings */}
      {rings.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="currentColor"
          className="text-ink/15"
          strokeWidth={0.75}
        />
      ))}

      {/* Axis lines */}
      {axes.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={a.x}
          y2={a.y}
          stroke="currentColor"
          className="text-ink/15"
          strokeWidth={0.75}
        />
      ))}

      {/* Data fill */}
      <polygon
        points={dataPoints}
        className="fill-ink/10 stroke-ink"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {personalityDimensions.map((d, i) => {
        const r = (d.value / 100) * maxR;
        const { x, y } = polarToXY(i * angleStep, r);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2.5}
            className="fill-ink"
          />
        );
      })}

      {/* Labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor}
          dominantBaseline="central"
          className="fill-text-secondary text-[16px]"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

// --- Student variant (confirmation → personality CTA → explore) ---

function StudentVariant() {
  return (
    <motion.div className="w-full max-w-5xl" variants={stagger}>
      {/* Section A: Confirmation */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mb-16 border-t border-ink pt-6 sm:mb-20"
      >
        <p className="text-sm text-text-secondary">
          Assessment Complete
        </p>
        <h1 className="mt-6 font-display text-[clamp(44px,9vw,88px)] font-semibold leading-[0.92] tracking-[-0.055em] text-text-primary">
          You&rsquo;re All Set
        </h1>
        <p className="mt-6 max-w-xl text-[clamp(17px,1.5vw,19px)] leading-relaxed text-[#3d3c39]">
          Thanks for taking the Builders Quotient. We&rsquo;ll get your scores back to you soon. While you wait, let&rsquo;s dive deeper:
        </p>
      </motion.div>

      {/* Section B: Personality CTA (archived — see PERSONALITY_QUIZ_ENABLED) */}
      {PERSONALITY_QUIZ_ENABLED && (
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mb-16 border-t border-ink pt-6"
      >
        <div className="flex flex-col items-start gap-8 md:flex-row md:gap-10">
          {/* Radar chart */}
          <div className="w-full max-w-[360px] shrink-0 md:w-[360px]">
            <PersonalityRadarChart />
            <p className="mt-1 text-center text-xs text-text-secondary">
              Example data
            </p>
          </div>

          {/* Copy */}
          <div className="flex-1">
            <h2 className="font-display text-[clamp(32px,5vw,52px)] font-semibold leading-[0.98] tracking-[-0.045em] text-text-primary">
              Discover Your Mindset
            </h2>

            <div className="mt-5 space-y-4">
              <p className="text-[length:var(--text-fluid-sm)] leading-relaxed text-[#3d3c39]">
                Beyond intelligence, the most successful entrepreneurs share a unique blend of personality traits &mdash; grit, risk tolerance, innovativeness, and more. Our personality profile measures 8&nbsp;key dimensions that define great founders.
              </p>
              <p className="text-[length:var(--text-fluid-sm)] leading-relaxed text-[#3d3c39]">
                This one takes about <strong className="font-medium text-text-primary">25&nbsp;minutes</strong> &mdash; quick agree/disagree questions, no video required. We&rsquo;d love for you to knock it out while you&rsquo;re here, and we&rsquo;ll <strong className="font-medium text-text-primary">include your personality profile when your Builders Quotient is ready</strong>. It&rsquo;s also the next step in the ACU&nbsp;application.
              </p>
              <p className="text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                If now isn&rsquo;t a good time, no worries &mdash; we&rsquo;ll email you a link to come back and complete it&nbsp;later.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button as="a" href="/assess/personality" size="lg">
                Start Personality Profile
              </Button>
              <span className="text-sm text-text-secondary">
                ~25&nbsp;minutes
              </span>
            </div>

          </div>
        </div>
      </motion.div>
      )}

      {/* Section C: Explore Cards */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        id="explore"
        className="scroll-mt-8"
      >
        <p className="mb-8 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
          While you&rsquo;re here, explore what we&rsquo;re building at&nbsp;ACU.
        </p>
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-2">
          <ExploreCard
            heading="Discover ACU"
            body="Learn what makes Austin Christian University different &mdash; and why we built the Builders Quotient in the first place."
            buttonLabel="Visit Our Home"
            href={ACU_URLS.home}
            external
          />
          <ExploreCard
            heading="Explore Curriculum"
            body="See the programs and courses designed to build the next generation of entrepreneurs."
            buttonLabel="View Curriculum"
            href={ACU_URLS.curriculum}
            external
          />
        </div>
      </motion.div>

      {/* Closing text */}
      <motion.p
        variants={fadeUp}
        transition={transition}
        className="mt-16 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary"
      >
        That&rsquo;s it for now. We&rsquo;ll reach out to you when your results are ready.
      </motion.p>
    </motion.div>
  );
}

// --- General variant (three explore cards) ---

function GeneralVariant() {
  return (
    <motion.div className="w-full max-w-5xl" variants={stagger}>
      {/* Confirmation */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mb-16 border-t border-ink pt-6 sm:mb-20"
      >
        <p className="text-sm text-text-secondary">
          Assessment Complete
        </p>
        <h1 className="mt-6 font-display text-[clamp(44px,9vw,88px)] font-semibold leading-[0.92] tracking-[-0.055em] text-text-primary">
          You&rsquo;re All Set
        </h1>
        <p className="mt-6 max-w-xl text-[clamp(17px,1.5vw,19px)] leading-relaxed text-[#3d3c39]">
          Thanks for taking the Builders Quotient. We&rsquo;ll get your scores back to you soon. In the meantime, explore what we&rsquo;re building at&nbsp;ACU.
        </p>
      </motion.div>

      {/* Explore cards */}
      <motion.div variants={fadeUp} transition={transition}>
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-3">
          <ExploreCard
            heading="Discover ACU"
            body="Learn what makes Austin Christian University different &mdash; and why we built the Builders Quotient in the first place."
            buttonLabel="Visit Our Home"
            href={ACU_URLS.home}
            external
          />
          <ExploreCard
            heading="Explore Curriculum"
            body="See the programs and courses designed to build the next generation of entrepreneurs."
            buttonLabel="View Curriculum"
            href={ACU_URLS.curriculum}
            external
          />
          <ExploreCard
            heading="Startups &amp; Projects"
            body="Our accelerator connects students with real startups from day&nbsp;one."
            buttonLabel="The Accelerator"
            href={ACU_URLS.startups}
            external
          />
        </div>
      </motion.div>

      {/* Closing text */}
      <motion.p
        variants={fadeUp}
        transition={transition}
        className="mt-16 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary"
      >
        That&rsquo;s it for now. We&rsquo;ll reach out to you when your results are ready.
      </motion.p>
    </motion.div>
  );
}

// --- Default variant (fallback, no path param) ---

function DefaultVariant() {
  return (
    <motion.div className="w-full max-w-5xl" variants={stagger}>
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mb-16 border-t border-ink pt-6 sm:mb-20"
      >
        <p className="text-sm text-text-secondary">
          Assessment Complete
        </p>
        <h1 className="mt-6 font-display text-[clamp(44px,9vw,88px)] font-semibold leading-[0.92] tracking-[-0.055em] text-text-primary">
          You&rsquo;re All Set
        </h1>
        <p className="mt-6 max-w-xl text-[clamp(17px,1.5vw,19px)] leading-relaxed text-[#3d3c39]">
          Thanks for taking the Builders Quotient. We&rsquo;ll get your scores back to you soon.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} transition={transition}>
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-2">
          <ExploreCard
            heading="Discover ACU"
            body="Learn what makes Austin Christian University different &mdash; and why we built the Builders Quotient."
            buttonLabel="Visit Our Home"
            href={ACU_URLS.home}
            external
          />
          <ExploreCard
            heading="Explore Curriculum"
            body="See the programs designed to build the next generation of entrepreneurs."
            buttonLabel="View Curriculum"
            href={ACU_URLS.curriculum}
            external
          />
        </div>
      </motion.div>

      <motion.p
        variants={fadeUp}
        transition={transition}
        className="mt-16 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary"
      >
        That&rsquo;s it for now. We&rsquo;ll reach out to you when your results are ready.
      </motion.p>
    </motion.div>
  );
}

// --- Main content ---

export function ThankYouContent({ variant, sessionId }: { variant: Variant; sessionId: string }) {
  const [isReady, setIsReady] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  // Analytics: email was captured (this page is only reachable after email submission)
  // Only fire assessment_completed for non-student variants here — students still have
  // the personality profile ahead, so their assessment_completed fires on /personality/complete.
  useEffect(() => {
    const leadType = variant === "student" ? "prospective_student" : "general_interest";
    analytics.emailCaptured(sessionId, leadType);
    if (variant !== "student") {
      analytics.assessmentCompleted(sessionId, variant);
    }
  }, [sessionId, variant]);

  // Focus the h1 after splash completes
  useEffect(() => {
    if (isReady) {
      const id = requestAnimationFrame(() => {
        const h1 = contentRef.current?.querySelector("h1");
        if (h1) {
          h1.tabIndex = -1;
          h1.focus();
        }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isReady]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-x-hidden pt-16 pb-28 selection:bg-primary/20 selection:text-ink">
      <AnimatePresence mode="wait">
        {!isReady ? (
          <SplashSequence
            key="loading"
            steps={intelligenceLoadingSteps}
            onComplete={() => setIsReady(true)}
          />
        ) : (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            ref={contentRef}
            variants={prefersReducedMotion ? { hidden: {}, visible: {} } : stagger}
            className="flex w-full flex-col items-center px-4 md:px-8"
          >
            <CooldownBanner />
            {variant === "student" && <StudentVariant />}
            {variant === "general" && <GeneralVariant />}
            {variant === "default" && <DefaultVariant />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
