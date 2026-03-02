"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";
import type { EntrepreneurMatch } from "@/lib/schemas/results";

type Props = {
  data: EntrepreneurMatch;
};

/** Format snake_case category for display: "tech_innovator" → "Tech Innovator" */
function formatCategory(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function AnimatedPercentage({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.8,
    });
    return controls.stop;
  }, [mv, value]);

  return (
    <motion.span className="font-variant-numeric tabular-nums">
      {rounded}
    </motion.span>
  );
}

export function EntrepreneurMatchSlide({ data }: Props) {
  const matchPercent = Math.round(data.cosineSimilarity * 100);

  return (
    <section className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6">
      {/* Gold glow background */}
      <motion.div
        className="absolute bottom-0 left-1/2 h-[100vw] w-[100vw] max-h-[800px] max-w-[800px] -translate-x-1/2 rounded-full bg-secondary blur-[120px] mix-blend-screen"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      <div
        className="z-10 flex w-full max-w-sm flex-col items-center text-center"
        style={{ perspective: "1000px" }}
      >
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-sm font-semibold uppercase tracking-widest text-text-secondary"
        >
          Your Entrepreneur Match
        </motion.p>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, rotateX: 20, y: 40 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          transition={{
            duration: 1.2,
            type: "spring",
            bounce: 0.4,
            delay: 0.2,
          }}
          className="group relative flex w-full flex-col items-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
        >
          {/* Inner gold glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-transparent opacity-15" />

          {/* Gloss reflection overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />

          {/* Match percentage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-2 flex items-baseline gap-1"
          >
            <span className="font-display text-[length:var(--text-fluid-5xl)] font-bold leading-none text-secondary">
              <AnimatedPercentage value={matchPercent} />
            </span>
            <span className="text-[length:var(--text-fluid-xl)] font-light text-secondary/60">
              %
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-6 text-sm text-white/50"
          >
            personality match
          </motion.p>

          {/* Entrepreneur name */}
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mb-3 font-display text-[length:var(--text-fluid-3xl)] font-bold leading-tight text-white drop-shadow-md"
          >
            {data.entrepreneurName}
          </motion.h2>

          {/* Category badge */}
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mb-5 rounded-full border border-secondary/30 bg-secondary/10 px-3.5 py-1 text-xs font-semibold text-secondary"
          >
            {formatCategory(data.category)}
          </motion.span>

          {/* Bio snippet or companies */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mb-6 max-w-xs text-center text-[length:var(--text-fluid-sm)] leading-relaxed text-white/70"
          >
            {data.bioSnippet ??
              (data.companies.length > 0
                ? `Known for ${data.companies.slice(0, 3).join(", ")}`
                : `A ${formatCategory(data.category).toLowerCase()} building in ${data.industries.slice(0, 2).join(" & ")}`)}
          </motion.p>

          {/* Company pills */}
          {data.companies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {data.companies.slice(0, 4).map((company) => (
                <span
                  key={company}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
                >
                  {company}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
