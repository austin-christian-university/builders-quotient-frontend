"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { SplashSequence } from "@/components/assessment/SplashSequence";

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

function HeartIcon({ className = "h-8 w-8 text-secondary" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
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

function SparklesIcon({ className = "h-8 w-8 text-secondary" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
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
  "Securing your responses\u2026",
  "Analyzing your intelligence profile\u2026",
  "Preparing your personalized results\u2026",
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

// --- Student variant (warm splash → personality CTA) ---

function StudentVariant() {
  const [showCTA, setShowCTA] = useState(false);

  return (
    <div className="w-full max-w-6xl">
      {/* Warm welcome splash */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mx-auto mb-20 text-center sm:mb-28"
      >
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-secondary/20 bg-gradient-to-tr from-secondary/10 to-transparent shadow-[0_0_40px_rgba(var(--color-secondary),0.15)] relative">
          <div className="absolute inset-0 rounded-full bg-secondary/5 blur-xl animate-pulse motion-reduce:animate-none" />
          <HeartIcon className="h-12 w-12 text-secondary relative z-10" />
        </div>
        <p className="text-[length:var(--text-fluid-sm)] font-bold uppercase tracking-[0.4em] text-secondary/90">
          Assessment Complete
        </p>
        <h1 className="mt-5 font-display text-[length:var(--text-fluid-5xl)] font-semibold tracking-tight text-text-primary">
          We&rsquo;re Glad You&rsquo;re Here
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[length:var(--text-fluid-xl)] leading-relaxed text-text-secondary font-light">
          Thank you for taking the time to complete your intelligence assessment. We&rsquo;re excited you&rsquo;re considering ACU, and we&rsquo;d love to get to know you a&nbsp;little&nbsp;better.
        </p>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-12 md:gap-10">
        {/* Personality profile intro - Premium Bento CTA */}
        <motion.div
          variants={fadeUp}
          transition={transition}
          onAnimationComplete={() => setShowCTA(true)}
          className="group relative col-span-12 overflow-hidden rounded-[3rem] border border-primary/20 bg-bg-surface/60 p-10 shadow-[0_8px_40px_-12px_rgba(var(--color-primary),0.1)] backdrop-blur-3xl sm:p-14 md:col-span-8 lg:p-16 transition-all duration-700 hover:shadow-[0_20px_60px_-12px_rgba(var(--color-primary),0.2)] hover:border-primary/40 hover:bg-bg-surface/80"
        >
          {/* Subtle slow moving gradients */}
          <div className="pointer-events-none absolute -right-40 -top-40 h-[40rem] w-[40rem] rounded-full bg-primary/20 blur-[130px] transition-transform duration-1000 group-hover:scale-110 group-hover:bg-primary/30" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-secondary/10 blur-[120px] transition-transform duration-1000 group-hover:-translate-y-16 group-hover:translate-x-16 group-hover:bg-secondary/20" aria-hidden="true" />

          {/* Inner ring decoration */}
          <div className="pointer-events-none absolute right-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_60%)]" />

          <div className="relative z-10 flex h-full flex-col justify-center">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/30 bg-primary/10 shadow-[inset_0_0_20px_rgba(var(--color-primary),0.2)] backdrop-blur-xl">
              <BrainIcon className="h-10 w-10 text-primary drop-shadow-[0_0_12px_rgba(var(--color-primary),0.6)]" />
            </div>

            <h2 className="font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-tight text-text-primary">
              Your Entrepreneur Personality Profile
            </h2>

            <div className="mt-6 max-w-xl space-y-5">
              <p className="text-[length:var(--text-fluid-lg)] leading-relaxed text-text-secondary/90 font-light">
                At ACU, we believe great entrepreneurs aren&rsquo;t just smart &mdash; they have a unique blend of personality traits that drives them. Our personality profile measures 9&nbsp;key dimensions like grit, risk tolerance, and innovativeness that define successful founders.
              </p>
              <p className="text-[length:var(--text-fluid-lg)] leading-relaxed text-text-secondary/90 font-light">
                We use this alongside your intelligence scores to understand who you are and how we can best support your&nbsp;journey.
              </p>
            </div>

            <AnimatePresence>
              {showCTA && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center"
                >
                  <Button as="a" href="/assess/personality" size="lg" className="px-10 py-7 text-lg shadow-[0_0_40px_-10px_rgba(var(--color-primary),0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_60px_-10px_rgba(var(--color-primary),0.8)] rounded-2xl relative overflow-hidden group/btn">
                    <span className="relative z-10">Start Personality Profile</span>
                  </Button>
                  <span className="text-[length:var(--text-fluid-base)] font-medium text-text-secondary/70 uppercase tracking-widest">
                    Takes about 5&nbsp;minutes
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Secondary: Curriculum - Slim Sidebar Bento */}
        <motion.div
          variants={fadeUp}
          transition={transition}
          className="group relative col-span-12 flex flex-col overflow-hidden rounded-[3rem] border border-border-glass bg-bg-elevated/30 p-10 shadow-lg backdrop-blur-2xl transition-all duration-700 hover:bg-bg-elevated/60 hover:shadow-xl md:col-span-4 lg:p-12 hover:border-primary/20"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-border-glass bg-bg-surface shadow-[0_2px_15px_rgba(0,0,0,0.1)] transition-transform duration-700 group-hover:scale-110">
            <AcademicCapIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-[length:var(--text-fluid-xl)] font-bold tracking-tight text-text-primary">
            Explore Our Curriculum
          </h2>
          <p className="mt-4 flex-grow text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary/90 font-light">
            See the programs and courses designed to build the next generation of entrepreneurial leaders that make ACU different.
          </p>
          <div className="mt-12">
            <Button
              as="a"
              href="/curriculum"
              variant="outline"
              size="lg"
              className="w-full bg-transparent border-primary/20 hover:bg-primary/5 hover:border-primary/40 rounded-xl transition-all duration-300"
            >
              View Curriculum
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// --- General variant (three explore cards) ---

function GeneralVariant() {
  return (
    <div className="w-full max-w-6xl">
      {/* Hero */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mx-auto mb-20 text-center sm:mb-28"
      >
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-secondary/20 bg-gradient-to-tr from-secondary/10 to-transparent shadow-[0_0_40px_rgba(var(--color-secondary),0.15)] relative">
          <div className="absolute inset-0 rounded-full bg-secondary/5 blur-xl animate-pulse motion-reduce:animate-none" />
          <SparklesIcon className="h-12 w-12 text-secondary relative z-10" />
        </div>
        <p className="text-[length:var(--text-fluid-sm)] font-bold uppercase tracking-[0.4em] text-secondary/90">
          Assessment Complete
        </p>
        <h1 className="mt-5 font-display text-[length:var(--text-fluid-5xl)] font-semibold tracking-tight text-text-primary">
          Your Intelligence Profile Is Ready
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[length:var(--text-fluid-xl)] leading-relaxed text-text-secondary font-light">
          You&rsquo;ll receive your detailed BQ analysis via email within 24&nbsp;hours. In the meantime, here&rsquo;s more about what we&rsquo;re building at&nbsp;ACU.
        </p>
      </motion.div>

      {/* Three explore cards in a bento grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 md:gap-10">
        <div className="md:col-span-2 lg:col-span-1 h-full">
          <ExploreCard
            icon={<GlobeIcon className="h-8 w-8 text-primary" />}
            heading="Discover ACU"
            body="Learn what makes Austin Christian University different &mdash; and why we built the Builders Quotient in the first place."
            buttonLabel="Visit Our Home"
            href="https://austinchristianu.org"
            external
          />
        </div>
        <div className="md:col-span-1 lg:col-span-1 h-full">
          <ExploreCard
            icon={<AcademicCapIcon className="h-8 w-8 text-primary" />}
            heading="Explore Curriculum"
            body="See the programs and courses designed to build the next generation of entrepreneurial leaders."
            buttonLabel="View Curriculum"
            href="https://austinchristianu.org/curriculum"
            external
          />
        </div>
        <div className="md:col-span-1 lg:col-span-1 h-full">
          <ExploreCard
            icon={<RocketIcon className="h-8 w-8 text-primary" />}
            heading="Startups &amp; Projects"
            body="We love getting students plugged into real ventures so they can make a real impact. Our accelerator connects students with startups from day&nbsp;one."
            buttonLabel="The Accelerator"
            href="https://austinchristianu.org"
            external
          />
        </div>
      </div>
    </div>
  );
}

// --- Default variant (fallback, no path param) ---

function DefaultVariant() {
  return (
    <div className="w-full max-w-5xl">
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mx-auto mb-20 text-center sm:mb-28"
      >
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-secondary/20 bg-gradient-to-tr from-secondary/10 to-transparent shadow-[0_0_40px_rgba(var(--color-secondary),0.15)] relative">
          <div className="absolute inset-0 rounded-full bg-secondary/5 blur-xl animate-pulse motion-reduce:animate-none" />
          <SparklesIcon className="h-12 w-12 text-secondary relative z-10" />
        </div>
        <p className="text-[length:var(--text-fluid-sm)] font-bold uppercase tracking-[0.4em] text-secondary/90">
          Assessment Complete
        </p>
        <h1 className="mt-5 font-display text-[length:var(--text-fluid-5xl)] font-semibold tracking-tight text-text-primary">
          Your Intelligence Profile Is Ready
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[length:var(--text-fluid-xl)] leading-relaxed text-text-secondary font-light">
          You&rsquo;ll receive your detailed BQ analysis via email within 24&nbsp;hours. Here&rsquo;s what you can do next.
        </p>
      </motion.div>

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
          body="See the programs designed to build the next generation of entrepreneurial leaders."
          buttonLabel="View Curriculum"
          href="https://austinchristianu.org/curriculum"
          external
        />
      </div>
    </div>
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
            {variant === "student" && <StudentVariant />}
            {variant === "general" && <GeneralVariant />}
            {variant === "default" && <DefaultVariant />}

            {/* Back to home */}
            <motion.div
              variants={fadeUp}
              transition={{ ...transition, delay: 0.4 }}
              className="mt-20 text-center"
            >
              <Button as="a" href="/" variant="ghost" size="lg" className="rounded-full px-8 text-text-secondary hover:text-text-primary">
                Back to Home
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
