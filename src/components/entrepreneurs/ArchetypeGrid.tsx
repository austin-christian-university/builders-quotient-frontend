"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { PI_STYLES, CI_STYLES, type ArchetypeGridCell } from "@/lib/schemas/entrepreneurs";

interface ArchetypeGridProps {
  cells: ArchetypeGridCell[];
  maxCount: number;
}

export function ArchetypeGrid({ cells, maxCount }: ArchetypeGridProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const cellMap = new Map<string, ArchetypeGridCell>();
  for (const cell of cells) {
    const key = `${cell.archetype.piStyle}__${cell.archetype.ciStyle}`;
    cellMap.set(key, cell);
  }

  const anim = (delay: number) => ({
    initial: prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <>
      {/* Desktop: 4x4 matrix (md+) */}
      <div className="hidden md:block">
        <div
          role="region"
          aria-label="Archetype matrix: 4 practical-intelligence styles by 4 creative-intelligence styles"
          className="w-full rounded-2xl"
        >
          <div className="grid grid-cols-[140px_repeat(4,1fr)] gap-2 mb-2">
            <div />
            {CI_STYLES.map((ci) => (
              <div
                key={ci.key}
                className="text-center text-xs uppercase tracking-[0.15em] text-text-secondary/50 px-2 py-2"
                style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
              >
                {ci.label}
              </div>
            ))}
          </div>

          {PI_STYLES.map((pi, rowIdx) => (
            <div key={pi.key} className="grid grid-cols-[140px_repeat(4,1fr)] gap-2 mb-2">
              <div
                className="flex items-center text-xs uppercase tracking-[0.15em] text-text-secondary/50 pr-2"
                style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
              >
                {pi.label}
              </div>

              {CI_STYLES.map((ci, colIdx) => {
                const key = `${pi.key}__${ci.key}`;
                const cell = cellMap.get(key);
                if (!cell) return <div key={key} />;

                const isEmpty = cell.count === 0;
                const glowIntensity = isEmpty ? 0 : Math.max(0.03, (cell.count / maxCount) * 0.12);
                const delay = prefersReducedMotion ? 0 : (rowIdx * 4 + colIdx) * 0.04;

                if (isEmpty) {
                  return (
                    <motion.div
                      key={key}
                      {...anim(delay)}
                      className="rounded-2xl border border-border/50 bg-white/[0.01] p-4 flex flex-col justify-center items-center text-center opacity-40"
                    >
                      <p
                        className="text-sm font-semibold text-text-secondary/60"
                        style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                      >
                        {cell.archetype.name}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary/45 leading-tight">
                        No entrepreneurs found
                      </p>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={key} {...anim(delay)}>
                    <Link
                      href={`/entrepreneurs/archetype/${cell.archetype.key}`}
                      className="block rounded-2xl border border-border-glass bg-bg-elevated p-4 transition-all duration-300 ease-[var(--ease-out-expo)] hover:bg-bg-surface hover:border-white/20 hover:shadow-[0_0_24px_rgb(77_163_255/0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base h-full"
                      style={{
                        boxShadow: `inset 0 0 60px rgba(77,163,255,${glowIntensity})`,
                      }}
                    >
                      <p
                        className="text-sm font-semibold text-text-primary"
                        style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                      >
                        {cell.archetype.name}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary/70 leading-snug line-clamp-2">
                        {cell.archetype.tagline}
                      </p>
                      <p
                        className="mt-2 text-xs text-primary/70"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {cell.count} entrepreneur{cell.count !== 1 ? "s" : ""}
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: grouped vertical cards (below md) */}
      <div className="md:hidden space-y-6">
        {PI_STYLES.map((pi, rowIdx) => (
          <section key={pi.key}>
            <div className="mb-3 flex items-center gap-3">
              <h3
                className="text-[11px] uppercase tracking-[0.22em] text-text-secondary/60 whitespace-nowrap"
                style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
              >
                {pi.label}
              </h3>
              <div className="h-px flex-1 bg-white/[0.08]" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-2">
              {CI_STYLES.map((ci, colIdx) => {
                const key = `${pi.key}__${ci.key}`;
                const cell = cellMap.get(key);
                if (!cell) return null;

                const isEmpty = cell.count === 0;
                const glowIntensity = isEmpty ? 0 : Math.max(0.04, (cell.count / maxCount) * 0.14);
                const delay = prefersReducedMotion ? 0 : (rowIdx * 4 + colIdx) * 0.03;

                if (isEmpty) {
                  return (
                    <motion.div
                      key={key}
                      {...anim(delay)}
                      className="rounded-2xl border border-border/50 bg-white/[0.01] px-4 py-3 opacity-40"
                    >
                      <p
                        className="text-[15px] font-semibold text-text-secondary/60"
                        style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                      >
                        {cell.archetype.name}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary/45 leading-tight">
                        No entrepreneurs found
                      </p>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={key} {...anim(delay)}>
                    <Link
                      href={`/entrepreneurs/archetype/${cell.archetype.key}`}
                      className="block rounded-2xl border border-border-glass bg-bg-elevated px-4 py-3 transition-all duration-300 ease-[var(--ease-out-expo)] hover:bg-bg-surface hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
                      style={{
                        boxShadow: `inset 0 0 40px rgba(77,163,255,${glowIntensity})`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[15px] font-semibold text-text-primary"
                            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                          >
                            {cell.archetype.name}
                          </p>
                          <p className="mt-0.5 text-xs text-text-secondary/70 leading-snug line-clamp-2">
                            {cell.archetype.tagline}
                          </p>
                        </div>
                        <p
                          className="shrink-0 pt-0.5 text-[11px] font-medium text-primary/80 tabular-nums"
                          style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                        >
                          {cell.count}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
