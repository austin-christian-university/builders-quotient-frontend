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
          className="text-white/[0.06]"
          strokeWidth={0.75}
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
          className="text-white/[0.06]"
          strokeWidth={0.75}
        />
      ))}
      <polygon
        points={dataPoints}
        className="fill-secondary/15 stroke-secondary/60"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {personalityDimensions.map((d, i) => {
        const r = (d.value / 100) * maxR;
        const { x, y } = polarToXY(i * angleStep, r);
        return <circle key={i} cx={x} cy={y} r={2.5} className="fill-secondary" />;
      })}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor}
          dominantBaseline="central"
          className="fill-text-secondary/60 text-[14px]"
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
    <section className="flex min-h-full md:h-full flex-col items-center justify-center px-6 py-8 md:py-16 relative md:overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        className="absolute w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(233,185,73,0.12) 0%, rgba(233,185,73,0.04) 40%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="z-10 max-w-2xl w-full flex flex-col items-center gap-6 md:gap-8"
      >
        {/* Eyebrow */}
        <motion.p
          variants={fadeUp}
          className="uppercase tracking-[0.3em] text-xs text-secondary font-medium"
        >
          Next step
        </motion.p>

        {/* Heading */}
        <motion.h2
          variants={fadeUp}
          className="font-display font-bold text-[length:var(--text-fluid-2xl)] text-white leading-tight text-center text-balance"
        >
          Complete Your Builder Profile
        </motion.h2>

        {/* Body */}
        <motion.p
          variants={fadeUp}
          className="text-text-secondary text-[length:var(--text-fluid-base)] leading-relaxed text-center text-balance max-w-md"
        >
          Beyond intelligence, great entrepreneurs share a unique blend of personality
          traits&nbsp;&mdash; grit, risk tolerance, innovativeness, and more. Our
          personality profile measures 8&nbsp;key dimensions that define great founders.
        </motion.p>

        {/* Radar preview */}
        <motion.div variants={fadeUp} className="w-full max-w-[300px]">
          <PersonalityRadarPreview />
          <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-text-secondary/40">
            Example data
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center gap-3"
        >
          <Button
            size="lg"
            onClick={handleStart}
            disabled={isPending}
            className="shadow-[0_0_30px_-8px_rgba(233,185,73,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_-8px_rgba(233,185,73,0.7)] rounded-xl"
            style={{ background: "#e9b949", color: "#0a0a0c" }}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#0a0a0c]/20 border-t-[#0a0a0c] rounded-full animate-spin" />
                Starting{"\u2026"}
              </span>
            ) : (
              "Start Personality Profile"
            )}
          </Button>
          <span className="text-[length:var(--text-fluid-xs)] font-medium text-text-secondary/60 uppercase tracking-widest">
            ~5&nbsp;minutes
          </span>
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
