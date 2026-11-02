"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { SplashSequence } from "@/components/assessment/SplashSequence";
import { markBqComplete } from "@/lib/actions/application";
import { ACU_URLS } from "@/lib/constants";
import * as analytics from "@/lib/analytics/events";

type Variant = "student" | "general";

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

const personalityLoadingSteps = [
  "Saving your results\u2026",
];

// --- Student variant ---

function StudentVariant() {
  return (
    <div className="w-full max-w-3xl">
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mb-16 border-t border-ink pt-6 sm:mb-20"
      >
        <p className="text-sm text-text-secondary">
          BQ Complete
        </p>
        <h1 className="mt-6 font-display text-[clamp(44px,9vw,88px)] font-semibold leading-[0.92] tracking-[-0.055em] text-text-primary">
          Hooray!&ensp;&#127881;
        </h1>
        <p className="mt-6 max-w-xl text-[clamp(17px,1.5vw,19px)] leading-relaxed text-[#3d3c39]">
          We&rsquo;ll process your Builders Quotient results as soon as we can. We normally get them back within 24&nbsp;hours.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        transition={transition}
        className="w-full bg-ink p-[clamp(24px,6vw,56px)] text-paper"
      >
        <h2 className="font-display text-[clamp(32px,6vw,52px)] font-semibold leading-[0.98] tracking-[-0.045em]">
          By the Way&hellip;
        </h2>

        <div className="mt-5 max-w-xl space-y-4">
          <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-[#bdbab2]">
            What you just completed was actually the first two steps of an application to ACU. The hardest part is already behind you &mdash; want to keep going and finish&nbsp;it&nbsp;out?
          </p>
        </div>

        <div className="mt-10">
          <Button
            as="a"
            href={ACU_URLS.apply}
            size="lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Finish Your Application
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// --- General variant ---

function GeneralVariant() {
  return (
    <div className="w-full max-w-5xl">
      <motion.div
        variants={fadeUp}
        transition={transition}
        className="mb-16 border-t border-ink pt-6 sm:mb-20"
      >
        <p className="text-sm text-text-secondary">
          BQ Complete
        </p>
        <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(40px,8vw,80px)] font-semibold leading-[0.94] tracking-[-0.055em] text-text-primary">
          Your Full BQ Analysis Is Coming
        </h1>
        <p className="mt-6 max-w-xl text-[clamp(17px,1.5vw,19px)] leading-relaxed text-[#3d3c39]">
          You&rsquo;ll receive your detailed BQ analysis &mdash; intelligence and personality &mdash; via email within 24&nbsp;hours. In the meantime, here&rsquo;s more about what we&rsquo;re building at&nbsp;ACU.
        </p>
      </motion.div>

      <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
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
          body="Our accelerator connects students with real ventures from day&nbsp;one so they can make a real impact."
          buttonLabel="The Accelerator"
          href={ACU_URLS.home}
          external
        />
      </div>
    </div>
  );
}

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

// --- Main ---

export function PersonalityCompleteContent({ variant, sessionId }: { variant: Variant; sessionId: string }) {
  const [isReady, setIsReady] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  // Fallback: mark BQ complete for all variants (idempotent — primary write happens in submitPersonalityQuiz)
  useEffect(() => {
    markBqComplete();
    analytics.assessmentCompleted(sessionId, variant);
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
            steps={personalityLoadingSteps}
            onComplete={() => setIsReady(true)}
          />
        ) : (
          <motion.div
            key="content"
            ref={contentRef}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            variants={prefersReducedMotion ? { hidden: {}, visible: {} } : stagger}
            className="flex w-full flex-col items-center px-4 md:px-8"
          >
            {variant === "student" && <StudentVariant />}
            {variant === "general" && <GeneralVariant />}

            <motion.p
              variants={fadeUp}
              transition={{ ...transition, delay: 0.4 }}
              className={`mt-16 w-full ${variant === "student" ? "max-w-3xl" : "max-w-5xl"} text-[length:var(--text-fluid-sm)] text-text-secondary`}
            >
              Either way, we&rsquo;ll email you your Builders Quotient results when they&rsquo;re&nbsp;ready.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
