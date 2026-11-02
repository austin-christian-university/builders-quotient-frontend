"use client";

import { RadarChart } from "@/components/results/RadarChart";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
import { Section } from "@/components/swiss/Swiss";
import {
  PERSONALITY_DIMENSION_NAMES,
  PERSONALITY_DIMENSION_CATEGORIES,
} from "@/lib/assessment/personality-dimensions";

interface CommunicationStyleSectionProps {
  personalityVector: Record<string, number>;
  corpusAvgPersonalityVector: Record<string, number> | null;
  communicationNarrative: {
    communication_style: string;
    signature_moves: { title: string; description: string }[];
    strengths: string;
    blindspots: string;
  } | null;
  entrepreneurName: string;
  /** Section number shown in the label column. */
  n?: string;
}

// Swiss Ink: the entrepreneur's shape is ink; sectors are told apart by ink,
// vermilion and two greys rather than a rainbow.
const ACCENT_COLOR = "#111111";

const SECTOR_COLORS: Record<string, string> = {
  "Energy & Dynamism": "#111111",
  "Confidence & Authority": "#e8452c",
  "Warmth & Interpersonal": "#8c8a84",
  "Communication Style": "#5e5c57",
  "Self-Presentation": "#c8c4ba",
};

const SECTOR_FULL_LABELS: Record<string, string> = {
  "Energy & Dynamism": "Energy",
  "Confidence & Authority": "Confidence",
  "Warmth & Interpersonal": "Warmth",
  "Communication Style": "Style",
  "Self-Presentation": "Presentation",
};

export function CommunicationStyleSection({
  personalityVector,
  corpusAvgPersonalityVector,
  communicationNarrative,
  entrepreneurName,
  n,
}: CommunicationStyleSectionProps) {
  const [containerRef, containerWidth] = useContainerWidth();

  // Build ordered profile from pv_01–pv_20
  const orderedKeys = Object.keys(PERSONALITY_DIMENSION_NAMES);
  const profile = orderedKeys.map((key) => ({
    category: key,
    value: personalityVector[key] ?? 0,
  }));

  const keyToIndex = new Map(profile.map((p, i) => [p.category, i]));

  const categoryNames = profile.map((p) => p.category);
  const studentScores = profile.map((p) => p.value * 100);
  const tooltipLabels = profile.map(
    (p) => PERSONALITY_DIMENSION_NAMES[p.category] ?? p.category
  );

  const sectorGroups = Object.entries(PERSONALITY_DIMENSION_CATEGORIES).map(
    ([catName, keys]) => ({
      label: SECTOR_FULL_LABELS[catName] ?? catName,
      color: SECTOR_COLORS[catName] ?? ACCENT_COLOR,
      indices: keys
        .map((k) => keyToIndex.get(k))
        .filter((i): i is number => i !== undefined),
    })
  );

  const dotColors = profile.map((p) => {
    for (const [catName, keys] of Object.entries(PERSONALITY_DIMENSION_CATEGORIES)) {
      if (keys.includes(p.category)) {
        return SECTOR_COLORS[catName] ?? ACCENT_COLOR;
      }
    }
    return ACCENT_COLOR;
  });

  const corpusScores = corpusAvgPersonalityVector
    ? profile.map((p) => (corpusAvgPersonalityVector[p.category] ?? 0) * 100)
    : undefined;

  return (
    <Section
      n={n}
      label="Communication"
      title={<>How {entrepreneurName} Presents &amp; Connects</>}
      lede="Analyzed from video interviews — how this entrepreneur communicates across 20 behavioral dimensions"
    >
      {/* Radar chart */}
      <div ref={containerRef} className="w-full max-w-lg min-h-[300px]">
        <RadarChart
          categories={categoryNames}
          studentScores={studentScores}
          corpusScores={corpusScores}
          accentColor={ACCENT_COLOR}
          sectorGroups={sectorGroups}
          tooltipLabels={tooltipLabels}
          dotColors={dotColors}
          containerWidth={containerWidth}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Chart legend">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-ink" aria-hidden="true" />
          <span className="text-sm text-text-secondary">This Entrepreneur</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-[#8c8a84] bg-[#c8c4ba]/40" aria-hidden="true" />
          <span className="text-sm text-text-secondary">Corpus Average</span>
        </div>
      </div>

      {/* Narrative content */}
      {communicationNarrative !== null && (
        <div className="mt-14">
          {/* Communication style pull quote */}
          {communicationNarrative.communication_style.length > 0 && (
            <p className="max-w-[40ch] text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.2] tracking-[-0.03em]">
              {communicationNarrative.communication_style}
            </p>
          )}

          {/* Signature moves */}
          {communicationNarrative.signature_moves.length > 0 && (
            <div className="mt-14">
              <h3 className="text-sm text-[#8c8a84]">Signature Moves</h3>
              <ol className="mt-4 border-t border-ink">
                {communicationNarrative.signature_moves.map((move, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[2.5rem_1fr] gap-x-2 border-b border-border py-6 md:grid-cols-[3rem_14rem_1fr] md:gap-x-6"
                  >
                    <span className="text-sm font-semibold tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <h4 className="text-[17px] font-semibold leading-snug tracking-[-0.02em]">{move.title}</h4>
                    <p className="col-start-2 mt-2 text-[15px] leading-relaxed text-[#3d3c39] md:col-start-3 md:mt-0">
                      {move.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Strengths and Blindspots */}
          {(communicationNarrative.strengths.length > 0 ||
            communicationNarrative.blindspots.length > 0) && (
            <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2">
              {communicationNarrative.strengths.length > 0 && (
                <div className="border-t-2 border-vermilion pt-5">
                  <h4 className="text-[17px] font-semibold tracking-[-0.02em]">Strengths</h4>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#3d3c39]">
                    {communicationNarrative.strengths}
                  </p>
                </div>
              )}
              {communicationNarrative.blindspots.length > 0 && (
                <div className="border-t border-ink pt-5">
                  <h4 className="text-[17px] font-semibold tracking-[-0.02em]">Blindspots</h4>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#3d3c39]">
                    {communicationNarrative.blindspots}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
