"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { findNearestDot } from "./scatter-utils";

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

// Swiss Ink: dots are ink; position (not colour) carries the archetype clusters.
// Vermilion is reserved for the active / highlighted entrepreneur.
const DOT_COLOR = "#111111";
const ACTIVE_COLOR = "#e8452c";

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
  const [tappedId, setTappedId] = useState<string | null>(null);
  const activeId = tappedId ?? hoveredId;

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

  // Pre-compute dot positions in SVG coords for tap hit-testing
  const dotPositions = useMemo(
    () =>
      dots.map((dot) => ({
        id: dot.id,
        x: toSvgX(dot.x),
        y: toSvgY(dot.y),
      })),
    [dots, toSvgX, toSvgY]
  );

  // Hit threshold in SVG units (~28px visual — generous for touch)
  const hitThreshold = 20;

  // Tap empty space on SVG → dismiss
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      // Only dismiss when tapping outside dot hit-circles (they stop propagation)
      const { x, y } = svgPoint(svg, e.clientX, e.clientY);
      const nearest = findNearestDot(x, y, dotPositions, hitThreshold);
      if (nearest === null) {
        setTappedId(null);
        setHoveredId(null);
      }
    },
    [dotPositions]
  );

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  const activeDot = activeId ? dots.find((d) => d.id === activeId) : null;
  const activeDotSvg = activeId
    ? dotPositions.find((d) => d.id === activeId)
    : null;

  return (
    <div className={className}>
      <p className="mb-3 border-b border-ink pb-2 text-sm font-semibold">{title}</p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto"
        style={{ maxWidth: 400, overflow: "visible" }}
        onClick={handleSvgClick}
      >
        {/* Quadrant background */}
        <rect
          x={PADDING}
          y={PADDING}
          width={PLOT_SIZE}
          height={PLOT_SIZE}
          fill="none"
          stroke="#d9d5cb"
          strokeWidth={1}
        />

        {/* Axis lines */}
        <line
          x1={cx}
          y1={PADDING}
          x2={cx}
          y2={SIZE - PADDING}
          stroke="#c8c4ba"
          strokeWidth={1}
        />
        <line
          x1={PADDING}
          y1={cy}
          x2={SIZE - PADDING}
          y2={cy}
          stroke="#c8c4ba"
          strokeWidth={1}
        />

        {/* Axis labels */}
        <text x={PADDING + 4} y={cy - 6} fontSize={13} fill="#6b6963">
          {xLabelNegative}
        </text>
        <text
          x={SIZE - PADDING - 4}
          y={cy - 6}
          fontSize={13}
          fill="#6b6963"
          textAnchor="end"
        >
          {xLabelPositive}
        </text>
        <text
          x={cx + 6}
          y={PADDING + 14}
          fontSize={13}
          fill="#6b6963"
        >
          {yLabelPositive}
        </text>
        <text
          x={cx + 6}
          y={SIZE - PADDING - 6}
          fontSize={13}
          fill="#6b6963"
        >
          {yLabelNegative}
        </text>

        {/* Dots */}
        {dots.map((dot) => {
          const sx = toSvgX(dot.x);
          const sy = toSvgY(dot.y);
          const isHighlighted = dot.id === highlightId;
          const isActive = dot.id === activeId;
          const color = isHighlighted || isActive ? ACTIVE_COLOR : DOT_COLOR;

          return (
            <g key={dot.id}>
              {(isHighlighted || isActive) && (
                <circle cx={sx} cy={sy} r={12} fill={color} opacity={0.2} />
              )}
              <circle
                cx={sx}
                cy={sy}
                r={isHighlighted ? 6 : isActive ? 5 : 3.5}
                fill={color}
                stroke={isHighlighted ? "#111111" : "none"}
                strokeWidth={isHighlighted ? 2 : 0}
                opacity={isHighlighted || isActive ? 1 : 0.45}
                style={{ transition: "r 0.15s ease, opacity 0.15s ease", pointerEvents: "none" }}
              />
              <circle
                cx={sx}
                cy={sy}
                r={12}
                fill="transparent"
                style={{ cursor: "pointer", touchAction: "manipulation" }}
                onMouseEnter={() => {
                  if (tappedId === null) setHoveredId(dot.id);
                }}
                onMouseLeave={() => {
                  if (tappedId === null) setHoveredId(null);
                }}
                onFocus={() => setHoveredId(dot.id)}
                onBlur={() => {
                  if (tappedId === null) setHoveredId(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // On mobile: first tap sticks (shows name pill); on desktop we also accept
                  // the tap pattern, but a subsequent tap on the same dot opens the profile.
                  if (tappedId === dot.id || hoveredId === dot.id) {
                    router.push(`/entrepreneurs/${dot.id}`);
                  } else {
                    setTappedId(dot.id);
                    setHoveredId(dot.id);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`View profile for ${dot.name}`}
              />
            </g>
          );
        })}

        {/* Name pill with outlink arrow */}
        {activeDot && activeDotSvg && (() => {
          const name = activeDot.name.length > 22 ? activeDot.name.slice(0, 20) + "\u2026" : activeDot.name;
          const charW = 6.2; // approx px per char at 11px Inter
          const textW = name.length * charW;
          const arrowBoxW = 22;
          const padX = 10;
          const pillH = 24;
          const pillW = textW + padX * 2 + arrowBoxW;

          // Position above the dot, clamp horizontally to viewBox
          let pillX = activeDotSvg.x - pillW / 2;
          pillX = Math.max(4, Math.min(SIZE - 4 - pillW, pillX));
          const pillY = Math.max(4, activeDotSvg.y - 28);

          return (
            <g>
              <rect
                x={pillX}
                y={pillY}
                width={pillW}
                height={pillH}
                fill="#111111"
                stroke="#111111"
                strokeWidth={1}
                style={{ pointerEvents: "none" }}
              />
              <text
                x={pillX + padX}
                y={pillY + pillH / 2 + 0.5}
                dominantBaseline="middle"
                fontSize={11}
                fill="#f4f1ea"
                fontWeight={500}
                fontFamily="Inter, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {name}
              </text>
              {/* Divider */}
              <line
                x1={pillX + pillW - arrowBoxW}
                y1={pillY + 5}
                x2={pillX + pillW - arrowBoxW}
                y2={pillY + pillH - 5}
                stroke="rgba(244,241,234,0.3)"
                strokeWidth={1}
                style={{ pointerEvents: "none" }}
              />
              {/* Tappable arrow — navigates to profile */}
              <g
                style={{ cursor: "pointer", touchAction: "manipulation" }}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/entrepreneurs/${activeDot.id}`);
                }}
                role="link"
                aria-label={`Open ${activeDot.name}'s profile`}
              >
                <rect
                  x={pillX + pillW - arrowBoxW}
                  y={pillY}
                  width={arrowBoxW}
                  height={pillH}
                  fill="transparent"
                />
                <g
                  transform={`translate(${pillX + pillW - arrowBoxW / 2 - 6}, ${pillY + pillH / 2 - 6})`}
                  style={{ pointerEvents: "none" }}
                >
                  {/* External-link icon: 12x12 */}
                  <path
                    d="M4.5 1.5 H10.5 V7.5"
                    stroke="#e8452c"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M10.5 1.5 L5 7"
                    stroke="#e8452c"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M9 6.5 V10.5 H1.5 V3 H5.5"
                    stroke="#e8452c"
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>
              </g>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
