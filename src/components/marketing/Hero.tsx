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
    <section className="relative flex min-h-[100svh] flex-col items-center px-6 pt-12 pb-6">
      {/* Epic Apple-style background gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
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
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.5, 0.4] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[10%] top-[-10%] h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.12),transparent_60%)] blur-3xl mix-blend-screen"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.4, 0.3] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[-10%] right-[10%] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(233,185,73,0.08),transparent_60%)] blur-3xl mix-blend-screen"
            />
          </>
        )}

        {/* SVG Noise Texture for Premium Grain */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

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

      {/* Top spacer to vertically center main content */}
      <div className="flex-1" aria-hidden="true" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        <motion.p
          variants={itemVariants}
          className="mb-6 font-medium uppercase tracking-[0.4em] text-[length:var(--text-fluid-xs)] text-text-secondary/80 mix-blend-plus-lighter"
        >
          Presented by Austin Christian University
        </motion.p>

        <motion.h1
          variants={itemVariants}
          className="bg-gradient-to-br from-white via-neutral-100 to-neutral-500/80 bg-clip-text font-display text-[clamp(4rem,9vw,8rem)] font-bold leading-[0.9] tracking-[-0.04em] text-transparent drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] pb-4 mt-2"
        >
          Builder&apos;s <br /> Quotient
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mx-auto mt-6 max-w-2xl text-[clamp(1.125rem,2vw,1.5rem)] leading-relaxed text-text-secondary font-light tracking-wide"
        >
          A psychometric assessment that maps your practical intelligence,
          creative reasoning, and entrepreneurial topology.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-10 flex flex-col items-center gap-4"
        >
          {/* Glassmorphic/Premium Button */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-white/20 blur opacity-75 group-hover:opacity-100 transition duration-500" />
            <Button
              as={Link}
              href="/assess/overview"
              size="lg"
              className="relative rounded-full border border-white/10 bg-white/5 px-10 py-5 text-lg uppercase tracking-widest text-text-primary backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
              Begin Assessment
            </Button>
          </div>
          <p className="text-[length:var(--text-fluid-xs)] text-neutral-500 tracking-wider font-light">
            ~20&nbsp;min &middot; Camera required &middot; No&nbsp;retakes
          </p>
          <Link
            href="/entrepreneurs"
            className="mt-2 inline-flex items-center gap-1.5 text-[length:var(--text-fluid-xs)] text-text-secondary/50 tracking-wider font-light transition-colors hover:text-primary/80"
          >
            Or explore how 274 entrepreneurs think
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom spacer + "What is this?" prompt */}
      <div className="flex flex-1 items-end pb-2">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10"
        >
          <button
            type="button"
            className="flex flex-col items-center gap-1 rounded-xl px-6 py-2 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
            aria-label="Scroll to learn more about the Builders Quotient assessment"
            onClick={() => {
              document
                .getElementById("explainer")
                ?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
            }}
          >
            <span className="text-[length:var(--text-fluid-sm)] text-text-secondary/60 tracking-wider font-light">
              What is this?
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-text-secondary/40 ${prefersReducedMotion ? "" : "animate-[bounce-chevron_2s_ease-in-out_infinite]"}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}

export { Hero };
