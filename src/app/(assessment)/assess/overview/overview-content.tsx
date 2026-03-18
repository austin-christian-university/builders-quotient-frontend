"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

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
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
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
            You&apos;re about to step into real business scenarios drawn from the
            lives of actual entrepreneurs &mdash; no textbooks, no multiple
            choice.
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="mt-8 text-[length:var(--text-fluid-sm)] font-medium text-text-secondary"
          >
            ~20 min &middot; 4 scenarios &middot; Camera required
          </motion.p>

          <motion.div variants={itemVariants} className="mt-10">
            <Button as={Link} href="/assess/setup" size="lg">
              Continue to Setup
            </Button>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-4 text-[length:var(--text-fluid-xs)] text-text-secondary/60"
          >
            Camera &amp; microphone required
          </motion.p>
        </motion.div>
      </section>
    </div>
  );
}

export { OverviewContent };
