"use client";

import { useState } from "react";
import {
  PERSONALITY_DIMENSION_NAMES,
  PERSONALITY_DIMENSION_CATEGORIES,
} from "@/lib/assessment/personality-dimensions";

interface TraitScatterChartProps {
  traitStats: {
    key: string;
    mean: number;
    stddev: number;
    min: number;
    max: number;
  }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Energy & Dynamism": "#2dd4bf",
  "Confidence & Authority": "#63b3ed",
  "Warmth & Interpersonal": "#f87171",
  "Communication Style": "#a78bfa",
  "Self-Presentation": "#fbbf24",
};

function getCategoryForKey(key: string): string | undefined {
  for (const [category, keys] of Object.entries(
    PERSONALITY_DIMENSION_CATEGORIES,
  )) {
    if (keys.includes(key)) return category;
  }
  return undefined;
}

function getColorForKey(key: string): string {
  const category = getCategoryForKey(key);
  return category ? CATEGORY_COLORS[category] : "#9aa0ac";
}

/** Short display name from the full dimension name. */
function getShortName(key: string): string {
  const full = PERSONALITY_DIMENSION_NAMES[key] ?? key;
  // Take the first meaningful word(s)
  return full
    .replace(/^Overall\s+/i, "")
    .replace(/\s+level$/i, "")
    .replace(/\s+under pressure$/i, "")
    .replace(/\s+in speech$/i, "")
    .replace(/\s+and\s+/gi, " & ")
    .replace(/\/.*$/, "")
    .replace(/\s+orientation$/i, "")
    .replace(/\s+precision$/i, "")
    .replace(/\s+intensity$/i, "")
    .replace(/\s+display$/i, "")
    .replace(/\s+in interaction$/i, "")
    .replace(/\s+vs\s+elaboration$/i, "");
}

// Chart layout constants
const MARGIN = { top: 20, right: 30, bottom: 40, left: 55 };
const WIDTH = 800;
const HEIGHT = 400;
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

// Axis ranges
const X_MIN = 0.35;
const X_MAX = 1.0;
const Y_MIN = 0;
const Y_MAX = 0.25;

