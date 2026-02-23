"use client";

import { motion } from "motion/react";
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

// --- Card components ---

function PrimaryCard({
  icon,
  heading,
  body,
  subtext,
  buttonLabel,
  href,
  external,
}: {
  icon: React.ReactNode;
  heading: string;
  body: string;
  subtext?: string;
  buttonLabel: string;
  href: string;
  external?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      transition={transition}
      className="relative overflow-hidden rounded-2xl border border-border-glass bg-bg-elevated/80 p-6 backdrop-blur-xl sm:p-8"
    >
      {/* Glow effect */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
          {icon}
        </div>
        <h2 className="font-display text-[length:var(--text-fluid-lg)] font-semibold tracking-[-0.01em]">
          {heading}
        </h2>
        <p className="mt-2 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
          {body}
        </p>
        {subtext && (
          <p className="mt-1.5 text-[length:var(--text-fluid-sm)] text-text-secondary/70">
            {subtext}
          </p>
        )}
        <div className="mt-5">
          <Button
            as="a"
            href={href}
            size="lg"
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function SecondaryCard({
  heading,
  body,
  subtext,
  buttonLabel,
  href,
  external,
}: {
  heading: string;
  body: string;
  subtext?: string;
  buttonLabel: string;
  href: string;
  external?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      transition={transition}
      className="rounded-2xl border border-border-glass bg-bg-surface/50 p-5 sm:p-6"
    >
      <h2 className="font-display text-[length:var(--text-fluid-base)] font-semibold tracking-[-0.01em]">
        {heading}
      </h2>
      <p className="mt-1.5 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
        {body}
      </p>
      {subtext && (
        <p className="mt-1 text-[length:var(--text-fluid-xs)] text-text-secondary/70">
          {subtext}
        </p>
      )}
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

// --- Variant content ---

function StudentVariant() {
  return (
    <>
      <PrimaryCard
        icon={<BrainIcon />}
        heading="Complete Your Entrepreneur Personality Profile"
        body="Discover which of 9 key entrepreneur personality dimensions define you. Successful ACU students share specific trait combinations&nbsp;&mdash; find out if you match."
        subtext="Takes about 5&nbsp;minutes"
        buttonLabel="Start Personality Assessment"
        href="/assess/personality"
      />
      <SecondaryCard
        heading="Explore ACU Programs"
        body="See which programs match your profile"
        buttonLabel="View Programs"
        href="https://austinchristianu.org/programs"
        external
      />
    </>
  );
}

function GeneralVariant() {
  return (
    <>
      <PrimaryCard
        icon={<RocketIcon />}
        heading="Got a Venture? Bring It to ACU"
        body="ACU&rsquo;s entrepreneurship incubator supports founders at every stage. Your BQ profile can fast-track your application."
        buttonLabel="Explore the Incubator"
        href="https://austinchristianu.org"
        external
      />
      <SecondaryCard
        heading="Complete Your Full BQ Profile"
        body="Add your entrepreneur personality dimensions to get the complete picture"
        subtext="Takes about 5&nbsp;minutes"
        buttonLabel="Start Personality Assessment"
        href="/assess/personality"
      />
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="text-center"
      >
        <Button
          as="a"
          href="https://austinchristianu.org"
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          size="md"
        >
          Partner with ACU&rsquo;s Entrepreneurship Program
        </Button>
      </motion.div>
    </>
  );
}

function DefaultVariant() {
  return (
    <>
      <PrimaryCard
        icon={<BrainIcon />}
        heading="Complete Your Entrepreneur Personality Profile"
        body="Discover which of 9 key entrepreneur personality dimensions define you. Your intelligence scores are only half the picture."
        subtext="Takes about 5&nbsp;minutes"
        buttonLabel="Start Personality Assessment"
        href="/assess/personality"
      />
      <SecondaryCard
        heading="Explore ACU Programs"
        body="See which programs match your profile"
        buttonLabel="View Programs"
        href="https://austinchristianu.org/programs"
        external
      />
    </>
  );
}

// --- Main content ---

const subtextByVariant: Record<Variant, string> = {
  student:
    "You\u2019ll receive your detailed BQ analysis via email within 24\u00a0hours. But your intelligence scores are only half the picture.",
  general:
    "You\u2019ll receive your detailed BQ analysis via email within 24\u00a0hours. Here\u2019s what you can do next.",
  default:
    "You\u2019ll receive your detailed BQ analysis via email within 24\u00a0hours. Here\u2019s what you can do next.",
};

export function ThankYouContent({ variant }: { variant: Variant }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-xl"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Hero section */}
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
          <p className="mt-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
            {subtextByVariant[variant]}
          </p>
        </motion.div>

        {/* CTA cards */}
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
