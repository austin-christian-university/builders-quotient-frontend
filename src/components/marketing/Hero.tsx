"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

function Hero() {
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
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6">
      {/* Epic Apple-style background gradients */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-bg-base" />

        {/* Glowing orbs — static when reduced motion preferred */}
        {prefersReducedMotion ? (
          <>
            <div className="absolute left-[-10%] top-[-20%] h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.15),transparent_70%)] blur-3xl mix-blend-screen opacity-30" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(233,185,73,0.1),transparent_70%)] blur-3xl mix-blend-screen opacity-20" />
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

        {/* Dot grid texture */}
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
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        <motion.p
          variants={itemVariants}
          className="mb-8 font-medium uppercase tracking-[0.4em] text-[length:var(--text-fluid-xs)] text-text-secondary/80 mix-blend-plus-lighter"
        >
          Presented by Austin Christian University
        </motion.p>

        <motion.h1
          variants={itemVariants}
          className="bg-gradient-to-br from-white via-neutral-200 to-neutral-500 bg-clip-text font-display text-[clamp(3.5rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-transparent drop-shadow-sm pb-2"
        >
          Builder&apos;s <br /> Quotient
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mx-auto mt-8 max-w-2xl text-[clamp(1.125rem,2vw,1.5rem)] leading-relaxed text-text-secondary font-light tracking-wide"
        >
          A psychometric assessment that maps your practical intelligence,
          creative reasoning, and entrepreneurial topology.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-14 flex flex-col items-center gap-6"
        >
          {/* Glassmorphic/Premium Button */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-white/20 blur opacity-75 group-hover:opacity-100 transition duration-500" />
            <Button
              as={Link}
              href="/assess/overview"
              size="lg"
              className="relative rounded-full border border-white/10 bg-white/5 px-10 py-7 text-lg uppercase tracking-widest text-text-primary backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
              Begin Assessment
            </Button>
          </div>
          <p className="text-[length:var(--text-fluid-xs)] text-neutral-500 tracking-wider font-light">
            ~20&nbsp;min &middot; Camera required &middot; No&nbsp;retakes
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

export { Hero };
