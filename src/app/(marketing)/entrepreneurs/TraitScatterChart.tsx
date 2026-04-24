"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  PERSONALITY_DIMENSION_CATEGORIES,
  PERSONALITY_DIMENSION_NAMES,
} from "@/lib/assessment/personality-dimensions";
import { findNearestDot } from "@/components/entrepreneurs/scatter-utils";

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

/** Map a mouse/touch event to SVG coordinates. */
function svgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const transformed = pt.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
}

export default function TraitScatterChart({
  traitStats,
}: TraitScatterChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipTextRef = useRef<SVGTextElement>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tappedKey, setTappedKey] = useState<string | null>(null);
  const activeKey = tappedKey ?? hoveredKey;

  const yTicks = [0, 0.05, 0.1, 0.15, 0.2, 0.25];
  const xTicks = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

  // Pre-compute positions in SVG coords for hit-testing
  const dotPositions = useMemo(
    () =>
      traitStats.map((trait) => ({
        key: trait.key,
        x: scaleX(trait.mean),
        y: scaleY(trait.stddev),
      })),
    [traitStats]
  );

  // Hit threshold in SVG units — generous for touch
  const HIT_THRESHOLD = 22;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (tappedKey !== null) return;
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = svgPoint(svg, e.clientX, e.clientY);
      const nearest = findNearestDot(x, y, dotPositions, HIT_THRESHOLD);
      const nextKey = nearest !== null ? dotPositions[nearest].key : null;
      if (nextKey !== hoveredKey) setHoveredKey(nextKey);
    },
    [dotPositions, hoveredKey, tappedKey]
  );

  const handleMouseLeave = useCallback(() => {
    if (tappedKey !== null) return;
    setHoveredKey(null);
  }, [tappedKey]);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = svgPoint(svg, e.clientX, e.clientY);
      const nearest = findNearestDot(x, y, dotPositions, HIT_THRESHOLD);
      if (nearest !== null) {
        const key = dotPositions[nearest].key;
        setTappedKey((prev) => (prev === key ? null : key));
        setHoveredKey(key);
      } else {
        setTappedKey(null);
        setHoveredKey(null);
      }
    },
    [dotPositions]
  );

  const activeTrait = activeKey
    ? traitStats.find((t) => t.key === activeKey) ?? null
    : null;
  const activePos = activeKey
    ? dotPositions.find((d) => d.key === activeKey) ?? null
    : null;
  const activeCategory = activeTrait ? getCategoryForKey(activeTrait.key) : undefined;
  const activeColor = activeTrait ? getColorForKey(activeTrait.key) : "#4da3ff";
  const activeTitle = activeTrait
    ? PERSONALITY_DIMENSION_NAMES[activeTrait.key] ?? activeTrait.key
    : "";

  // Measure tooltip text width after render so the pill auto-sizes
  useLayoutEffect(() => {
    if (tooltipTextRef.current) {
      const bbox = tooltipTextRef.current.getBBox();
      setTooltipWidth(bbox.width);
    }
  }, [activeTitle]);

  // Tooltip pill geometry
  const TOOLTIP_FONT = 12;
  const TOOLTIP_SUB_FONT = 10.5;
  const pillPadX = 12;
  const pillPadY = 7;
  const lineGap = 3;
  const pillH = TOOLTIP_FONT + TOOLTIP_SUB_FONT + lineGap + pillPadY * 2 + 12; // + eyebrow
  const pillW = Math.max(tooltipWidth + pillPadX * 2, 120);

  let tooltipX = 0;
  let tooltipY = 0;
  if (activePos) {
    tooltipX = activePos.x;
    tooltipY = activePos.y - pillH / 2 - 12;
    // Clamp horizontally within the SVG viewBox
    tooltipX = Math.max(pillW / 2 + 4, Math.min(WIDTH - pillW / 2 - 4, tooltipX));
    // If pill would overflow top, flip below the dot
    if (tooltipY - pillH / 2 < 4) {
      tooltipY = activePos.y + pillH / 2 + 12;
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto" style={{ overflow: "visible" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        style={{
          overflow: "visible",
          cursor: activeKey ? "pointer" : "default",
          touchAction: "manipulation",
        }}
        role="img"
        aria-label="Scatter plot of average communication trait score versus variability"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleSvgClick}
      >
        {/* Box outline — all 4 sides */}
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />

        <text
          x={6}
          y={MARGIN.top + PLOT_H / 2}
          textAnchor="middle"
          fill="#9aa0ac"
          fontSize={13}
          fontFamily="Inter, sans-serif"
          transform={`rotate(-90, 6, ${MARGIN.top + PLOT_H / 2})`}
        >
          Std Deviation
        </text>
        <text
          x={MARGIN.left + PLOT_W / 2}
          y={HEIGHT - 1}
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
            y={scaleY(tick) + 3}
            textAnchor="end"
            fill="#9aa0ac"
            fontSize={11}
            fontFamily="Inter, sans-serif"
          >
            {tick.toFixed(2)}
          </text>
        ))}

        {xTicks.map((tick) => (
          <text
            key={`label-x-${tick}`}
            x={scaleX(tick)}
            y={HEIGHT - MARGIN.bottom + 14}
            textAnchor="middle"
            fill="#9aa0ac"
            fontSize={11}
            fontFamily="Inter, sans-serif"
          >
            {Math.round(tick * 100)}%
          </text>
        ))}

        {traitStats.map((trait) => {
          const cx = scaleX(trait.mean);
          const cy = scaleY(trait.stddev);
          const color = getColorForKey(trait.key);
          const isActive = activeKey === trait.key;

          return (
            <g key={trait.key} style={{ pointerEvents: "none" }}>
              {isActive && (
                <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.18} />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 7 : 5.75}
                fill={color}
                stroke={isActive ? "#f5f6fa" : "rgba(10,10,12,0.9)"}
                strokeWidth={isActive ? 1.5 : 1}
                opacity={isActive ? 1 : 0.9}
                style={{ transition: "all 150ms ease" }}
              />
            </g>
          );
        })}

        {/* In-SVG tooltip pill (stays within viewBox, scales with chart) */}
        {activeTrait && activePos && (
          <g style={{ pointerEvents: "none" }}>
            <rect
              x={tooltipX - pillW / 2}
              y={tooltipY - pillH / 2}
              width={pillW}
              height={pillH}
              rx={10}
              fill="rgba(17,17,19,0.96)"
              stroke={`${activeColor}55`}
              strokeWidth={1}
            />
            {/* Eyebrow (category) */}
            <text
              x={tooltipX - pillW / 2 + pillPadX}
              y={tooltipY - pillH / 2 + pillPadY + 8}
              fontSize={9.5}
              fontWeight={600}
              fill={activeColor}
              fontFamily="'Inter Tight', Inter, sans-serif"
              letterSpacing="0.08em"
              style={{ textTransform: "uppercase" }}
            >
              {activeCategory ? CATEGORY_LABELS[activeCategory] : "Trait"}
            </text>
            {/* Title */}
            <text
              ref={tooltipTextRef}
              x={tooltipX - pillW / 2 + pillPadX}
              y={tooltipY - pillH / 2 + pillPadY + 8 + TOOLTIP_FONT + 4}
              fontSize={TOOLTIP_FONT}
              fontWeight={600}
              fill="#f5f6fa"
              fontFamily="Inter, sans-serif"
            >
              {activeTitle}
            </text>
            {/* Sub-line: mean / SD */}
            <text
              x={tooltipX - pillW / 2 + pillPadX}
              y={tooltipY - pillH / 2 + pillPadY + 8 + TOOLTIP_FONT + 4 + TOOLTIP_SUB_FONT + lineGap}
              fontSize={TOOLTIP_SUB_FONT}
              fill="#9aa0ac"
              fontFamily="Inter, sans-serif"
            >
              {`Mean ${Math.round(activeTrait.mean * 100)}% \u00B7 SD ${activeTrait.stddev.toFixed(3)}`}
            </text>
          </g>
        )}
      </svg>

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
