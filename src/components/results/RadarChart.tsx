"use client";

import { useState, useCallback, useRef, useMemo, useLayoutEffect, useId } from "react";

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
  /** Container pixel width — enables scale-compensated label sizing. */
  containerWidth?: number;
  /** When false, disables all hover/click/tooltip interaction even if sectorGroups exist. Defaults to true. */
  interactive?: boolean;
}

// ---------------------------------------------------------------------------
// Label splitting helper
// ---------------------------------------------------------------------------

/** Split a label into 1–2 lines for better fit on small viewports. */
function splitLabel(text: string): string[] {
  const words = text.split(" ");
  if (words.length <= 1) return [text];
  if (words.length === 2) return text.length <= 12 ? [text] : words;
  if (words.length === 3) return [words[0], words.slice(1).join(" ")];
  // 4+ words: split at midpoint
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
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
    x: Math.round((cx + radius * Math.cos(angleRad)) * 100) / 100,
    y: Math.round((cy + radius * Math.sin(angleRad)) * 100) / 100,
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
  containerWidth = 0,
  interactive = true,
}: RadarChartProps) {
  const uid = useId();
  const n = categories.length;
  const hasSectors = !!sectorGroups && sectorGroups.length > 0;
  const isInteractive =
    interactive &&
    (hasSectors || (!!tooltipLabels && tooltipLabels.length > 0) || !!onCategoryHover);

  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipTextRef = useRef<SVGTextElement>(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);
  const activeIndex = tappedIndex ?? hoveredIndex;

  const cx = size / 2;
  const cy = size / 2;
  const labelPad = size * (hasSectors ? 0.22 : 0.2);
  const maxRadius = cx - labelPad;
  const labelFontSize = 12;
  const labelRadius = maxRadius + 14;
  const arcRadius = maxRadius + 8;
  const sectorLabelRadius = arcRadius + 20;
  const gridRings = [25, 50, 75, 100];
  const subtleStroke = "rgba(255,255,255,0.06)";
  const step = 360 / n;

  // Scale-compensated font size for category labels
  const TARGET_ACTUAL_PX = 11;
  const MAX_COMPENSATED = 15;
  const rawScaleFactor = containerWidth > 0 ? containerWidth / size : 1;
  const compensatedFontSize = Math.min(
    MAX_COMPENSATED,
    Math.max(labelFontSize, TARGET_ACTUAL_PX / rawScaleFactor)
  );
  // Scale-compensated tooltip font size — matches sector label size on mobile
  const TOOLTIP_BASE = 11;
  const TOOLTIP_TARGET_PX = 12;
  const tooltipFontSize = containerWidth > 0
    ? Math.min(20, Math.max(TOOLTIP_BASE, TOOLTIP_TARGET_PX / rawScaleFactor))
    : TOOLTIP_BASE;
  // ViewBox padding prevents label clipping on small containers
  const fontGrowth = compensatedFontSize - labelFontSize;
  const fontGrowthPad =
    !hasSectors && fontGrowth > 0 ? Math.round(fontGrowth * 6 + 6) : 0;
  // Size-based padding for small charts (share cards at 320) where labels
  // are proportionally wider relative to the viewBox
  const sizeBasedPad = !hasSectors && size < 480 ? 24 : 0;
  // Sector charts at small sizes need extra padding for arc labels
  const sectorSmallPad = hasSectors && size < 480 ? 32 : 0;
  const vbPad = Math.max(fontGrowthPad, sizeBasedPad, sectorSmallPad);

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
      if (!isInteractive || tappedIndex !== null) return;
      // Don't override label hover — labels handle their own mouse events
      const target = e.target as Element;
      if (target.closest?.("[data-radar='label']")) return;
      const svg = svgRef.current;
      if (!svg) return;
      const { x, y } = svgPoint(svg, e.clientX, e.clientY);
      const nearest = findNearestDot(x, y, dotPositions, hitThreshold);
      if (nearest !== hoveredIndex) {
        setHoveredIndex(nearest);
        onCategoryHover?.(nearest);
      }
    },
    [isInteractive, tappedIndex, dotPositions, hitThreshold, hoveredIndex, onCategoryHover]
  );

  const handleMouseLeave = useCallback(() => {
    if (tappedIndex !== null) return;
    setHoveredIndex(null);
    onCategoryHover?.(null);
  }, [tappedIndex, onCategoryHover]);

  // --- Tap to sticky-toggle on mobile ---
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isInteractive) return;
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
    [isInteractive, dotPositions, hitThreshold, onCategoryHover]
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
    isInteractive && activeIndex !== null
      ? sectorGroups?.find((g) => g.indices.includes(activeIndex))
      : null;

  // Tooltip — only shown when tooltipLabels are provided (not just onCategoryHover)
  const tooltipContent =
    isInteractive && activeIndex !== null && tooltipLabels
      ? {
        label: tooltipLabels[activeIndex] ?? categories[activeIndex],
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
  }, [tooltipContent?.label, tooltipFontSize]);

  let tooltipX = cx;
  let tooltipY = cy;
  if (activeIndex !== null) {
    const angle = step * activeIndex;
    // Offset outward from center
    const outward = polarToCartesian(cx, cy, maxRadius + 4, angle);
    tooltipX = outward.x;
    tooltipY = outward.y;
    const pillPadX = 12 * (tooltipFontSize / TOOLTIP_BASE);
    const halfPill = (tooltipWidth + pillPadX * 2) / 2;
    tooltipX = Math.max(-vbPad + halfPill + 4, Math.min(size + vbPad - halfPill - 4, tooltipX));
    tooltipY = Math.max(-vbPad + 20, Math.min(size + vbPad - 20, tooltipY));
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`${-vbPad} ${-vbPad} ${size + vbPad * 2} ${size + vbPad * 2}`}
      style={{ maxWidth: "100%", height: "auto", overflow: "visible", cursor: isInteractive ? "crosshair" : undefined }}
      className={className}
      aria-hidden="true"
      onMouseMove={isInteractive ? handleMouseMove : undefined}
      onMouseLeave={isInteractive ? handleMouseLeave : undefined}
      onClick={isInteractive ? handleSvgClick : undefined}
    >
      {/* Glow filters */}
      {hasSectors && (
        <defs>
          {sectorGroups!.map((group) => (
            <filter
              key={`glow-${group.label}`}
              id={`${uid}-arc-glow-${group.label.replace(/\s+/g, "-")}`}
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

          const glowFilterId = `${uid}-arc-glow-${group.label.replace(/\s+/g, "-")}`;

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
                fontSize={16}
                fontFamily="'Inter Tight', Inter, sans-serif"
                fontWeight={700}
                letterSpacing="0.1em"
                fill={group.color}
                opacity={isGroupActive ? 1 : 0.5}
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
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.35)"
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
        const isActive = activeIndex === i || activeCategoryIndex === i;
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
          // Push top/bottom labels slightly further out to avoid overlap
          const angleRad = ((angle - 90) * Math.PI) / 180;
          const sinA = Math.sin(angleRad);
          const verticalness = Math.abs(sinA);
          // Bottom labels need more room (multi-line text grows downward)
          const isBottom = sinA > 0;
          const extraPad = verticalness * (isBottom ? 18 : 12);
          const { x, y } = polarToCartesian(
            cx,
            cy,
            labelRadius + extraPad,
            angle
          );
          const anchor = textAnchor(x, cx);
          const isActive = activeIndex === i || activeCategoryIndex === i;
          const isLabelClickable = !!onCategoryHover || isInteractive;

          const labelColor = dotColors?.[i] ?? accentColor;
          const glowOpacity = isActive ? "99" : "33"; // 60% vs 20% alpha
          const textShadow = `0 0 10px ${labelColor}${glowOpacity}, 0 0 20px ${labelColor}${glowOpacity}`;

          const lines = splitLabel(label.toUpperCase());
          const lineHeight = compensatedFontSize * 1.25;
          const baseY = y - ((lines.length - 1) * lineHeight) / 2;

          return (
            <text
              key={i}
              data-radar="label"
              x={x}
              y={baseY}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={compensatedFontSize}
              fill={isActive ? "#ffffff" : labelColor}
              opacity={isActive ? 0.85 : 0.55}
              fontFamily="'Inter Tight', Inter, sans-serif"
              fontWeight={600}
              letterSpacing="0.08em"
              style={{
                textShadow,
                transition: "all 0.2s ease",
                cursor: isLabelClickable ? "pointer" : "default",
                pointerEvents: isLabelClickable ? "all" : "none",
              }}
              onMouseEnter={
                isLabelClickable
                  ? () => {
                      setHoveredIndex(i);
                      onCategoryHover?.(i);
                    }
                  : undefined
              }
              onMouseLeave={
                isLabelClickable
                  ? () => {
                      setHoveredIndex(null);
                      onCategoryHover?.(tappedIndex ?? null);
                    }
                  : undefined
              }
              onClick={
                isLabelClickable
                  ? (e) => {
                      e.stopPropagation();
                      if (tappedIndex === i) {
                        // Un-sticky — mouse still here, keep showing via hover
                        setTappedIndex(null);
                        onCategoryHover?.(i);
                      } else {
                        setTappedIndex(i);
                        onCategoryHover?.(i);
                      }
                    }
                  : undefined
              }
              onTouchEnd={
                isLabelClickable
                  ? (e) => {
                      e.preventDefault();
                      if (tappedIndex === i) {
                        // Un-sticky on mobile — dismiss fully (no hover)
                        setTappedIndex(null);
                        setHoveredIndex(null);
                        onCategoryHover?.(null);
                      } else {
                        setTappedIndex(i);
                        setHoveredIndex(i);
                        onCategoryHover?.(i);
                      }
                    }
                  : undefined
              }
            >
              {lines.map((line, j) => (
                <tspan key={j} x={x} dy={j === 0 ? 0 : lineHeight}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}

      {/* Floating tooltip */}
      {tooltipContent && activeIndex !== null && (() => {
        const pillPadX = 12 * (tooltipFontSize / TOOLTIP_BASE);
        const pillW = tooltipWidth + pillPadX * 2;
        const pillH = tooltipFontSize + 17;
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
              fontSize={tooltipFontSize}
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
