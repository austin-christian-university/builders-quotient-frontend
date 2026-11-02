"use client";

import {
  BEE_SWARM_WIDTH as WIDTH,
  BEE_SWARM_HEIGHT as HEIGHT,
  BEE_SWARM_MARGIN as MARGIN,
  X_MIN,
  X_RANGE,
  JITTER_RANGE,
  MOBILE_STRIP_VIEWBOX_W,
  MOBILE_STRIP_VIEWBOX_H,
  valueToX,
  mobileValueToX,
  deterministicJitter,
  formatRange,
} from "./bee-swarm-utils";

interface BeeSwarmChartProps {
  personalityVectors: number[][];
  traitStats: {
    key: string;
    mean: number;
    stddev: number;
    min: number;
    max: number;
  }[];
}

// Swiss Ink: every row is labelled, so rows share one ink colour; the mean
// marker is the single vermilion element.
const DOT_COLOR = "#111111";
const MEAN_COLOR = "#e8452c";

const TRAITS = [
  { key: "pv_06", index: 5, label: "Composure" },
  { key: "pv_17", index: 16, label: "Formality" },
  { key: "pv_18", index: 17, label: "Vulnerability" },
  { key: "pv_10", index: 9, label: "Humor" },
  { key: "pv_16", index: 15, label: "Conciseness" },
] as const;

const ROW_START_Y = 62;
const ROW_SPACING = 54;

const MOBILE_STRIP_CENTER_Y = MOBILE_STRIP_VIEWBOX_H / 2;
const MOBILE_JITTER = 18;

export default function BeeSwarmChart({
  personalityVectors,
  traitStats,
}: BeeSwarmChartProps) {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const statsByKey = new Map(traitStats.map((stat) => [stat.key, stat]));

  return (
    <div className="w-full" style={{ overflow: "visible" }}>
      {/* Desktop: wide multi-row SVG */}
      <div className="hidden md:block" style={{ overflow: "visible" }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          style={{ overflow: "visible" }}
          role="img"
          aria-label="Distribution strips showing selected communication traits across entrepreneurs"
        >
          <rect
            x={X_MIN}
            y={24}
            width={X_RANGE}
            height={HEIGHT - 24 - MARGIN.bottom}
            fill="none"
            stroke="#d9d5cb"
            strokeWidth={1}
          />

          <text
            x={X_MIN - 18}
            y={18}
            textAnchor="end"
            fill="#8c8a84"
            fontSize={13}
            fontWeight={500}
            fontFamily="Inter Tight, Inter, sans-serif"
          >
            Selected traits
          </text>
          <text
            x={WIDTH - 4}
            y={18}
            textAnchor="end"
            fill="#8c8a84"
            fontSize={13}
            fontWeight={500}
            fontFamily="Inter Tight, Inter, sans-serif"
          >
            Observed range
          </text>

          {ticks.map((tick) => {
            const x = valueToX(tick);
            return (
              <g key={tick}>
                <text
                  x={x}
                  y={HEIGHT - 10}
                  textAnchor="middle"
                  fill="#6b6963"
                  fontSize={14}
                  fontFamily="Inter, sans-serif"
                >
                  {Math.round(tick * 100)}%
                </text>
              </g>
            );
          })}

          {TRAITS.map((trait, rowIndex) => {
            const rowY = ROW_START_Y + rowIndex * ROW_SPACING;
            const stat = statsByKey.get(trait.key);
            const meanX = stat ? valueToX(stat.mean) : null;

            return (
              <g key={trait.key}>
                <text
                  x={X_MIN - 14}
                  y={rowY + 5}
                  textAnchor="end"
                  fill="#111111"
                  fontSize={14}
                  fontWeight={500}
                  fontFamily="Inter, sans-serif"
                >
                  {trait.label}
                </text>

                {personalityVectors.map((vector, dotIndex) => {
                  const value = vector[trait.index];
                  if (value === undefined || value === null) return null;

                  return (
                    <circle
                      key={`${trait.key}-${dotIndex}`}
                      cx={valueToX(value)}
                      cy={rowY + deterministicJitter(dotIndex, value)}
                      r={2.6}
                      fill={DOT_COLOR}
                      opacity={0.14 + (dotIndex % 5) * 0.04}
                    />
                  );
                })}

                {meanX !== null && (
                  <>
                    <line
                      x1={meanX}
                      y1={rowY - JITTER_RANGE - 4}
                      x2={meanX}
                      y2={rowY + JITTER_RANGE + 4}
                      stroke={MEAN_COLOR}
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={meanX}
                      cy={rowY}
                      r={4}
                      fill="transparent"
                      stroke={MEAN_COLOR}
                      strokeWidth={1.5}
                    />
                  </>
                )}

                <text
                  x={WIDTH - 4}
                  y={rowY + 4}
                  textAnchor="end"
                  fill="#111111"
                  fontSize={13}
                  fontWeight={600}
                  fontFamily="Inter Tight, Inter, sans-serif"
                >
                  {stat ? formatRange(stat.min, stat.max) : "\u2014"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mobile: stacked strip cards, one per trait */}
      <div className="md:hidden flex flex-col border-t border-ink">
        {TRAITS.map((trait) => {
          const stat = statsByKey.get(trait.key);
          const meanX = stat ? mobileValueToX(stat.mean) : null;

          return (
            <div
              key={trait.key}
              className="border-b border-border py-3"
              role="img"
              aria-label={`Distribution of ${trait.label} across entrepreneurs`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-semibold text-text-primary"
                  style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                >
                  {trait.label}
                </span>
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                >
                  {stat ? formatRange(stat.min, stat.max) : "\u2014"}
                </span>
              </div>

              <svg
                viewBox={`0 0 ${MOBILE_STRIP_VIEWBOX_W} ${MOBILE_STRIP_VIEWBOX_H}`}
                preserveAspectRatio="none"
                className="h-14 w-full"
                aria-hidden="true"
              >
                {personalityVectors.map((vector, dotIndex) => {
                  const value = vector[trait.index];
                  if (value === undefined || value === null) return null;

                  return (
                    <circle
                      key={`${trait.key}-m-${dotIndex}`}
                      cx={mobileValueToX(value)}
                      cy={
                        MOBILE_STRIP_CENTER_Y +
                        deterministicJitter(dotIndex, value, MOBILE_JITTER)
                      }
                      r={2.4}
                      fill={DOT_COLOR}
                      opacity={0.18 + (dotIndex % 5) * 0.04}
                    />
                  );
                })}

                {meanX !== null && (
                  <>
                    <line
                      x1={meanX}
                      y1={6}
                      x2={meanX}
                      y2={MOBILE_STRIP_VIEWBOX_H - 6}
                      stroke={MEAN_COLOR}
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={meanX}
                      cy={MOBILE_STRIP_CENTER_Y}
                      r={3.5}
                      fill="transparent"
                      stroke={MEAN_COLOR}
                      strokeWidth={1.5}
                    />
                  </>
                )}
              </svg>

              <div
                className="mt-1 flex justify-between text-[10px] tabular-nums text-text-secondary"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink/50" />
          <span>Each dot is one entrepreneur</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-0.5 bg-vermilion" />
          <span>Mean marker</span>
        </div>
      </div>
    </div>
  );
}
