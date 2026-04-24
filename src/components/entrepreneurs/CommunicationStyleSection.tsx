"use client";

import { RadarChart } from "@/components/results/RadarChart";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
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
}

const ACCENT_COLOR = "#2dd4bf";

const SECTOR_COLORS: Record<string, string> = {
  "Energy & Dynamism": "#2dd4bf",
  "Confidence & Authority": "#63b3ed",
  "Warmth & Interpersonal": "#f87171",
  "Communication Style": "#a78bfa",
  "Self-Presentation": "#fbbf24",
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
    <section className="px-6 py-12 md:py-16 border-t border-border/50">
      <div className="mx-auto max-w-4xl">
        {/* Section header */}
        <p
          className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-2 text-center"
          style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
        >
          Communication Style
        </p>
        <h2
          className="text-xl font-bold text-text-primary mb-2 text-center"
          style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
        >
          How {entrepreneurName} Presents &amp; Connects
        </h2>
        <p className="text-text-secondary/60 text-sm text-center mb-8 max-w-xl mx-auto">
          Analyzed from video interviews — how this entrepreneur communicates across 20 behavioral dimensions
        </p>

        {/* Radar chart */}
        <div ref={containerRef} className="w-full max-w-lg mx-auto min-h-[300px]">
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
        <div
          className="flex items-center justify-center gap-6 mt-4 mb-10"
          aria-label="Chart legend"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: ACCENT_COLOR }}
              aria-hidden="true"
            />
            <span className="text-sm text-text-secondary">This Entrepreneur</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.3)",
              }}
              aria-hidden="true"
            />
            <span className="text-sm text-text-secondary">Corpus Average</span>
          </div>
        </div>

        {/* Narrative content */}
        {communicationNarrative !== null && (
          <div className="space-y-8">
            {/* Communication style pull quote */}
            {communicationNarrative.communication_style.length > 0 && (
              <p className="text-base text-text-secondary leading-relaxed max-w-2xl mx-auto text-center">
                {communicationNarrative.communication_style}
              </p>
            )}

            {/* Signature moves */}
            {communicationNarrative.signature_moves.length > 0 && (
              <div>
                <h3
                  className="text-sm font-semibold text-text-primary mb-4"
                  style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                >
                  Signature Moves
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {communicationNarrative.signature_moves.map((move, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border/50 bg-white/[0.02] p-5"
                    >
                      <h4 className="text-sm font-semibold text-text-primary mb-2">
                        {move.title}
                      </h4>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {move.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths and Blindspots */}
            {(communicationNarrative.strengths.length > 0 ||
              communicationNarrative.blindspots.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communicationNarrative.strengths.length > 0 && (
                  <div className="rounded-xl border border-border/50 bg-white/[0.02] p-5 border-t-2 border-t-emerald-400/50">
                    <h4
                      className="text-sm font-semibold text-text-primary mb-2"
                      style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                    >
                      Strengths
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {communicationNarrative.strengths}
                    </p>
                  </div>
                )}
                {communicationNarrative.blindspots.length > 0 && (
                  <div className="rounded-xl border border-border/50 bg-white/[0.02] p-5 border-t-2 border-t-amber-400/50">
                    <h4
                      className="text-sm font-semibold text-text-primary mb-2"
                      style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                    >
                      Blindspots
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {communicationNarrative.blindspots}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