function scaleX(value: number): number {
  return MARGIN.left + ((value - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

// Y is inverted: 0 (universal) at bottom, 0.25 (polarizing) at top
function scaleY(value: number): number {
  return MARGIN.top + (1 - value / Y_MAX) * PLOT_H;
}

// Notable trait labels with leader-line offsets
const NOTABLE_TRAITS: Record<
  string,
  { labelDx: number; labelDy: number; align: "start" | "middle" | "end" }
> = {
  pv_06: { labelDx: 20, labelDy: 14, align: "start" }, // Composure — bottom-right, most universal
  pv_17: { labelDx: 0, labelDy: -16, align: "middle" }, // Formality — top, most variable
  pv_16: { labelDx: -20, labelDy: -8, align: "end" }, // Conciseness — left, lowest mean
};

export default function TraitScatterChart({
  traitStats,
}: TraitScatterChartProps) {
  const [hovered, setHovered] = useState<{
    key: string;
    x: number;
    y: number;
  } | null>(null);

  const yTicks = [0, 0.05, 0.1, 0.15, 0.2, 0.25];
  const xTicks = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  return (
    <div className="w-full min-h-[300px]" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%">
        {/* Grid lines — horizontal (stddev) */}
        {yTicks.map((tick) => (
          <line
            key={`grid-y-${tick}`}
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={scaleY(tick)}
            y2={scaleY(tick)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={tick === 0 ? 1.5 : 0.75}
          />
        ))}

        {/* Grid lines — vertical (mean) */}
        {xTicks.map((tick) => (
          <line
            key={`grid-x-${tick}`}
            x1={scaleX(tick)}
            x2={scaleX(tick)}
            y1={MARGIN.top}
            y2={HEIGHT - MARGIN.bottom}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.75}
          />
        ))}

        {/* Quadrant labels */}
        <text
          x={scaleX(0.85)}
          y={scaleY(0.02)}
          textAnchor="middle"
          fill="rgba(255,255,255,0.08)"
          fontSize={13}
          fontWeight={600}
        >
          High + Universal
        </text>
        <text
          x={scaleX(0.85)}
          y={scaleY(0.22)}
          textAnchor="middle"
          fill="rgba(255,255,255,0.08)"
          fontSize={13}
          fontWeight={600}
        >
          High + Variable
        </text>
        <text
          x={scaleX(0.48)}
          y={scaleY(0.02)}
          textAnchor="middle"
          fill="rgba(255,255,255,0.08)"
          fontSize={13}
          fontWeight={600}
        >
          Low + Universal
        </text>
        <text
          x={scaleX(0.48)}
          y={scaleY(0.22)}
          textAnchor="middle"
          fill="rgba(255,255,255,0.08)"
          fontSize={13}
          fontWeight={600}
        >
          Low + Variable
        </text>

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={`label-y-${tick}`}
            x={MARGIN.left - 8}
            y={scaleY(tick) + 3.5}
            textAnchor="end"
            fill="#9aa0ac"
            fontSize={10}
          >
            {tick.toFixed(2)}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((tick) => (
          <text
            key={`label-x-${tick}`}
            x={scaleX(tick)}
            y={HEIGHT - MARGIN.bottom + 16}
            textAnchor="middle"
            fill="#9aa0ac"
            fontSize={10}
          >
            {Math.round(tick * 100)}%
          </text>
        ))}

        {/* Axis titles */}
        <text
          x={MARGIN.left + PLOT_W / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          fill="#9aa0ac"
          fontSize={11}
        >
          Mean Score
        </text>
        <text
          x={14}
          y={MARGIN.top + PLOT_H / 2}
          textAnchor="middle"
          fill="#9aa0ac"
          fontSize={11}
          transform={`rotate(-90, 14, ${MARGIN.top + PLOT_H / 2})`}
        >
          Std Deviation (variability)
        </text>

        {/* Axis border lines */}
        <line
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={HEIGHT - MARGIN.bottom}
          y2={HEIGHT - MARGIN.bottom}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
        <line
          x1={MARGIN.left}
          x2={MARGIN.left}
          y1={MARGIN.top}
          y2={HEIGHT - MARGIN.bottom}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />

        {/* Notable trait leader lines + labels */}
        {traitStats.map((trait) => {
          const notable = NOTABLE_TRAITS[trait.key];
          if (!notable) return null;
          const cx = scaleX(trait.mean);
          const cy = scaleY(trait.stddev);
          const lx = cx + notable.labelDx;
          const ly = cy + notable.labelDy;
          return (
            <g key={`label-${trait.key}`}>
              <line
                x1={cx}
                y1={cy}
                x2={lx}
                y2={ly}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={0.75}
              />
              <text
                x={lx + (notable.align === "start" ? 4 : notable.align === "end" ? -4 : 0)}
                y={ly + (notable.labelDy < 0 ? -4 : 4)}
                textAnchor={notable.align}
                fill="#d1d5db"
                fontSize={11}
                fontWeight={500}
              >
                {getShortName(trait.key)}
              </text>
            </g>
          );
        })}

        {/* Data points */}
        {traitStats.map((trait) => {
          const cx = scaleX(trait.mean);
          const cy = scaleY(trait.stddev);
          const color = getColorForKey(trait.key);
          return (
            <circle
              key={trait.key}
              cx={cx}
              cy={cy}
              r={7}
              fill={color}
              opacity={hovered?.key === trait.key ? 1 : 0.85}
              stroke={hovered?.key === trait.key ? "#fff" : "none"}
              strokeWidth={hovered?.key === trait.key ? 1.5 : 0}
              style={{ cursor: "pointer", transition: "opacity 150ms" }}
              onMouseEnter={(e) => {
                const svg = e.currentTarget.closest("svg");
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                const svgWidth = rect.width;
                const scale = svgWidth / WIDTH;
                setHovered({
                  key: trait.key,
                  x: rect.left + cx * scale,
                  y: rect.top + cy * scale,
                });
              }}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (() => {
        const trait = traitStats.find((t) => t.key === hovered.key);
        if (!trait) return null;
        const name = PERSONALITY_DIMENSION_NAMES[trait.key] ?? trait.key;
        return (
          <div
            style={{
              position: "fixed",
              left: hovered.x,
              top: hovered.y - 60,
              transform: "translateX(-50%)",
              pointerEvents: "none",
              zIndex: 50,
            }}
          >
            <div
              style={{
                background: "rgba(17,17,19,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                color: "#e5e7eb",
                whiteSpace: "nowrap",
                backdropFilter: "blur(8px)",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{name}</div>
              <div style={{ color: "#9aa0ac" }}>
                Mean: {Math.round(trait.mean * 100)}% &middot; SD:{" "}
                {trait.stddev.toFixed(3)}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div
            key={category}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#9aa0ac",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: color,
                opacity: 0.85,
              }}
            />
            {category}
          </div>
        ))}
      </div>
    </div>
  );
}
