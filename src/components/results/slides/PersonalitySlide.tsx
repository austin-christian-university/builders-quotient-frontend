"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { PersonalityData } from "@/lib/schemas/results";

type Props = {
  data: PersonalityData;
};

function FacetBar({
  label,
  score,
  index,
  isGrit,
}: {
  label: string;
  score: number;
  index: number;
  isGrit: boolean;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 500 + index * 120);
    return () => clearTimeout(timer);
  }, [score, index]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-white/90">
          {label}
          {isGrit && (
            <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
              Grit
            </span>
          )}
        </span>
        <span className="font-variant-numeric tabular-nums text-white/60">
          {score.toFixed(0)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full bg-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export function PersonalitySlide({ data }: Props) {
  return (
    <section className="relative mx-auto flex h-full w-full max-w-4xl flex-col justify-center px-6 sm:px-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <p className="mb-2 border-l-2 border-secondary/40 pl-4 text-sm font-semibold uppercase tracking-widest text-text-secondary">
          Entrepreneurial Personality
        </p>
        <div className="mb-2 flex items-end gap-3">
          <h2 className="font-display text-[length:var(--text-fluid-5xl)] font-bold leading-none text-white">
            {data.summary.globalIndexRescaled.toFixed(0)}
          </h2>
          <span className="mb-1 text-[length:var(--text-fluid-xl)] font-light text-white/50">
            / 100
          </span>
        </div>
        <p className="text-text-secondary">
          Your Entrepreneurial Personality Index across 8&nbsp;dimensions.
        </p>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
        {data.facetScores.map((fs, i) => (
          <motion.div
            key={fs.facet}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
          >
            <FacetBar
              label={fs.label}
              score={fs.rescaledScore}
              index={i}
              isGrit={fs.facet === "GR"}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
