"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

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

function HeartIcon() {
  return (
    <svg
      className="h-8 w-8 text-secondary"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg
      className="h-6 w-6 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      className="h-8 w-8 text-secondary"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      className="h-6 w-6 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.73-3.558"
      />
    </svg>
  );
}

function AcademicCapIcon() {
  return (
    <svg
      className="h-6 w-6 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
      />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg
      className="h-6 w-6 text-primary"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
      />
    </svg>
  );
}

// --- Card component ---

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
      transition={transition}
      className="rounded-2xl border border-border-glass bg-bg-elevated/80 p-5 backdrop-blur-xl sm:p-6"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
        {icon}
      </div>
      <h2 className="font-display text-[length:var(--text-fluid-base)] font-semibold tracking-[-0.01em]">
        {heading}
      </h2>
      <p className="mt-1.5 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
        {body}
      </p>
      <div className="mt-4">
        <Button
          as="a"
          href={href}
          variant="outline"
          size="md"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
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
    <>
      {/* Warm welcome splash */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10">
          <HeartIcon />
        </div>
        <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-secondary">
          Assessment Complete
        </p>
        <h1 className="mt-2 font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em]">
          We&rsquo;re Glad You&rsquo;re Here
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
          Thank you for taking the time to complete your intelligence
          assessment. We&rsquo;re excited you&rsquo;re considering ACU, and
          we&rsquo;d love to get to know you a&nbsp;little&nbsp;better.
        </p>
      </motion.div>

      {/* Personality profile intro */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        onAnimationComplete={() => setShowCTA(true)}
        className="relative overflow-hidden rounded-2xl border border-border-glass bg-bg-elevated/80 p-6 backdrop-blur-xl sm:p-8"
      >
        {/* Glow */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <BrainIcon />
          </div>
          <h2 className="font-display text-[length:var(--text-fluid-lg)] font-semibold tracking-[-0.01em]">
            Your Entrepreneur Personality Profile
          </h2>
          <p className="mt-2 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
            At ACU, we believe great entrepreneurs aren&rsquo;t just smart
            &mdash; they have a unique blend of personality traits that drives
            them. Our personality profile measures 9&nbsp;key dimensions like
            grit, risk tolerance, and innovativeness that define successful
            founders.
          </p>
          <p className="mt-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
            We use this alongside your intelligence scores to understand who you
            are and how we can best support your&nbsp;journey.
          </p>

          <AnimatePresence>
            {showCTA && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Button as="a" href="/assess/personality" size="lg">
                  Start Personality Profile
                </Button>
                <span className="text-[length:var(--text-fluid-sm)] text-text-secondary/70">
                  Takes about 5&nbsp;minutes
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Secondary: Curriculum */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="rounded-2xl border border-border-glass bg-bg-surface/50 p-5 sm:p-6"
      >
        <h2 className="font-display text-[length:var(--text-fluid-base)] font-semibold tracking-[-0.01em]">
          Explore Our Curriculum
        </h2>
        <p className="mt-1.5 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
          See the programs and courses that make ACU different
        </p>
        <div className="mt-4">
          <Button
            as="a"
            href="/curriculum"
            variant="outline"
            size="md"
          >
            View Curriculum
          </Button>
        </div>
      </motion.div>
    </>
  );
}

// --- General variant (three explore cards) ---

function GeneralVariant() {
  return (
    <>
      {/* Hero */}
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10">
          <SparklesIcon />
        </div>
        <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-secondary">
          Assessment Complete
        </p>
        <h1 className="mt-2 font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em]">
          Your Intelligence Profile Is Ready
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
          You&rsquo;ll receive your detailed BQ analysis via email within
          24&nbsp;hours. In the meantime, here&rsquo;s more about what
          we&rsquo;re building at&nbsp;ACU.
        </p>
      </motion.div>

      {/* Three explore cards */}
      <ExploreCard
        icon={<GlobeIcon />}
        heading="Discover ACU"
        body="Learn what makes Austin Christian University different &mdash; and why we built the Builders Quotient in the first place."
        buttonLabel="Visit Our Home"
        href="https://austinchristianu.org"
        external
      />
      <ExploreCard
        icon={<AcademicCapIcon />}
        heading="Explore the Curriculum"
        body="See the programs and courses designed to build the next generation of entrepreneurial leaders."
        buttonLabel="View Curriculum"
        href="https://austinchristianu.org/curriculum"
        external
      />
      <ExploreCard
        icon={<RocketIcon />}
        heading="Startups &amp; Real-World Projects"
        body="We love getting students plugged into real ventures so they can make a real impact. Our accelerator connects students with startups from day&nbsp;one."
        buttonLabel="Learn About the Accelerator"
        href="https://austinchristianu.org"
        external
      />
    </>
  );
}

// --- Default variant (fallback, no path param) ---

function DefaultVariant() {
  return (
    <>
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10">
          <SparklesIcon />
        </div>
        <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-secondary">
          Assessment Complete
        </p>
        <h1 className="mt-2 font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em]">
          Your Intelligence Profile Is Ready
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
          You&rsquo;ll receive your detailed BQ analysis via email within
          24&nbsp;hours. Here&rsquo;s what you can do next.
        </p>
      </motion.div>

      <ExploreCard
        icon={<GlobeIcon />}
        heading="Discover ACU"
        body="Learn what makes Austin Christian University different &mdash; and why we built the Builders Quotient."
        buttonLabel="Visit Our Home"
        href="https://austinchristianu.org"
        external
      />
      <ExploreCard
        icon={<AcademicCapIcon />}
        heading="Explore the Curriculum"
        body="See the programs designed to build the next generation of entrepreneurial leaders."
        buttonLabel="View Curriculum"
        href="https://austinchristianu.org/curriculum"
        external
      />
    </>
  );
}

// --- Main content ---

export function ThankYouContent({ variant }: { variant: Variant }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-xl"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <div className="flex flex-col gap-4">
          {variant === "student" && <StudentVariant />}
          {variant === "general" && <GeneralVariant />}
          {variant === "default" && <DefaultVariant />}
        </div>

        {/* Back to home */}
        <motion.div
          variants={fadeUp}
          transition={transition}
          className="mt-6 text-center"
        >
          <Button as="a" href="/" variant="ghost" size="md">
            Back to Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
