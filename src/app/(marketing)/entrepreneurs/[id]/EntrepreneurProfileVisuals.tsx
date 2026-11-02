"use client";

import { useState, useCallback } from "react";
import { RadarChart } from "@/components/results/RadarChart";
import { ScatterPlot } from "@/components/entrepreneurs/ScatterPlot";
import { getShortLabel } from "@/components/results/short-labels";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
import {
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
} from "@/lib/assessment/scoring-categories";
import type { CorpusMaxScores } from "@/lib/schemas/entrepreneurs";
import { Section } from "@/components/swiss/Swiss";

const INK = "#111111";
const VERMILION = "#e8452c";

function ChartLegend({ color, archetypeName }: { color: string; archetypeName: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Chart legend">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        <span className="text-sm text-text-secondary">This Entrepreneur</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full border border-[#8c8a84] bg-[#c8c4ba]/40" aria-hidden="true" />
        <span className="text-sm text-text-secondary">{archetypeName} Average</span>
      </div>
    </div>
  );
}

interface PracticalIntelligenceSectionProps {
  piScores: Record<string, number>;
  archetypeAvgPiScores: Record<string, number>;
  corpusMax: { pi: Record<string, number> };
  entrepreneurId: string;
  allEntrepreneurs: { id: string; pi_d1_score: number; pi_d2_score: number; ci_d1_score: number; ci_d2_score: number }[];
  archetypeName: string;
  n?: string;
}

export function PracticalIntelligenceSection({
  n,
  piScores,
  archetypeAvgPiScores,
  corpusMax,
  entrepreneurId,
  allEntrepreneurs,
  archetypeName,
}: PracticalIntelligenceSectionProps) {
  const [containerRef, containerWidth] = useContainerWidth();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const piLabels = PI_CANONICAL_CATEGORIES.map(getShortLabel);
  const piStudent = PI_CANONICAL_CATEGORIES.map((c) => piScores[c] ?? 0);
  const piCorpus = PI_CANONICAL_CATEGORIES.map((c) => archetypeAvgPiScores[c] ?? 0);
  const piChartMax = Math.max(...PI_CANONICAL_CATEGORIES.map((c) => corpusMax.pi[c] ?? 0), 0.001);

  const handleHover = useCallback((idx: number | null) => setActiveIndex(idx), []);

  const scatterDots = allEntrepreneurs.map((e) => ({
    id: e.id,
    name: "",
    x: e.pi_d1_score,
    y: e.pi_d2_score,
    archetypeKey: "",
  }));

  return (
    <Section
      n={n}
      label="Problem solving"
      title="Practical Intelligence"
      lede="How this entrepreneur approaches real-world problem solving — from diagnosing situations to planning actions"
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 lg:grid-cols-9">
        <div className="min-w-0 lg:col-span-5">
          <div ref={containerRef} className="w-full max-w-lg min-h-[300px]">
            <RadarChart
              categories={piLabels}
              studentScores={piStudent}
              corpusScores={piCorpus}
              maxValue={piChartMax}
              accentColor={VERMILION}
              onCategoryHover={handleHover}
              activeCategoryIndex={activeIndex}
              containerWidth={containerWidth}
            />
          </div>
          <ChartLegend color={VERMILION} archetypeName={archetypeName} />
        </div>
        <div className="min-w-0 max-w-md border-t border-border pt-6 lg:col-span-4 lg:border-t-0 lg:pt-0">
          <ScatterPlot
            dots={scatterDots}
            title="Practical Intelligence"
            xLabelNegative="Interpersonal"
            xLabelPositive="Analytical"
            yLabelNegative="Decisive"
            yLabelPositive="Exploratory"
            highlightId={entrepreneurId}
          />
        </div>
      </div>
    </Section>
  );
}

interface CreativeIntelligenceSectionProps {
  ciScores: Record<string, number>;
  archetypeAvgCiScores: Record<string, number>;
  corpusMax: { ci: Record<string, number> };
  entrepreneurId: string;
  allEntrepreneurs: { id: string; pi_d1_score: number; pi_d2_score: number; ci_d1_score: number; ci_d2_score: number }[];
  archetypeName: string;
  n?: string;
}

export function CreativeIntelligenceSection({
  n,
  ciScores,
  archetypeAvgCiScores,
  corpusMax,
  entrepreneurId,
  allEntrepreneurs,
  archetypeName,
}: CreativeIntelligenceSectionProps) {
  const [containerRef, containerWidth] = useContainerWidth();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const ciLabels = CI_CANONICAL_CATEGORIES.map(getShortLabel);
  const ciStudent = CI_CANONICAL_CATEGORIES.map((c) => ciScores[c] ?? 0);
  const ciCorpus = CI_CANONICAL_CATEGORIES.map((c) => archetypeAvgCiScores[c] ?? 0);
  const ciChartMax = Math.max(...CI_CANONICAL_CATEGORIES.map((c) => corpusMax.ci[c] ?? 0), 0.001);

  const handleHover = useCallback((idx: number | null) => setActiveIndex(idx), []);

  const scatterDots = allEntrepreneurs.map((e) => ({
    id: e.id,
    name: "",
    x: e.ci_d1_score,
    y: e.ci_d2_score,
    archetypeKey: "",
  }));

  return (
    <Section
      n={n}
      label="Opportunity"
      title="Creative Intelligence"
      lede="How this entrepreneur spots opportunities and generates creative solutions — from pattern recognition to vision"
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 lg:grid-cols-9">
        <div className="min-w-0 lg:col-span-5">
          <div ref={containerRef} className="w-full max-w-lg min-h-[300px]">
            <RadarChart
              categories={ciLabels}
              studentScores={ciStudent}
              corpusScores={ciCorpus}
              maxValue={ciChartMax}
              accentColor={INK}
              onCategoryHover={handleHover}
              activeCategoryIndex={activeIndex}
              containerWidth={containerWidth}
            />
          </div>
          <ChartLegend color={INK} archetypeName={archetypeName} />
        </div>
        <div className="min-w-0 max-w-md border-t border-border pt-6 lg:col-span-4 lg:border-t-0 lg:pt-0">
          <ScatterPlot
            dots={scatterDots}
            title="Creative Intelligence"
            xLabelNegative="Validation"
            xLabelPositive="Insight"
            yLabelNegative="Process"
            yLabelPositive="Market"
            highlightId={entrepreneurId}
          />
        </div>
      </div>
    </Section>
  );
}

// Re-export CorpusMaxScores type for consumers that previously imported from this file
export type { CorpusMaxScores };
