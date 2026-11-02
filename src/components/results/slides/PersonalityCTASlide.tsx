"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { establishSessionFromToken } from "@/lib/actions/results-session";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// Static example data for the 8-point personality radar preview
const personalityDimensions = [
  { label: "Ambition", value: 82 },
  { label: "Risk Tolerance", value: 68 },
  { label: "Innovativeness", value: 91 },
  { label: "Autonomy", value: 75 },
  { label: "Self-Efficacy", value: 88 },
  { label: "Stress Tolerance", value: 64 },
  { label: "Locus of Control", value: 79 },
  { label: "Grit", value: 85 },
];

function PersonalityRadarPreview() {
  const cx = 250;
  const cy = 200;
  const maxR = 100;
  const levels = 4;
  const n = personalityDimensions.length;

  function polarToXY(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const angleStep = 360 / n;

  const rings = Array.from({ length: levels }, (_, i) => {
    const r = (maxR / levels) * (i + 1);
    return Array.from({ length: n }, (_, j) => {
      const { x, y } = polarToXY(j * angleStep, r);
      return `${x},${y}`;
    }).join(" ");
  });

  const dataPoints = personalityDimensions
    .map((d, i) => {
      const r = (d.value / 100) * maxR;
      const { x, y } = polarToXY(i * angleStep, r);
      return `${x},${y}`;
    })
    .join(" ");

  const axes = Array.from({ length: n }, (_, i) => {
    const { x, y } = polarToXY(i * angleStep, maxR);
    return { x, y };
  });

  const labels = personalityDimensions.map((d, i) => {
    const angleDeg = i * angleStep;
    const { x, y } = polarToXY(angleDeg, maxR + 22);
    const dx = x - cx;
    let anchor: "start" | "middle" | "end" = "middle";
    if (dx > 10) anchor = "start";
    else if (dx < -10) anchor = "end";
    return { ...d, x, y, anchor };
  });

  return (
    <svg
      viewBox="0 0 500 410"
      className="mx-auto h-full w-full max-w-[320px]"
      aria-hidden="true"
    >
      {rings.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth={1}
        />
      ))}
      {axes.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={a.x}
          y2={a.y}
          stroke="currentColor"
          className="text-border"
          strokeWidth={1}
        />
      ))}
      <polygon
        points={dataPoints}
        className="fill-ink/[0.06] stroke-ink"
        strokeWidth={2}
        strokeLinejoin="miter"
      />
      {personalityDimensions.map((d, i) => {
        const r = (d.value / 100) * maxR;
        const { x, y } = polarToXY(i * angleStep, r);
        return <rect key={i} x={x - 3} y={y - 3} width={6} height={6} className="fill-ink" />;
      })}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor}
          dominantBaseline="central"
          className="fill-text-secondary text-[14px]"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

export interface PersonalityCTASlideProps {
  token: string;
}

export function PersonalityCTASlide({ token }: PersonalityCTASlideProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setIsPending(true);
    setError(null);

    const result = await establishSessionFromToken(token);

    if (result.success) {
      router.push(result.redirectUrl);
    } else {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <section className="relative flex min-h-full flex-col justify-center px-5 pt-14 pb-24 md:h-full md:overflow-hidden md:px-8 md:py-16">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2 md:items-center md:gap-12"
      >
        <div className="flex flex-col">
          {/* Label */}
          <motion.p variants={fadeUp} className="mb-4 text-sm text-[#8c8a84]">
            Next step
          </motion.p>

          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            className="max-w-[14ch] text-[clamp(34px,5vw,56px)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink"
          >
            Complete Your Builder Profile
          </motion.h2>

          {/* Body */}
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[44ch] text-[17px] leading-[1.5] text-[#3d3c39]"
          >
            Beyond intelligence, great entrepreneurs share a unique blend of personality
            traits&nbsp;&mdash; grit, risk tolerance, innovativeness, and more. Our
            personality profile measures 8&nbsp;key dimensions that define great founders.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp} className="mt-7 flex flex-col items-start gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={handleStart} disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin border-2 border-ink/20 border-t-ink" />
                    Starting{"\u2026"}
                  </span>
                ) : (
                  <>
                    Start Personality Profile <span aria-hidden="true">&rarr;</span>
                  </>
                )}
              </Button>
              <span className="text-sm text-text-secondary">~5&nbsp;minutes</span>
            </div>
            {error && <p className="text-sm text-[#b3311d]">{error}</p>}
          </motion.div>
        </div>

        {/* Radar preview, framed like a sheet */}
        <motion.div variants={fadeUp} className="w-full border-2 border-ink bg-[#fbfaf6]">
          <p className="border-b border-ink px-4 py-2.5 text-sm text-text-secondary">Example data</p>
          <div className="px-4 py-5">
            <PersonalityRadarPreview />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
