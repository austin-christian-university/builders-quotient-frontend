"use client";

import { useState, useCallback, useRef, useMemo, useLayoutEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SectorGroup {
  label: string;
  color: string;
  indices: number[];
}

interface RadarChartProps {
  categories: string[];
  studentScores: number[];
  corpusScores?: number[];
  accentColor: string;
  size?: number;
  className?: string;
  onCategoryHover?: (index: number | null) => void;
  activeCategoryIndex?: number | null;
  sectorGroups?: SectorGroup[];
  tooltipLabels?: string[];
  /** Per-dot colors (one per category). Falls back to accentColor. */
  dotColors?: string[];
  maxValue?: number;
  /**
   * Controls which grid/axis lines are drawn:
   * - "full" (default): concentric rings + axis lines to each category
   * - "axesOnly": no rings, only axis lines to each category
   * - "crosshair": no rings or axes, just vertical + horizontal center lines
   */
  gridStyle?: "full" | "axesOnly" | "crosshair";
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

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

const VISUAL_FLOOR_PCT = 0.08;

function buildPolygonPoints(
  scores: number[],
  cx: number,
  cy: number,
  maxRadius: number,
  maxValue: number
): string {
  const floor = maxValue * VISUAL_FLOOR_PCT;
  return scores
    .map((score, i) => {
      const angle = (360 / scores.length) * i;
      const r = (Math.max(score, floor) / maxValue) * maxRadius;
      const { x, y } = polarToCartesian(cx, cy, r, angle);
      return `${x},${y}`;
    })
    .join(" ");
}

function textAnchor(x: number, cx: number): "start" | "middle" | "end" {
  const tolerance = cx * 0.05;
  if (x < cx - tolerance) return "end";
  if (x > cx + tolerance) return "start";
  return "middle";
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Find the nearest point index within a pixel threshold. */
function findNearestDot(
  mouseX: number,
  mouseY: number,
  dotPositions: { x: number; y: number }[],
  threshold: number
): number | null {
  let bestIdx: number | null = null;
  let bestDist = Infinity;
  for (let i = 0; i < dotPositions.length; i++) {
    const dx = mouseX - dotPositions[i].x;
    const dy = mouseY - dotPositions[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist && dist <= threshold) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RadarChart({
  categories,
  studentScores,
  corpusScores,
  accentColor,
  size = 480,
  className,
  onCategoryHover,
  activeCategoryIndex,
  sectorGroups,
  tooltipLabels,
  dotColors,
  maxValue = 100,
  gridStyle = "full",
}: RadarChartProps) {
  const n = categories.length;
  const hasSectors = !!sectorGroups && sectorGroups.length > 0;

  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipTextRef = useRef<SVGTextElement>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);
  const activeIndex = tappedIndex ?? hoveredIndex;

  const cx = size / 2;
  const cy = size / 2;
  const labelPad = size * (hasSectors ? 0.26 : 0.2);
  const maxRadius = cx - labelPad;
  const labelFontSize = 12;
  const labelRadius = maxRadius + 14;
  const arcRadius = maxRadius + 8;
  const sectorLabelRadius = arcRadius + 20;
  const gridRings = [25, 50, 75, 100];
  const subtleStroke = "rgba(255,255,255,0.06)";
  const step = 360 / n;

  // Pre-compute dot positions (in SVG coords)
  const dotPositions = useMemo(() => {
    const floor = maxValue * VISUAL_FLOOR_PCT;
    return studentScores.map((score, i) => {
      const angle = step * i;
      const r = (Math.max(score, floor) / maxValue) * maxRadius;
      return polarToCartesian(cx, cy, r, angle);
    });
  }, [studentScores, step, maxRadius, cx, cy, maxValue]);

  // Hit threshold in SVG units (~30px visual, generous for touch)
  const hitThreshold = size * 0.07;

  // --- Single onMouseMove on SVG finds the nearest dot ---
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!hasSectors || tappedIndex !== null) return;
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = svgPoint(svg, e.clientX, e.clientY);
      const nearest = findNearestDot(x, y, dotPositions, hitThreshold);
      if (nearest !== hoveredIndex) {
        setHoveredIndex(nearest);
        onCategoryHover?.(nearest);
      }
    },
    [hasSectors, tappedIndex, dotPositions, hitThreshold, hoveredIndex, onCategoryHover]
  );

  const handleMouseLeave = useCallback(() => {
    if (tappedIndex !== null) return;
    setHoveredIndex(null);
    onCategoryHover?.(null);
  }, [tappedIndex, onCategoryHover]);

  // --- Tap to sticky-toggle on mobile ---
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!hasSectors) return;
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = svgPoint(svg, e.clientX, e.clientY);
      const nearest = findNearestDot(x, y, dotPositions, hitThreshold);
      if (nearest !== null) {
        // Tapped a dot: toggle sticky
        setTappedIndex((prev) => (prev === nearest ? null : nearest));
        setHoveredIndex(nearest);
        onCategoryHover?.(nearest);
      } else {
        // Tapped empty space: dismiss
        setTappedIndex(null);
        setHoveredIndex(null);
        onCategoryHover?.(null);
      }
    },
    [hasSectors, dotPositions, hitThreshold, onCategoryHover]
  );

  // --- Sector label click highlights that group ---
  const handleSectorLabelClick = useCallback(
    (group: SectorGroup) => {
      const midIdx = group.indices[Math.floor(group.indices.length / 2)];
      setTappedIndex((prev) => (prev === midIdx ? null : midIdx));
      setHoveredIndex(midIdx);
      onCategoryHover?.(midIdx);
    },
    [onCategoryHover]
  );

  // Build polygon points
  const studentPoints = buildPolygonPoints(studentScores, cx, cy, maxRadius, maxValue);
  const corpusPoints = corpusScores
    ? buildPolygonPoints(corpusScores, cx, cy, maxRadius, maxValue)
    : null;
  const studentFill = `${accentColor}1F`;

  // Active group
  const activeGroup =
    hasSectors && activeIndex !== null
      ? sectorGroups!.find((g) => g.indices.includes(activeIndex))
      : null;

  // Tooltip
  const tooltipContent =
    hasSectors && activeIndex !== null
      ? {
          label: tooltipLabels?.[activeIndex] ?? categories[activeIndex],
          groupName: activeGroup?.label ?? "",
          groupColor: activeGroup?.color ?? accentColor,
        }
      : null;

  // Measure tooltip text width after render so the pill auto-sizes
  useLayoutEffect(() => {
    if (tooltipTextRef.current) {
      const bbox = tooltipTextRef.current.getBBox();
      setTooltipWidth(bbox.width);
    }
  }, [tooltipContent?.label]);

  let tooltipX = cx;
  let tooltipY = cy;
  if (activeIndex !== null) {
    const angle = step * activeIndex;
    const pos = dotPositions[activeIndex];
    // Offset outward from center
    const outward = polarToCartesian(cx, cy, maxRadius + 4, angle);
    tooltipX = outward.x;
    tooltipY = outward.y;
    const halfPill = (tooltipWidth + 24) / 2; // 12px LR padding
    tooltipX = Math.max(halfPill + 4, Math.min(size - halfPill - 4, tooltipX));
    tooltipY = Math.max(20, Math.min(size - 20, tooltipY));
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      style={{ maxWidth: "100%", height: "auto", overflow: "visible", cursor: hasSectors ? "crosshair" : undefined }}
      className={className}
      aria-hidden="true"
      onMouseMove={hasSectors ? handleMouseMove : undefined}
      onMouseLeave={hasSectors ? handleMouseLeave : undefined}
      onClick={hasSectors ? handleSvgClick : undefined}
    >
      {/* Glow filters */}
      {hasSectors && (
        <defs>
          {sectorGroups!.map((group) => (
            <filter
              key={`glow-${group.label}`}
              id={`arc-glow-${group.label.replace(/\s+/g, "-")}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>
      )}

      {/* Grid rings (full mode only) */}
      {gridStyle === "full" &&
        gridRings.map((pct) => {
          const r = (pct / 100) * maxRadius;
          const ringPoints = Array.from({ length: n }, (_, i) => {
            const angle = step * i;
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

      {/* Crosshair: vertical + horizontal center lines */}
      {gridStyle === "crosshair" && (
        <>
          <line
            x1={cx}
            y1={cy - maxRadius}
            x2={cx}
            y2={cy + maxRadius}
            stroke={subtleStroke}
            strokeWidth={1}
          />
          <line
            x1={cx - maxRadius}
            y1={cy}
            x2={cx + maxRadius}
            y2={cy}
            stroke={subtleStroke}
            strokeWidth={1}
          />
        </>
      )}

      {/* Axis lines (full + axesOnly) */}
      {gridStyle !== "crosshair" &&
        categories.map((_, i) => {
          const angle = step * i;
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

      {/* Sector arcs + labels */}
      {hasSectors &&
        sectorGroups!.map((group) => {
          if (group.indices.length === 0) return null;
          const firstIdx = Math.min(...group.indices);
          const lastIdx = Math.max(...group.indices);
          const startAngle = step * firstIdx - step * 0.45;
          const endAngle = step * lastIdx + step * 0.45;
          const midAngle = (step * firstIdx + step * lastIdx) / 2;
          const arcLabelPos = polarToCartesian(cx, cy, sectorLabelRadius, midAngle);
          const anchor = textAnchor(arcLabelPos.x, cx);

          const isGroupActive =
            activeIndex !== null && group.indices.includes(activeIndex);

          const glowFilterId = `arc-glow-${group.label.replace(/\s+/g, "-")}`;

          return (
            <g key={group.label}>
              {/* Visible arc */}
              <path
                d={describeArc(cx, cy, arcRadius, startAngle, endAngle)}
                fill="none"
                stroke={group.color}
                strokeWidth={isGroupActive ? 4 : 2.5}
                strokeLinecap="round"
                opacity={isGroupActive ? 0.85 : 0.2}
                filter={isGroupActive ? `url(#${glowFilterId})` : undefined}
                style={{
                  transition: "opacity 0.15s ease, stroke-width 0.15s ease",
                  pointerEvents: "none",
                }}
              />

              {/* Section label */}
              <text
                x={arcLabelPos.x}
                y={arcLabelPos.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={12}
                fontFamily="'Inter Tight', Inter, sans-serif"
                fontWeight={700}
                letterSpacing="0.1em"
                fill={group.color}
                opacity={isGroupActive ? 1 : 0.4}
                style={{
                  transition: "opacity 0.15s ease",
                  cursor: "pointer",
                  pointerEvents: "all",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSectorLabelClick(group);
                }}
              >
                {group.label}
              </text>
            </g>
          );
        })}

      {/* Corpus polygon */}
      {corpusPoints && (
        <polygon
          data-radar="corpus"
          points={corpusPoints}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          style={{ pointerEvents: "none" }}
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
        style={{ pointerEvents: "none" }}
      />

      {/* Vertex dots (purely visual — interaction is via SVG-level mouse tracking) */}
      {dotPositions.map(({ x, y }, i) => {
        const isActive = activeIndex === i;
        const dotColor = dotColors?.[i] ?? accentColor;
        return (
          <g key={i} style={{ pointerEvents: "none" }}>
            {isActive && (
              <circle cx={x} cy={y} r={14} fill={dotColor} opacity={0.18} />
            )}
            <circle
              data-radar="dot"
              cx={x}
              cy={y}
              r={isActive ? 6 : 4}
              fill={dotColor}
              stroke="#0a0a0c"
              strokeWidth={2}
            />
          </g>
        );
      })}

      {/* Category labels (non-sector mode only) */}
      {!hasSectors &&
        categories.map((label, i) => {
          const angle = step * i;
          const { x, y } = polarToCartesian(cx, cy, labelRadius, angle);
          const anchor = textAnchor(x, cx);
          const isActive = activeCategoryIndex === i;
          const isInteractive = !!onCategoryHover;
          return (
            <text
              key={i}
              data-radar="label"
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={labelFontSize}
              fill={isActive ? "#f5f6fa" : "#9aa0ac"}
              fontFamily="Inter, sans-serif"
              style={isInteractive ? { cursor: "pointer" } : undefined}
              onMouseEnter={
                isInteractive ? () => onCategoryHover(i) : undefined
              }
              onMouseLeave={
                isInteractive ? () => onCategoryHover(null) : undefined
              }
              onClick={
                isInteractive
                  ? () => onCategoryHover(activeCategoryIndex === i ? null : i)
                  : undefined
              }
            >
              {label}
            </text>
          );
        })}

      {/* Floating tooltip */}
      {tooltipContent && activeIndex !== null && (() => {
        const pillW = tooltipWidth + 24; // 12px padding each side
        const pillH = 28;
        return (
          <g style={{ pointerEvents: "none" }}>
            <rect
              x={tooltipX - pillW / 2}
              y={tooltipY - pillH / 2}
              width={pillW}
              height={pillH}
              rx={pillH / 2}
              fill="rgba(10,10,12,0.94)"
              stroke={tooltipContent.groupColor}
              strokeWidth={1}
              strokeOpacity={0.5}
            />
            <text
              ref={tooltipTextRef}
              x={tooltipX}
              y={tooltipY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={600}
              fill="#f5f6fa"
              fontFamily="Inter, sans-serif"
            >
              {tooltipContent.label}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
