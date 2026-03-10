"use client";

interface RadarChartProps {
  categories: string[];
  studentScores: number[];
  corpusScores?: number[];
  accentColor: string;
  size?: number;
  className?: string;
}

/**
 * Convert polar coordinates to Cartesian.
 * Angle 0 = 12 o'clock (top), increases clockwise.
 */
function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

/**
 * Build a polygon `points` string from a list of scores (0–100) mapped
 * to the chart's max radius, one per axis.
 */
function buildPolygonPoints(
  scores: number[],
  cx: number,
  cy: number,
  maxRadius: number
): string {
  return scores
    .map((score, i) => {
      const angle = (360 / scores.length) * i;
      const r = (score / 100) * maxRadius;
      const { x, y } = polarToCartesian(cx, cy, r, angle);
      return `${x},${y}`;
    })
    .join(" ");
}

/**
 * Pick text-anchor based on horizontal position relative to center.
 * A small tolerance band around the center uses "middle".
 */
function textAnchor(x: number, cx: number): "start" | "middle" | "end" {
  const tolerance = cx * 0.05;
  if (x < cx - tolerance) return "end";
  if (x > cx + tolerance) return "start";
  return "middle";
}

export function RadarChart({
  categories,
  studentScores,
  corpusScores,
  accentColor,
  size = 480,
  className,
}: RadarChartProps) {
  const n = categories.length;
  const cx = size / 2;
  const cy = size / 2;

  // Leave room for labels: ~15% padding on each side
  const labelPad = size * 0.18;
  const maxRadius = cx - labelPad;

  // Label font size: smaller for dense charts
  const labelFontSize = n > 12 ? 9 : 10;

  // Push labels slightly beyond the 100% ring
  const labelRadius = maxRadius + labelPad * 0.55;

  const gridRings = [25, 50, 75, 100];
  const subtleStroke = "rgba(255,255,255,0.06)";

  const studentPoints = buildPolygonPoints(studentScores, cx, cy, maxRadius);
  const corpusPoints = corpusScores
    ? buildPolygonPoints(corpusScores, cx, cy, maxRadius)
    : null;

  // Student fill: accentColor hex + "1F" for ~12% opacity
  const studentFill = `${accentColor}1F`;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ maxWidth: "100%", height: "auto" }}
      className={className}
      aria-hidden="true"
    >
      {/* Grid rings */}
      {gridRings.map((pct) => {
        const r = (pct / 100) * maxRadius;
        const ringPoints = Array.from({ length: n }, (_, i) => {
          const angle = (360 / n) * i;
          const { x, y } = polarToCartesian(cx, cy, r, angle);
          return `${x},${y}`;
        }).join(" ");
        return (
          <polygon
            key={pct}
            data-radar="grid"
            points={ringPoints}
            fill="none"
            stroke={subtleStroke}
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {categories.map((_, i) => {
        const angle = (360 / n) * i;
        const { x, y } = polarToCartesian(cx, cy, maxRadius, angle);
        return (
          <line
            key={i}
            data-radar="axis"
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={subtleStroke}
            strokeWidth={1}
          />
        );
      })}

      {/* Corpus polygon (optional peer-relative overlay) */}
      {corpusPoints && (
        <polygon
          data-radar="corpus"
          points={corpusPoints}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}

      {/* Student polygon */}
      <polygon
        data-radar="student"
        points={studentPoints}
        fill={studentFill}
        stroke={accentColor}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Student vertex dots */}
      {studentScores.map((score, i) => {
        const angle = (360 / n) * i;
        const r = (score / 100) * maxRadius;
        const { x, y } = polarToCartesian(cx, cy, r, angle);
        return (
          <circle
            key={i}
            data-radar="dot"
            cx={x}
            cy={y}
            r={4}
            fill={accentColor}
            stroke="#0a0a0c"
            strokeWidth={2}
          />
        );
      })}

      {/* Category labels */}
      {categories.map((label, i) => {
        const angle = (360 / n) * i;
        const { x, y } = polarToCartesian(cx, cy, labelRadius, angle);
        const anchor = textAnchor(x, cx);
        return (
          <text
            key={i}
            data-radar="label"
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={labelFontSize}
            fill="#9aa0ac"
            fontFamily="Inter, sans-serif"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
