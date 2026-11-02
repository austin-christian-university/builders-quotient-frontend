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
    <div className="min-h-screen bg-bg-base text-ink">
      <section className="mx-auto flex min-h-screen max-w-[1240px] items-center px-[clamp(20px,4vw,48px)] py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full border-t border-ink pt-6"
        >
          <motion.p
            variants={itemVariants}
            className="mb-[clamp(20px,3vw,36px)] text-sm text-[#8c8a84]"
          >
            Builders Quotient Assessment
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="max-w-[14ch] font-display text-[clamp(44px,8vw,112px)] font-semibold leading-[0.9] tracking-[-0.055em] text-ink"
          >
            What to Expect
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-[clamp(24px,3vw,40px)] max-w-[44ch] text-[clamp(18px,1.6vw,21px)] leading-[1.45] text-[#3d3c39]"
          >
            You&apos;re about to step into real business scenarios drawn from the
            lives of actual entrepreneurs &mdash; no textbooks, no multiple
            choice.
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="mt-8 border-t border-border pt-4 text-sm font-medium tabular-nums text-ink"
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
            className="mt-4 text-sm text-text-secondary"
          >
            Camera &amp; microphone required
          </motion.p>
        </motion.div>
      </section>
    </div>
  );
}

export { OverviewContent };
