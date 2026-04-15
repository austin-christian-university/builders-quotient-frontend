"use client";

import { PERSONALITY_DIMENSION_NAMES } from "@/lib/assessment/personality-dimensions";

interface BeeSwarmChartProps {
  /** Array of personality vectors. Each inner array is 20 values (pv_01 through pv_20), values 0-1. */
  personalityVectors: number[][];
  /** Per-trait stats for label annotations */
  traitStats: {
    key: string;
    mean: number;
    stddev: number;
    min: number;
    max: number;
  }[];
}

const TRAITS = [
  { key: "pv_06", index: 5, color: "#63b3ed", annotation: "tight cluster" },
  { key: "pv_17", index: 16, color: "#fbbf24", annotation: "scattered everywhere" },
  { key: "pv_10", index: 9, color: "#f87171", annotation: "skews middle" },
  { key: "pv_18", index: 17, color: "#fbbf24", annotation: "wide spread" },
  { key: "pv_16", index: 15, color: "#a78bfa", annotation: "skews low" },
] as const;

const X_MIN = 160;
const X_MAX = 640;
const X_RANGE = X_MAX - X_MIN;
const ROW_START_Y = 45;
const ROW_SPACING = 65;
const JITTER_RANGE = 15;

function valueToX(value: number): number {
  return X_MIN + Math.max(0, Math.min(1, value)) * X_RANGE;
}

function deterministicJitter(index: number, value: number): number {
  const hash = ((index * 7 + value * 1300) % 30) - 15;
  return Math.max(-JITTER_RANGE, Math.min(JITTER_RANGE, hash));
}

export default function BeeSwarmChart({
  personalityVectors,
  traitStats,
}: BeeSwarmChartProps) {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const tickLabels = ["0%", "25%", "50%", "75%", "100%"];

  const statsByKey = new Map(traitStats.map((s) => [s.key, s]));

  return (
    <div className="w-full min-h-[280px]">
      <svg viewBox="0 0 800 350" width="100%" aria-label="Bee swarm chart showing communication trait distributions">
        {/* X-axis ticks at top */}
        {ticks.map((t, i) => {
          const x = valueToX(t);
          return (
            <g key={t}>
              <line
                x1={x}
                y1={20}
                x2={x}
                y2={ROW_START_Y + TRAITS.length * ROW_SPACING - 30}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <text
                x={x}
                y={14}
                textAnchor="middle"
                fill="#9aa0ac"
                fontSize={11}
                fontFamily="Inter, sans-serif"
              >
                {tickLabels[i]}
              </text>
            </g>
          );
        })}

        {/* Trait rows */}
        {TRAITS.map((trait, rowIndex) => {
          const rowY = ROW_START_Y + rowIndex * ROW_SPACING;
          const label =
            PERSONALITY_DIMENSION_NAMES[trait.key] ?? trait.key;
          const stat = statsByKey.get(trait.key);
          const meanX = stat ? valueToX(stat.mean) : null;

          return (
            <g key={trait.key}>
              {/* Trait label */}
              <text
                x={140}
                y={rowY + 4}
                textAnchor="end"
                fill="#e4e4e7"
                fontSize={13}
                fontFamily="Inter, sans-serif"
                fontWeight={500}
              >
                {label}
              </text>

              {/* Faint baseline */}
              <line
                x1={X_MIN}
                y1={rowY}
                x2={X_MAX}
                y2={rowY}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />

              {/* Individual dots */}
              {personalityVectors.map((vector, dotIndex) => {
                const value = vector[trait.index];
                if (value === undefined || value === null) return null;
                const cx = valueToX(value);
                const cy = rowY + deterministicJitter(dotIndex, value);
                const opacity = 0.3 + ((dotIndex * 3) % 10) * 0.01;
                return (
                  <circle
                    key={dotIndex}
                    cx={cx}
                    cy={cy}
                    r={2.5}
                    fill={trait.color}
                    opacity={opacity}
                  />
                );
              })}

              {/* Mean line */}
              {meanX !== null && (
                <>
                  <line
                    x1={meanX}
                    y1={rowY - JITTER_RANGE - 4}
                    x2={meanX}
                    y2={rowY + JITTER_RANGE + 4}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <text
                    x={meanX}
                    y={rowY - JITTER_RANGE - 8}
                    textAnchor="middle"
                    fill="#9aa0ac"
                    fontSize={9}
                    fontFamily="Inter, sans-serif"
                  >
                    avg
                  </text>
                </>
              )}

              {/* Distribution shape annotation */}
              <text
                x={X_MAX + 10}
                y={rowY + 4}
                textAnchor="start"
                fill={trait.color}
                fontSize={10}
                fontFamily="Inter, sans-serif"
                opacity={0.5}
              >
                {trait.annotation}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
