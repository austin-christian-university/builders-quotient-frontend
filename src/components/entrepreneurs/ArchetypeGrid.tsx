"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { PI_STYLES, CI_STYLES, type ArchetypeGridCell } from "@/lib/schemas/entrepreneurs";

interface ArchetypeGridProps {
  cells: ArchetypeGridCell[];
  maxCount: number;
}

/**
 * The 16 archetypes as a ruled 4x4 table: practical-intelligence styles down
 * the side, creative-intelligence styles across the top. Square cells on
 * hairlines; the count is a numeral, and the most-populated cell carries the
 * page's one vermilion highlight.
 */
export function ArchetypeGrid({ cells, maxCount }: ArchetypeGridProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const cellMap = new Map<string, ArchetypeGridCell>();
  for (const cell of cells) {
    const key = `${cell.archetype.piStyle}__${cell.archetype.ciStyle}`;
    cellMap.set(key, cell);
  }

  const anim = (delay: number) => ({
    initial: prefersReducedMotion ? {} : { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  const isTop = (cell: ArchetypeGridCell) => maxCount > 0 && cell.count === maxCount;

  return (
    <>
      {/* Desktop: 4x4 matrix (md+) */}
      <div className="hidden md:block">
        <div
          role="region"
          aria-label="Archetype matrix: 4 practical-intelligence styles by 4 creative-intelligence styles"
          className="w-full"
        >
          <div className="grid grid-cols-[minmax(0,0.8fr)_repeat(4,minmax(0,1fr))] border-b border-ink">
            <div aria-hidden="true" />
            {CI_STYLES.map((ci) => (
              <div key={ci.key} className="px-3 pb-3 text-sm font-semibold">
                {ci.label}
              </div>
            ))}
          </div>

          {PI_STYLES.map((pi, rowIdx) => (
            <div
              key={pi.key}
              className="grid grid-cols-[minmax(0,0.8fr)_repeat(4,minmax(0,1fr))] border-b border-border"
            >
              <div className="py-4 pr-3 text-sm font-semibold">{pi.label}</div>

              {CI_STYLES.map((ci, colIdx) => {
                const key = `${pi.key}__${ci.key}`;
                const cell = cellMap.get(key);
                if (!cell) return <div key={key} className="border-l border-border" />;

                const delay = prefersReducedMotion ? 0 : (rowIdx * 4 + colIdx) * 0.03;

                if (cell.count === 0) {
                  return (
                    <motion.div key={key} {...anim(delay)} className="border-l border-border p-3">
                      <p className="text-sm font-semibold text-[#8c8a84]">{cell.archetype.name}</p>
                      <p className="mt-1 text-xs leading-tight text-[#8c8a84]">No entrepreneurs found</p>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={key} {...anim(delay)} className="border-l border-border">
                    <Link
                      href={`/entrepreneurs/archetype/${cell.archetype.key}`}
                      className="flex h-full flex-col p-3 transition-colors hover:bg-[#ebe7dd] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
                    >
                      <span
                        className={`text-[32px] font-semibold leading-none tracking-[-0.05em] tabular-nums ${
                          isTop(cell) ? "text-vermilion" : ""
                        }`}
                      >
                        {cell.count}
                      </span>
                      <span className="mt-3 text-sm font-semibold leading-snug">{cell.archetype.name}</span>
                      <span className="mt-1 line-clamp-2 text-xs leading-snug text-text-secondary">
                        {cell.archetype.tagline}
                      </span>
                      <span className="sr-only">
                        {cell.count} entrepreneur{cell.count !== 1 ? "s" : ""}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: grouped ruled lists (below md) */}
      <div className="space-y-10 md:hidden">
        {PI_STYLES.map((pi, rowIdx) => (
          <section key={pi.key}>
            <h3 className="border-b border-ink pb-2 text-sm font-semibold">{pi.label}</h3>

            <ul>
              {CI_STYLES.map((ci, colIdx) => {
                const key = `${pi.key}__${ci.key}`;
                const cell = cellMap.get(key);
                if (!cell) return null;

                const delay = prefersReducedMotion ? 0 : (rowIdx * 4 + colIdx) * 0.03;

                if (cell.count === 0) {
                  return (
                    <motion.li key={key} {...anim(delay)} className="border-b border-border py-3">
                      <p className="text-[15px] font-semibold text-[#8c8a84]">{cell.archetype.name}</p>
                      <p className="mt-0.5 text-xs leading-tight text-[#8c8a84]">No entrepreneurs found</p>
                    </motion.li>
                  );
                }

                return (
                  <motion.li key={key} {...anim(delay)} className="border-b border-border">
                    <Link
                      href={`/entrepreneurs/archetype/${cell.archetype.key}`}
                      className="flex items-start justify-between gap-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{cell.archetype.name}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-text-secondary">
                          {cell.archetype.tagline}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-2xl font-semibold leading-none tracking-[-0.04em] tabular-nums ${
                          isTop(cell) ? "text-vermilion" : ""
                        }`}
                      >
                        {cell.count}
                        <span className="sr-only"> entrepreneur{cell.count !== 1 ? "s" : ""}</span>
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
