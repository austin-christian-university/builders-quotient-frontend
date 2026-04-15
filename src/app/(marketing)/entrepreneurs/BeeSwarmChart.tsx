"use client";

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

const TRAITS = [
  { key: "pv_06", index: 5, label: "Composure", color: "#4da3ff" },
  { key: "pv_17", index: 16, label: "Formality", color: "#e9b949" },
  { key: "pv_18", index: 17, label: "Vulnerability", color: "#f28b82" },
  { key: "pv_10", index: 9, label: "Humor", color: "#66d4a4" },
  { key: "pv_16", index: 15, label: "Conciseness", color: "#b79cff" },
] as const;

const WIDTH = 860;
const HEIGHT = 360;
const MARGIN = { top: 32, right: 78, bottom: 44, left: 120 };
const X_MIN = MARGIN.left;
const X_MAX = WIDTH - MARGIN.right;
const X_RANGE = X_MAX - X_MIN;
const ROW_START_Y = 62;
const ROW_SPACING = 54;
const JITTER_RANGE = 14;

function valueToX(value: number): number {
  return X_MIN + Math.max(0, Math.min(1, value)) * X_RANGE;
}

function deterministicJitter(index: number, value: number): number {
  const seed = Math.sin(index * 78.233 + value * 437.1) * 43758.5453;
  return ((seed - Math.floor(seed)) * 2 - 1) * JITTER_RANGE;
}

function formatRange(min: number, max: number): string {
  return `${Math.round(min * 100)}\u2013${Math.round(max * 100)}%`;
}

export default function BeeSwarmChart({
  personalityVectors,
  traitStats,
}: BeeSwarmChartProps) {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const statsByKey = new Map(traitStats.map((stat) => [stat.key, stat]));

  return (
    <div className="w-full" style={{ overflow: "visible" }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ overflow: "visible" }}
        role="img"
        aria-label="Distribution strips showing selected communication traits across entrepreneurs"
      >
        {/* Box outline around data area */}
        <rect
          x={X_MIN}
          y={24}
          width={X_RANGE}
          height={HEIGHT - 24 - MARGIN.bottom}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />

        <text
          x={X_MIN - 18}
          y={18}
          textAnchor="end"
          fill="rgba(255,255,255,0.42)"
          fontSize={12}
          fontWeight={500}
          fontFamily="Inter Tight, Inter, sans-serif"
          letterSpacing="0.22em"
        >
          SELECTED TRAITS
        </text>
        <text
          x={WIDTH - 4}
          y={18}
          textAnchor="end"
          fill="rgba(255,255,255,0.42)"
          fontSize={12}
          fontWeight={500}
          fontFamily="Inter Tight, Inter, sans-serif"
          letterSpacing="0.22em"
        >
          OBSERVED RANGE
        </text>

        {ticks.map((tick) => {
          const x = valueToX(tick);
          return (
            <g key={tick}>
              <text
                x={x}
                y={HEIGHT - 10}
                textAnchor="middle"
                fill="#9aa0ac"
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
                fill="#f5f6fa"
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
                    fill={trait.color}
                    opacity={0.22 + (dotIndex % 5) * 0.05}
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
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth={1.1}
                  />
                  <circle
                    cx={meanX}
                    cy={rowY}
                    r={4}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.68)"
                    strokeWidth={1.2}
                  />
                </>
              )}

              <text
                x={WIDTH - 4}
                y={rowY + 4}
                textAnchor="end"
                fill={trait.color}
                fontSize={12}
                fontWeight={600}
                fontFamily="Inter Tight, Inter, sans-serif"
              >
                {stat ? formatRange(stat.min, stat.max) : "\u2014"}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary/65">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-white/60" />
          <span>Each dot is one entrepreneur</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-px bg-white/60" />
          <span>Mean marker</span>
        </div>
      </div>
    </div>
  );
}
