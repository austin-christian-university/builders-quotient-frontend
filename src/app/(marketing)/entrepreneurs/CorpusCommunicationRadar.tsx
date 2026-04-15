"use client";

import { RadarChart } from "@/components/results/RadarChart";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
import {
  PERSONALITY_DIMENSION_NAMES,
  PERSONALITY_DIMENSION_CATEGORIES,
} from "@/lib/assessment/personality-dimensions";

interface CorpusCommunicationRadarProps {
  corpusAvgPersonalityVector: Record<string, number>;
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

export function CorpusCommunicationRadar({
  corpusAvgPersonalityVector,
}: CorpusCommunicationRadarProps) {
  const [containerRef, containerWidth] = useContainerWidth();

  const orderedKeys = Object.keys(PERSONALITY_DIMENSION_NAMES);
  const profile = orderedKeys.map((key) => ({
    category: key,
    value: corpusAvgPersonalityVector[key] ?? 0,
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

  return (
    <div ref={containerRef} className="w-full max-w-lg mx-auto min-h-[300px]">
      <RadarChart
        categories={categoryNames}
        studentScores={studentScores}
        accentColor={ACCENT_COLOR}
        sectorGroups={sectorGroups}
        tooltipLabels={tooltipLabels}
        dotColors={dotColors}
        containerWidth={containerWidth}
      />
    </div>
  );
}
