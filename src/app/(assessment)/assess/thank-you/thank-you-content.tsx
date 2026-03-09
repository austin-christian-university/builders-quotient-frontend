"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { SplashSequence } from "@/components/assessment/SplashSequence";
import { CooldownBanner } from "@/components/assessment/CooldownBanner";

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

// --- Icons ---

function CheckIcon({ className = "h-8 w-8 text-secondary" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function BrainIcon({ className = "h-6 w-6 text-primary" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}


function GlobeIcon({ className = "h-6 w-6 text-primary" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.73-3.558" />
    </svg>
  );
}

function AcademicCapIcon({ className = "h-6 w-6 text-primary" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  );
}

function RocketIcon({ className = "h-6 w-6 text-primary" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

const intelligenceLoadingSteps = [
  "Submitting your responses\u2026",
];

// --- Card Components (Bento Style) ---

function ExploreCard({
  icon,
  heading,
  body,
  buttonLabel,
  href,
  external,
}: {
  icon: React.ReactNode;
  heading: string;
  body: string;
  buttonLabel: string;
  href: string;
  external?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.4, ease: "easeOut" } }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-border-glass bg-bg-elevated/40 p-8 shadow-md backdrop-blur-2xl transition-all hover:border-primary/30 hover:bg-bg-elevated/80 hover:shadow-2xl hover:shadow-primary/5 sm:p-10"
    >
      {/* Deep mesh gradient background on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/20 blur-[60px] transition-all duration-700 group-hover:translate-x-4 group-hover:translate-y-4 group-hover:bg-primary/30" />

      <div className="relative mb-8 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-border-glass bg-bg-surface shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-transform duration-700 group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(var(--color-primary),0.2)]">
        {icon}
      </div>

      <div className="relative flex flex-grow flex-col">
        <h2 className="font-display text-[length:var(--text-fluid-xl)] font-bold tracking-tight text-text-primary transition-colors duration-300 group-hover:text-primary">
          {heading}
        </h2>
        <p className="mt-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
          {body}
        </p>
      </div>

      <div className="relative mt-8 pt-2">
        <Button
          as="a"
          href={href}
          variant="outline"
          size="md"
          className="w-full bg-transparent border-primary/20 text-text-primary hover:bg-primary/5 hover:border-primary/50 sm:w-auto transition-all duration-300 rounded-xl"
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
          className="text-white/[0.06]"
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
          className="text-white/[0.06]"
          strokeWidth={0.75}
        />
      ))}

      {/* Data fill */}
      <polygon
        points={dataPoints}
        className="fill-primary/15 stroke-primary/60"
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
            className="fill-primary"
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
          className="fill-text-secondary/60 text-[16px]"
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
        className="mx-auto mb-16 text-center sm:mb-20"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10">
          <CheckIcon className="h-8 w-8 text-secondary" />
        </div>
        <p className="text-[length:var(--text-fluid-xs)] font-bold uppercase tracking-[0.4em] text-secondary/90">
          Assessment Complete
        </p>
        <h1 className="mt-3 font-display text-[length:var(--text-fluid-3xl)] font-semibold tracking-tight text-text-primary">
          You&rsquo;re All Set
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
          Thanks for taking the Builders Quotient. We&rsquo;ll get your scores back to you soon. While you wait, let&rsquo;s dive deeper:
        </p>
      </motion.div>

      {/* Section B: Personality CTA */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="group relative mx-auto mb-16 overflow-hidden rounded-2xl border border-primary/20 bg-bg-surface/60 p-8 shadow-[0_8px_40px_-12px_rgba(var(--color-primary),0.1)] backdrop-blur-3xl sm:p-10 transition-all duration-700 hover:shadow-[0_20px_60px_-12px_rgba(var(--color-primary),0.15)] hover:border-primary/30"
      >
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-[100px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[20rem] w-[20rem] rounded-full bg-secondary/8 blur-[80px]" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-10">
          {/* Radar chart */}
          <div className="w-full max-w-[360px] shrink-0 md:w-[360px]">
            <PersonalityRadarChart />
            <p className="mt-1 text-center text-[length:var(--text-fluid-xs)] uppercase tracking-widest text-text-secondary/40">
              Example data
            </p>
          </div>

          {/* Copy */}
          <div className="flex-1">
            <h2 className="font-display text-[length:var(--text-fluid-xl)] font-bold tracking-tight text-text-primary">
              Discover Your Mindset
            </h2>

            <div className="mt-4 space-y-4">
              <p className="text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                Beyond intelligence, the most successful entrepreneurs share a unique blend of personality traits &mdash; grit, risk tolerance, innovativeness, and more. Our personality profile measures 8&nbsp;key dimensions that define great founders.
              </p>
              <p className="text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                Complete it now and we&rsquo;ll <strong className="font-medium text-text-primary">include your personality profile when your Builders Quotient is ready</strong>. It&rsquo;s also the next step in the ACU&nbsp;application.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button as="a" href="/assess/personality" size="lg" className="shadow-[0_0_30px_-8px_rgba(var(--color-primary),0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_-8px_rgba(var(--color-primary),0.7)] rounded-xl">
                Start Personality Profile
              </Button>
              <span className="text-[length:var(--text-fluid-xs)] font-medium text-text-secondary/60 uppercase tracking-widest">
                ~5&nbsp;minutes
              </span>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Section C: Explore Cards */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        id="explore"
        className="scroll-mt-8"
      >
        <p className="mb-8 text-center text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
          Not ready for another quiz right now? Explore what else we have to&nbsp;offer.
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
          <ExploreCard
            icon={<GlobeIcon className="h-8 w-8 text-primary" />}
            heading="Discover ACU"
            body="Learn what makes Austin Christian University different &mdash; and why we built the Builders Quotient in the first place."
            buttonLabel="Visit Our Home"
            href="https://austinchristianu.org"
            external
          />
          <ExploreCard
            icon={<AcademicCapIcon className="h-8 w-8 text-primary" />}
            heading="Explore Curriculum"
            body="See the programs and courses designed to build the next generation of entrepreneurs."
            buttonLabel="View Curriculum"
            href="https://austinchristianu.org/curriculum"
            external
          />
        </div>
      </motion.div>

      {/* Closing text */}
      <motion.p
        variants={fadeUp}
        transition={transition}
        className="mt-16 text-center text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary/60"
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
        className="mx-auto mb-16 text-center sm:mb-20"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10">
          <CheckIcon className="h-8 w-8 text-secondary" />
        </div>
        <p className="text-[length:var(--text-fluid-xs)] font-bold uppercase tracking-[0.4em] text-secondary/90">
          Assessment Complete
        </p>
        <h1 className="mt-3 font-display text-[length:var(--text-fluid-3xl)] font-semibold tracking-tight text-text-primary">
          You&rsquo;re All Set
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
          Thanks for taking the Builders Quotient. We&rsquo;ll get your scores back to you soon. In the meantime, explore what we&rsquo;re building at&nbsp;ACU.
        </p>
      </motion.div>

      {/* Explore cards */}
      <motion.div variants={fadeUp} transition={transition}>
        <div className="grid gap-8 md:grid-cols-3 lg:gap-10">
          <ExploreCard
            icon={<GlobeIcon className="h-8 w-8 text-primary" />}
            heading="Discover ACU"
            body="Learn what makes Austin Christian University different &mdash; and why we built the Builders Quotient in the first place."
            buttonLabel="Visit Our Home"
            href="https://austinchristianu.org"
            external
          />
          <ExploreCard
            icon={<AcademicCapIcon className="h-8 w-8 text-primary" />}
            heading="Explore Curriculum"
            body="See the programs and courses designed to build the next generation of entrepreneurs."
            buttonLabel="View Curriculum"
            href="https://austinchristianu.org/curriculum"
            external
          />
          <ExploreCard
            icon={<RocketIcon className="h-8 w-8 text-primary" />}
            heading="Startups &amp; Projects"
            body="Our accelerator connects students with real startups from day&nbsp;one."
            buttonLabel="The Accelerator"
            href="https://www.austinchristianuniversity.org/startups"
            external
          />
        </div>
      </motion.div>

      {/* Closing text */}
      <motion.p
        variants={fadeUp}
        transition={transition}
        className="mt-16 text-center text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary/60"
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
        className="mx-auto mb-16 text-center sm:mb-20"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10">
          <CheckIcon className="h-8 w-8 text-secondary" />
        </div>
        <p className="text-[length:var(--text-fluid-xs)] font-bold uppercase tracking-[0.4em] text-secondary/90">
          Assessment Complete
        </p>
        <h1 className="mt-3 font-display text-[length:var(--text-fluid-3xl)] font-semibold tracking-tight text-text-primary">
          You&rsquo;re All Set
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
          Thanks for taking the Builders Quotient. We&rsquo;ll get your scores back to you soon.
        </p>
      </motion.div>

      <motion.div variants={fadeUp} transition={transition}>
        <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
          <ExploreCard
            icon={<GlobeIcon className="h-8 w-8 text-primary" />}
            heading="Discover ACU"
            body="Learn what makes Austin Christian University different &mdash; and why we built the Builders Quotient."
            buttonLabel="Visit Our Home"
            href="https://austinchristianu.org"
            external
          />
          <ExploreCard
            icon={<AcademicCapIcon className="h-8 w-8 text-primary" />}
            heading="Explore Curriculum"
            body="See the programs designed to build the next generation of entrepreneurs."
            buttonLabel="View Curriculum"
            href="https://austinchristianu.org/curriculum"
            external
          />
        </div>
      </motion.div>

      <motion.p
        variants={fadeUp}
        transition={transition}
        className="mt-16 text-center text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary/60"
      >
        That&rsquo;s it for now. We&rsquo;ll reach out to you when your results are ready.
      </motion.p>
    </motion.div>
  );
}

// --- Main content ---

export function ThankYouContent({ variant }: { variant: Variant }) {
  const [isReady, setIsReady] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

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
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-x-hidden pt-16 pb-28 selection:bg-primary/20 selection:text-white">
      <AnimatePresence mode="wait">
        {!isReady ? (
          <SplashSequence
            key="loading"
            steps={intelligenceLoadingSteps}
            icon={<BrainIcon className="h-10 w-10 text-primary drop-shadow-md" />}
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
