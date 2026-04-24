"use client";

import { RadarChart } from "@/components/results/RadarChart";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
import {
  PERSONALITY_DIMENSION_CATEGORIES,
  PERSONALITY_DIMENSION_NAMES,
} from "@/lib/assessment/personality-dimensions";

interface CorpusCommunicationRadarProps {
  corpusAvgPersonalityVector: Record<string, number>;
}

const ACCENT_COLOR = "#4da3ff";

const SECTOR_COLORS: Record<string, string> = {
  "Energy & Dynamism": "#5cc8ff",
  "Confidence & Authority": "#4da3ff",
  "Warmth & Interpersonal": "#f28b82",
  "Communication Style": "#b79cff",
  "Self-Presentation": "#e9b949",
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

  const keyToIndex = new Map(profile.map((point, index) => [point.category, index]));

  const categories = profile.map((point) => point.category);
  const studentScores = profile.map((point) => point.value * 100);
  const tooltipLabels = profile.map(
    (point) => PERSONALITY_DIMENSION_NAMES[point.category] ?? point.category,
  );

  const sectorGroups = Object.entries(PERSONALITY_DIMENSION_CATEGORIES).map(
    ([categoryName, keys]) => ({
      label: SECTOR_FULL_LABELS[categoryName] ?? categoryName,
      color: SECTOR_COLORS[categoryName] ?? ACCENT_COLOR,
      indices: keys
        .map((key) => keyToIndex.get(key))
        .filter((index): index is number => index !== undefined),
    }),
  );

  const dotColors = profile.map((point) => {
    for (const [categoryName, keys] of Object.entries(PERSONALITY_DIMENSION_CATEGORIES)) {
      if (keys.includes(point.category)) {
        return SECTOR_COLORS[categoryName] ?? ACCENT_COLOR;
      }
    }
    return ACCENT_COLOR;
  });

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full max-w-md min-h-[300px]"
    >
      <RadarChart
        categories={categories}
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
