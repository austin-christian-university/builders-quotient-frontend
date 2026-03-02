"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { EntrepreneurMatch } from "@/lib/schemas/results";

type Props = {
  data: EntrepreneurMatch;
};

// ---------------------------------------------------------------------------
// Dual-polygon radar chart
// ---------------------------------------------------------------------------

type ProfilePoint = { category: string; value: number };

function ComparisonRadar({
  studentProfile,
  entrepreneurProfile,
  entrepreneurName,
}: {
  studentProfile: ProfilePoint[];
  entrepreneurProfile: ProfilePoint[];
  entrepreneurName: string;
}) {
  const numPoints = studentProfile.length;
  if (!numPoints) return null;

  const size = 300;
  const center = size / 2;
  const radius = center * 0.75;

  const getCoords = (value: number, index: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
    const r = radius * value;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const toPath = (points: ProfilePoint[]) =>
    points.map((p, i) => {
      const { x, y } = getCoords(p.value, i);
      return `${x},${y}`;
    }).join(" ");

  const studentPath = toPath(studentProfile);
  const entrepreneurPath = toPath(entrepreneurProfile);

  return (
    <div className="relative w-full max-w-xs aspect-square flex items-center justify-center mx-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Background concentric polygons */}
        {[0.25, 0.5, 0.75, 1].map((scale) => {
          const points = studentProfile
            .map((_, i) => {
              const { x, y } = getCoords(scale, i);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={scale}
              points={points}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axes */}
        {studentProfile.map((_, i) => {
          const { x, y } = getCoords(1, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Entrepreneur polygon (gold, behind) */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, type: "spring", delay: 0.6 }}
          points={entrepreneurPath}
          fill="url(#gradEntrepreneur)"
          stroke="var(--color-secondary)"
          strokeWidth="1.5"
          style={{ transformOrigin: "center" }}
        />

        {/* Student polygon (blue, in front) */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, type: "spring", delay: 0.8 }}
          points={studentPath}
          fill="url(#gradStudent)"
          stroke="var(--color-primary)"
          strokeWidth="2"
          style={{ transformOrigin: "center" }}
        />

        {/* Dots on student polygon */}
        {studentProfile.map((p, i) => {
          const { x, y } = getCoords(p.value, i);
          return (
            <motion.circle
              key={`s-${i}`}
              cx={x}
              cy={y}
              r={3.5}
              fill="var(--color-primary)"
              stroke="white"
              strokeWidth="1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 + i * 0.1 }}
            />
          );
        })}

        {/* Category labels */}
        {studentProfile.map((p, i) => {
          const { x, y } = getCoords(1.25, i);
          return (
            <motion.text
              key={i}
              x={x}
              y={y}
              fill="rgba(255,255,255,0.6)"
              fontSize="9"
              textAnchor="middle"
              alignmentBaseline="middle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="font-medium uppercase tracking-wider"
            >
              {p.category.split(" ").map((word, idx) => (
                <tspan key={idx} x={x} dy={idx === 0 ? 0 : 11}>
                  {word}
                </tspan>
              ))}
            </motion.text>
          );
        })}

        <defs>
          <linearGradient
            id="gradStudent"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="var(--color-primary)"
              stopOpacity="0.4"
            />
            <stop
              offset="100%"
              stopColor="var(--color-primary)"
              stopOpacity="0.1"
            />
          </linearGradient>
          <linearGradient
            id="gradEntrepreneur"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="var(--color-secondary)"
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor="var(--color-secondary)"
              stopOpacity="0.05"
            />
          </linearGradient>
        </defs>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-5 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span className="text-white/60">You</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-secondary" />
          <span className="text-white/60">{entrepreneurName}</span>
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trait comparison bar
// ---------------------------------------------------------------------------

function TraitBar({
  label,
  studentValue,
  entrepreneurValue,
  index,
}: {
  label: string;
  studentValue: number;
  entrepreneurValue: number;
  index: number;
}) {
  const [studentWidth, setStudentWidth] = useState(0);
  const [entWidth, setEntWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStudentWidth(studentValue);
      setEntWidth(entrepreneurValue);
    }, 400 + index * 120);
    return () => clearTimeout(timer);
  }, [studentValue, entrepreneurValue, index]);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-white/80">{label}</span>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${studentWidth}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="w-7 text-right font-variant-numeric tabular-nums text-[10px] text-white/40">
            {studentValue}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-secondary"
              initial={{ width: 0 }}
              animate={{ width: `${entWidth}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="w-7 text-right font-variant-numeric tabular-nums text-[10px] text-white/40">
            {entrepreneurValue}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main slide
// ---------------------------------------------------------------------------

export function EntrepreneurComparisonSlide({ data }: Props) {
  return (
    <section className="relative mx-auto flex h-full w-full max-w-4xl flex-col justify-center px-6 py-12 sm:px-12">
      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-text-secondary"
      >
        Personality Comparison
      </motion.p>

      {/* Radar chart */}
      <ComparisonRadar
        studentProfile={data.studentProfile}
        entrepreneurProfile={data.entrepreneurProfile}
        entrepreneurName={data.entrepreneurName.split(" ")[0]}
      />

      {/* Traits grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Shared strengths */}
        {data.topSharedTraits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              Shared Strengths
            </h3>
            <div className="flex flex-col gap-3">
              {data.topSharedTraits.map((trait) => (
                <div
                  key={trait.name}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5"
                >
                  <span className="text-sm text-white/80">{trait.name}</span>
                  <span className="ml-auto font-variant-numeric tabular-nums text-xs text-white/40">
                    {trait.value}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Biggest differences */}
        {data.biggestDifferences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.8 }}
          >
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              Where You Differ
            </h3>
            <div className="flex flex-col gap-4">
              {data.biggestDifferences.map((diff, i) => (
                <TraitBar
                  key={diff.name}
                  label={diff.name}
                  studentValue={diff.studentValue}
                  entrepreneurValue={diff.entrepreneurValue}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Runners-up */}
      {data.runnersUp.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.0 }}
          className="mt-8 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            You also resemble&hellip;
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {data.runnersUp.map((r) => (
              <span
                key={r.name}
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-white/60"
              >
                {r.name}{" "}
                <span className="font-variant-numeric tabular-nums text-white/30">
                  {r.similarity}%
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}
