"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

interface ScatterDot {
  id: string;
  name: string;
  x: number; // d1 score
  y: number; // d2 score
  archetypeKey: string;
}

interface ScatterPlotProps {
  dots: ScatterDot[];
  xLabelNegative: string;
  xLabelPositive: string;
  yLabelNegative: string;
  yLabelPositive: string;
  title: string;
  /** Highlight a specific entrepreneur by ID */
  highlightId?: string;
  className?: string;
}

const SIZE = 400;
const PADDING = 48;
const PLOT_SIZE = SIZE - PADDING * 2;

// Archetype key -> color mapping (derived from primary blue + secondary gold)
const ARCHETYPE_COLORS: Record<string, string> = {
  analytical_exploratory__insight_market: "#4da3ff",
  analytical_exploratory__insight_process: "#6bb4ff",
  analytical_exploratory__validation_market: "#3d8edf",
  analytical_exploratory__validation_process: "#2d79bf",
  analytical_decisive__insight_market: "#e9b949",
  analytical_decisive__insight_process: "#f0ca6a",
  analytical_decisive__validation_market: "#d4a63e",
  analytical_decisive__validation_process: "#bf9333",
  interpersonal_exploratory__insight_market: "#34d399",
  interpersonal_exploratory__insight_process: "#5de0b3",
  interpersonal_exploratory__validation_market: "#2ab885",
  interpersonal_exploratory__validation_process: "#209d6e",
  interpersonal_decisive__insight_market: "#f87171",
  interpersonal_decisive__insight_process: "#fb9a9a",
  interpersonal_decisive__validation_market: "#e05555",
  interpersonal_decisive__validation_process: "#c94040",
};

function getColor(archetypeKey: string): string {
  return ARCHETYPE_COLORS[archetypeKey] ?? "#4da3ff";
}

export function ScatterPlot({
  dots,
  xLabelNegative,
  xLabelPositive,
  yLabelNegative,
  yLabelPositive,
  title,
  highlightId,
  className,
}: ScatterPlotProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Compute scale from data range
  const { scaleX, scaleY } = useMemo(() => {
    if (dots.length === 0) return { scaleX: 1, scaleY: 1 };
    const xVals = dots.map((d) => Math.abs(d.x));
    const yVals = dots.map((d) => Math.abs(d.y));
    const maxX = Math.max(...xVals, 0.001);
    const maxY = Math.max(...yVals, 0.001);
    // Add 20% padding
    return { scaleX: maxX * 1.2, scaleY: maxY * 1.2 };
  }, [dots]);

  const toSvgX = useCallback(
    (x: number) => PADDING + ((x + scaleX) / (2 * scaleX)) * PLOT_SIZE,
    [scaleX]
  );

  const toSvgY = useCallback(
    (y: number) => PADDING + ((scaleY - y) / (2 * scaleY)) * PLOT_SIZE,
    [scaleY]
  );

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    <div className={className}>
      <p
        className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-2 text-center"
        style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
      >
        {title}
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto"
        style={{ maxWidth: 400 }}
      >
        {/* Quadrant background */}
        <rect
          x={PADDING}
          y={PADDING}
          width={PLOT_SIZE}
          height={PLOT_SIZE}
          fill="transparent"
          rx={8}
        />

        {/* Axis lines */}
        <line
          x1={cx}
          y1={PADDING}
          x2={cx}
          y2={SIZE - PADDING}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
        <line
          x1={PADDING}
          y1={cy}
          x2={SIZE - PADDING}
          y2={cy}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />

        {/* Axis labels */}
        <text x={PADDING + 4} y={cy - 6} fontSize={13} fill="#9aa0ac" opacity={0.7}>
          {xLabelNegative}
        </text>
        <text
          x={SIZE - PADDING - 4}
          y={cy - 6}
          fontSize={13}
          fill="#9aa0ac"
          opacity={0.7}
          textAnchor="end"
        >
          {xLabelPositive}
        </text>
        <text
          x={cx + 6}
          y={PADDING + 14}
          fontSize={13}
          fill="#9aa0ac"
          opacity={0.7}
        >
          {yLabelPositive}
        </text>
        <text
          x={cx + 6}
          y={SIZE - PADDING - 6}
          fontSize={13}
          fill="#9aa0ac"
          opacity={0.7}
        >
          {yLabelNegative}
        </text>

        {/* Dots */}
        {dots.map((dot) => {
          const sx = toSvgX(dot.x);
          const sy = toSvgY(dot.y);
          const isHighlighted = dot.id === highlightId;
          const isHovered = dot.id === hoveredId;
          const color = getColor(dot.archetypeKey);

          return (
            <g key={dot.id}>
              {(isHighlighted || isHovered) && (
                <circle cx={sx} cy={sy} r={12} fill={color} opacity={0.2} />
              )}
              <circle
                cx={sx}
                cy={sy}
                r={isHighlighted ? 6 : isHovered ? 5 : 3.5}
                fill={color}
                stroke={isHighlighted ? "#fff" : "none"}
                strokeWidth={isHighlighted ? 2 : 0}
                opacity={isHighlighted || isHovered ? 1 : 0.6}
                style={{ cursor: "pointer", transition: "r 0.15s ease, opacity 0.15s ease" }}
                onMouseEnter={() => setHoveredId(dot.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => router.push(`/entrepreneurs/${dot.id}`)}
                role="link"
                aria-label={`View profile for ${dot.name}`}
              />
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredId && (() => {
          const dot = dots.find((d) => d.id === hoveredId);
          if (!dot) return null;
          const sx = toSvgX(dot.x);
          const sy = toSvgY(dot.y);
          const tooltipY = sy - 18;
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={sx - 60}
                y={tooltipY - 10}
                width={120}
                height={20}
                rx={10}
                fill="rgba(10,10,12,0.92)"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              <text
                x={sx}
                y={tooltipY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fill="#f5f6fa"
                fontWeight={500}
                fontFamily="Inter, sans-serif"
              >
                {dot.name.length > 18 ? dot.name.slice(0, 16) + "\u2026" : dot.name}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
