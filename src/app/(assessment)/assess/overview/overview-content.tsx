"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const phases = [
  {
    number: "01",
    title: "Understand",
    description:
      "Hear an AI-narrated account of a real situation an entrepreneur faced. Then gather your thoughts: What questions would you ask? What information do you need? What would change how you think about this?",
    timing: "30 s think \u00b7 75 s record",
  },
  {
    number: "02",
    title: "Analyze",
    description:
      "Go deeper. What\u2019s your read on this situation? Where\u2019s the real problem\u2014or the hidden opportunity? This phase is about your instincts and reasoning, not having the \u201cright\u201d answer.",
    timing: "30 s think \u00b7 45 s record",
  },
  {
    number: "03",
    title: "Communicate",
    description:
      "Zoom out to the people involved\u2014team, investors, partners. How would you bring them along? What would you say, and why?",
    timing: "30 s think \u00b7 45 s record",
  },
];

const tips = [
  {
    title: "Think out loud",
    description:
      "Narrate your reasoning as it happens. Pauses, corrections, and \u201clet me rethink that\u201d moments are all valuable signal.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    title: "Process over polish",
    description:
      "We\u2019re scoring the structure of your thinking, not your presentation skills. Be natural. Be yourself.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
        <path d="M9 21h6" />
        <path d="M10 21v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1" />
      </svg>
    ),
  },
  {
    title: "Use your time",
    description:
      "You get a 30-second thinking window before each recording. Use it\u2014but don\u2019t overthink. Your first instincts often reveal the most.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const stats = [
  { label: "~15 min" },
  { label: "4 scenarios" },
  { label: "3 phases each" },
  { label: "Camera required" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function OverviewContent() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const containerVariants: Variants = prefersReducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: 0.3,
            staggerChildren: 0.15,
          },
        },
      };

  const itemVariants: Variants = prefersReducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.8, ease: "easeOut" },
        },
      };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* ── A: Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[70svh] items-center justify-center overflow-hidden px-6 pt-16 pb-24">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-bg-base" />

          {prefersReducedMotion ? (
            <>
              <div className="absolute left-[-10%] top-[-20%] h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.15),transparent_70%)] opacity-30 blur-3xl mix-blend-screen" />
              <div className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(233,185,73,0.1),transparent_70%)] opacity-20 blur-3xl mix-blend-screen" />
            </>
          ) : (
            <>
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[-10%] top-[-20%] h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.15),transparent_70%)] blur-3xl mix-blend-screen"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(233,185,73,0.1),transparent_70%)] blur-3xl mix-blend-screen"
              />
            </>
          )}

          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, rgb(255 255 255) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-base/50 to-bg-base" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <motion.p
            variants={itemVariants}
            className="mb-6 font-medium uppercase tracking-[0.3em] text-[length:var(--text-fluid-xs)] text-secondary"
          >
            Builders Quotient Assessment
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1] tracking-[-0.02em] text-text-primary"
          >
            What to Expect
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-8 max-w-2xl text-[clamp(1rem,1.8vw,1.25rem)] leading-relaxed text-text-secondary"
          >
            You&apos;re about to step into four real business scenarios drawn
            from the lives of actual entrepreneurs. There are no textbooks, no
            multiple choice, and no right answers&nbsp;&mdash; just your thinking,
            on camera, in the&nbsp;moment.
          </motion.p>
        </motion.div>
      </section>

      {/* ── B: The Three Phases ─────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <p className="text-center text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
              The Format
            </p>
            <h2 className="mt-4 text-center font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-[-0.01em] text-text-primary">
              Three phases, one scenario at a&nbsp;time
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
              Each scenario unfolds in three stages. You&apos;ll hear the story
              narrated to you, then respond to a series of prompts on&nbsp;camera.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {phases.map((phase, i) => (
              <ScrollReveal key={phase.number} delay={i * 0.1}>
                <Card className="flex h-full flex-col p-6">
                  <CardContent className="flex flex-1 flex-col gap-4 p-0">
                    <span className="font-display text-[length:var(--text-fluid-2xl)] font-bold text-primary">
                      {phase.number}
                    </span>
                    <h3 className="font-display text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
                      {phase.title}
                    </h3>
                    <p className="text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                      {phase.description}
                    </p>
                    <span className="mt-auto inline-flex self-start rounded-full border border-secondary/20 bg-secondary/5 px-3 py-1 text-[length:var(--text-fluid-xs)] font-medium text-secondary">
                      {phase.timing}
                    </span>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── C: Scoring Philosophy ──────────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
              The Philosophy
            </p>
            <h2 className="mt-4 font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-[-0.01em] text-text-primary">
              We care about how you think, not what you&nbsp;know
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <p className="mt-8 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
              This isn&apos;t a test you can study for. There are no trick
              questions and no answer key. We built the Builders Quotient by
              studying how hundreds of real entrepreneurs reason through
              uncertainty&nbsp;&mdash; and now we&apos;re mapping your reasoning
              against&nbsp;theirs.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="mt-6 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
              A thoughtful wrong answer will always score higher than a lucky
              right one. If you&apos;re unsure, say so and explain why. If
              you&apos;d ask for more information, tell us what and how it would
              change your approach. The more you externalize your thinking
              process, the richer your profile will&nbsp;be.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── D: Tips ────────────────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {tips.map((tip, i) => (
              <ScrollReveal key={tip.title} delay={i * 0.1}>
                <Card className="flex h-full flex-col items-center p-6 text-center">
                  <CardContent className="flex flex-1 flex-col items-center gap-4 p-0">
                    <span className="text-primary">{tip.icon}</span>
                    <h3 className="font-display text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
                      {tip.title}
                    </h3>
                    <p className="text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                      {tip.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── E: At a Glance ─────────────────────────────────────── */}
      <section className="px-6 py-16">
        <ScrollReveal>
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[length:var(--text-fluid-sm)] font-medium text-text-secondary">
            {stats.map((stat, i) => (
              <span key={stat.label} className="flex items-center gap-x-8">
                <span className="text-text-primary">{stat.label}</span>
                {i < stats.length - 1 && (
                  <span className="text-border-glass" aria-hidden="true">
                    &middot;
                  </span>
                )}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── F: CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgb(77_163_255/0.1),transparent)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-[-0.01em] text-text-primary">
              Ready?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
              You&apos;ll start with a quick consent form and equipment check,
              then dive straight into your first&nbsp;scenario.
            </p>
            <div className="mt-10">
              <Button as={Link} href="/assess/setup" size="lg">
                Continue to Setup
              </Button>
            </div>
            <p className="mt-4 text-[length:var(--text-fluid-xs)] text-text-secondary/60">
              Camera &amp; microphone required
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

export { OverviewContent };
