"use client";

import { motion } from "motion/react";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export function DisclaimerSlide() {
  return (
    <section className="flex h-full flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Soft ambient glow */}
      <motion.div
        className="absolute w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full bg-secondary/10 blur-[120px]"
        animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="z-10 max-w-lg text-center flex flex-col items-center gap-8"
      >
        <motion.p
          variants={fadeUp}
          className="uppercase tracking-[0.3em] text-xs text-secondary font-medium"
        >
          A note from&nbsp;us
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="font-display font-bold text-[length:var(--text-fluid-2xl)] text-white leading-tight text-balance"
        >
          Take these results with a grain of salt.
        </motion.h2>

        <motion.div variants={fadeUp} className="flex flex-col gap-4 text-text-secondary text-[length:var(--text-fluid-base)] leading-relaxed text-balance">
          <p>
            This exam is still in beta and we{"\u2019"}re continuing to refine our
            models as we collect more data. Don{"\u2019"}t put too much weight in
            these numbers just yet.
          </p>

          <p>
            If you didn{"\u2019"}t score how you expected&mdash;don{"\u2019"}t worry.
            If you think you{"\u2019"}re a human with immense entrepreneurial potential
            rivaling the best to ever do it, great. Go build something
            beautiful and prove the test wrong.
          </p>

          <p className="text-white/50 text-[length:var(--text-fluid-sm)] italic">
            (And then, send us an{" "}
            <a
              href="mailto:enrollment@austinchristianu.org"
              className="underline underline-offset-2 decoration-white/30 hover:decoration-white/60 transition-colors text-white/60 hover:text-white/80"
            >
              email
            </a>{" "}
            so we can adjust our models based on your undeniable success.)
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
