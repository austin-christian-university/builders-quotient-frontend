"use client";

import { useState } from "react";
import {
  PERSONALITY_DIMENSION_CATEGORIES,
  PERSONALITY_DIMENSION_NAMES,
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
  "Energy & Dynamism": "#5cc8ff",
  "Confidence & Authority": "#4da3ff",
  "Warmth & Interpersonal": "#f28b82",
  "Communication Style": "#b79cff",
  "Self-Presentation": "#e9b949",
};

const CATEGORY_LABELS: Record<string, string> = {
  "Energy & Dynamism": "Energy",
  "Confidence & Authority": "Confidence",
  "Warmth & Interpersonal": "Warmth",
  "Communication Style": "Style",
  "Self-Presentation": "Presentation",
};

const HIGHLIGHT_TRAITS: Record<
  string,
  {
    dx: number;
    dy: number;
    align: "start" | "middle" | "end";
    label: string;
    color: string;
  }
> = {
  pv_06: {
    dx: 18,
    dy: 18,
    align: "start",
    label: "Composure",
    color: "#4da3ff",
  },
  pv_17: {
    dx: 0,
    dy: -20,
    align: "middle",
    label: "Formality",
    color: "#e9b949",
  },
  pv_16: {
    dx: -18,
    dy: -18,
    align: "end",
    label: "Conciseness",
    color: "#b79cff",
  },
};

const MARGIN = { top: 24, right: 16, bottom: 48, left: 52 };
const WIDTH = 400;
const HEIGHT = 320;
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

const X_MIN = 0.35;
const X_MAX = 1;
const Y_MAX = 0.25;

function getCategoryForKey(key: string): string | undefined {
  for (const [category, keys] of Object.entries(PERSONALITY_DIMENSION_CATEGORIES)) {
    if (keys.includes(key)) return category;
  }
  return undefined;
}

function getColorForKey(key: string): string {
  const category = getCategoryForKey(key);
  return category ? CATEGORY_COLORS[category] : "#9aa0ac";
}

function scaleX(value: number): number {
  return MARGIN.left + ((value - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

function scaleY(value: number): number {
  return MARGIN.top + (1 - value / Y_MAX) * PLOT_H;
}

export default function TraitScatterChart({
  traitStats,
}: TraitScatterChartProps) {
  const [hovered, setHovered] = useState<{
    key: string;
    x: number;
    y: number;
  } | null>(null);

  const yTicks = [0, 0.05, 0.1, 0.15, 0.2, 0.25];
  const xTicks = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Scatter plot of average communication trait score versus variability"
      >
        {yTicks.map((tick) => (
          <line
            key={`grid-y-${tick}`}
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={scaleY(tick)}
            y2={scaleY(tick)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={tick === 0 ? 1.2 : 0.8}
          />
        ))}

        {xTicks.map((tick) => (
          <line
            key={`grid-x-${tick}`}
            x1={scaleX(tick)}
            x2={scaleX(tick)}
            y1={MARGIN.top}
            y2={HEIGHT - MARGIN.bottom}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.8}
          />
        ))}

        <line
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={HEIGHT - MARGIN.bottom}
          y2={HEIGHT - MARGIN.bottom}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
        <line
          x1={MARGIN.left}
          x2={MARGIN.left}
          y1={MARGIN.top}
          y2={HEIGHT - MARGIN.bottom}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />

        <text
          x={14}
          y={MARGIN.top + PLOT_H / 2}
          textAnchor="middle"
          fill="#9aa0ac"
          fontSize={13}
          fontFamily="Inter, sans-serif"
          transform={`rotate(-90, 14, ${MARGIN.top + PLOT_H / 2})`}
        >
          Std Deviation
        </text>
        <text
          x={MARGIN.left + PLOT_W / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          fill="#9aa0ac"
          fontSize={13}
          fontFamily="Inter, sans-serif"
        >
          Mean Score
        </text>

        {yTicks.map((tick) => (
          <text
            key={`label-y-${tick}`}
            x={MARGIN.left - 8}
            y={scaleY(tick) + 3.5}
            textAnchor="end"
            fill="#9aa0ac"
            fontSize={13}
            fontFamily="Inter, sans-serif"
          >
            {tick.toFixed(2)}
          </text>
        ))}

        {xTicks.map((tick) => (
          <text
            key={`label-x-${tick}`}
            x={scaleX(tick)}
            y={HEIGHT - MARGIN.bottom + 16}
            textAnchor="middle"
            fill="#9aa0ac"
            fontSize={13}
            fontFamily="Inter, sans-serif"
          >
            {Math.round(tick * 100)}%
          </text>
        ))}

        {traitStats.map((trait) => {
          const highlight = HIGHLIGHT_TRAITS[trait.key];
          if (!highlight) return null;

          const cx = scaleX(trait.mean);
          const cy = scaleY(trait.stddev);
          const lx = cx + highlight.dx;
          const ly = cy + highlight.dy;

          return (
            <g key={`highlight-${trait.key}`}>
              <line
                x1={cx}
                y1={cy}
                x2={lx}
                y2={ly}
                stroke="rgba(255,255,255,0.26)"
                strokeWidth={0.8}
              />
              <text
                x={lx + (highlight.align === "start" ? 4 : highlight.align === "end" ? -4 : 0)}
                y={ly + (highlight.dy < 0 ? -4 : 4)}
                textAnchor={highlight.align}
                fill={highlight.color}
                fontSize={13}
                fontWeight={600}
                fontFamily="Inter Tight, Inter, sans-serif"
              >
                {highlight.label}
              </text>
            </g>
          );
        })}

        {traitStats.map((trait) => {
          const cx = scaleX(trait.mean);
          const cy = scaleY(trait.stddev);
          const color = getColorForKey(trait.key);
          const isHovered = hovered?.key === trait.key;

          return (
            <g key={trait.key}>
              {isHovered && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill={color}
                  opacity={0.18}
                />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 7 : 5.75}
                fill={color}
                stroke={isHovered ? "#f5f6fa" : "rgba(10,10,12,0.9)"}
                strokeWidth={isHovered ? 1.5 : 1}
                opacity={isHovered ? 1 : 0.9}
                style={{ cursor: "pointer", transition: "all 150ms ease" }}
                onMouseEnter={(event) =>
                  setHovered({
                    key: trait.key,
                    x: event.clientX,
                    y: event.clientY,
                  })
                }
                onMouseMove={(event) =>
                  setHovered({
                    key: trait.key,
                    x: event.clientX,
                    y: event.clientY,
                  })
                }
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}
      </svg>

      {hovered && (() => {
        const trait = traitStats.find((item) => item.key === hovered.key);
        if (!trait) return null;

        const category = getCategoryForKey(trait.key);
        const color = getColorForKey(trait.key);

        return (
          <div
            style={{
              position: "fixed",
              left: hovered.x + 14,
              top: Math.max(16, hovered.y - 64),
              pointerEvents: "none",
              zIndex: 50,
            }}
          >
            <div
              style={{
                minWidth: 168,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(17,17,19,0.94)",
                padding: "10px 12px",
                color: "#f5f6fa",
                backdropFilter: "blur(18px)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color,
                  marginBottom: 4,
                  fontFamily: "'Inter Tight', Inter, sans-serif",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {category ? CATEGORY_LABELS[category] : "Trait"}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {PERSONALITY_DIMENSION_NAMES[trait.key] ?? trait.key}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#9aa0ac",
                }}
              >
                Mean {Math.round(trait.mean * 100)}% &middot; SD {trait.stddev.toFixed(3)}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-text-secondary/65">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{CATEGORY_LABELS[category]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
