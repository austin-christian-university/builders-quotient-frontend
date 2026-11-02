"use client";

import { motion } from "motion/react";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export function DisclaimerSlide() {
  return (
    <section className="flex min-h-full md:h-full flex-col items-center justify-center px-5 py-16 md:px-10 md:py-20">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="w-full max-w-3xl"
      >
        <motion.p
          variants={fadeUp}
          className="border-t border-ink pt-3 text-sm text-[#8c8a84]"
        >
          A note from&nbsp;us
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="mt-6 max-w-[16ch] font-display text-[clamp(38px,6.5vw,76px)] font-semibold leading-[0.95] tracking-[-0.05em] text-ink md:mt-8"
        >
          This is a snapshot, not a verdict.
        </motion.h2>

        <motion.div
          variants={fadeUp}
          className="mt-8 grid gap-5 border-t border-ink pt-6 text-[clamp(16px,1.4vw,18px)] leading-[1.55] text-[#3d3c39] md:mt-12 md:grid-cols-2 md:gap-8"
        >
          <p>
            Your Builder Profile captures how you reason, communicate, and
            approach problems{" "}<em className="not-italic font-semibold text-ink">right now</em>. It measures where you are
            today&mdash;not your ceiling.
          </p>

          <p>
            Every entrepreneur you were compared to started somewhere.
            Strengths can be sharpened. Growth areas can be developed.
            What matters most is what you do next.
          </p>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-8 text-sm text-[#6b6963]"
        >
          Questions? Reach out to{" "}
          <a
            href="mailto:enrollment@austinchristianu.org"
            className="font-semibold text-ink underline decoration-1 underline-offset-[3px] hover:text-vermilion"
          >
            enrollment@austinchristianu.org
          </a>
        </motion.p>
      </motion.div>
    </section>
  );
}
