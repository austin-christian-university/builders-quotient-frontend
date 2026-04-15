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

interface PracticalIntelligenceSectionProps {
  piScores: Record<string, number>;
  archetypeAvgPiScores: Record<string, number>;
  corpusMax: { pi: Record<string, number> };
  entrepreneurId: string;
  allEntrepreneurs: { id: string; pi_d1_score: number; pi_d2_score: number; ci_d1_score: number; ci_d2_score: number }[];
  archetypeName: string;
}

export function PracticalIntelligenceSection({
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
    <section className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-4xl">
        <p
          className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-2 text-center"
          style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
        >
          Practical Intelligence
        </p>
        <p className="text-text-secondary/50 text-sm text-center mb-8">
          How this entrepreneur approaches real-world problem solving — from diagnosing situations to planning actions
        </p>
        <div ref={containerRef} className="w-full max-w-lg mx-auto min-h-[300px]">
          <RadarChart
            categories={piLabels}
            studentScores={piStudent}
            corpusScores={piCorpus}
            maxValue={piChartMax}
            accentColor="#4da3ff"
            onCategoryHover={handleHover}
            activeCategoryIndex={activeIndex}
            containerWidth={containerWidth}
          />
        </div>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-xs text-text-secondary">This Entrepreneur</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-white/30 bg-white/5" aria-hidden="true" />
            <span className="text-xs text-text-secondary">{archetypeName} Average</span>
          </div>
        </div>
        <div className="mt-10 max-w-md mx-auto">
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
    </section>
  );
}

interface CreativeIntelligenceSectionProps {
  ciScores: Record<string, number>;
  archetypeAvgCiScores: Record<string, number>;
  corpusMax: { ci: Record<string, number> };
  entrepreneurId: string;
  allEntrepreneurs: { id: string; pi_d1_score: number; pi_d2_score: number; ci_d1_score: number; ci_d2_score: number }[];
  archetypeName: string;
}

export function CreativeIntelligenceSection({
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
    <section className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-4xl">
        <p
          className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-2 text-center"
          style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
        >
          Creative Intelligence
        </p>
        <p className="text-text-secondary/50 text-sm text-center mb-8">
          How this entrepreneur spots opportunities and generates creative solutions — from pattern recognition to vision
        </p>
        <div ref={containerRef} className="w-full max-w-lg mx-auto min-h-[300px]">
          <RadarChart
            categories={ciLabels}
            studentScores={ciStudent}
            corpusScores={ciCorpus}
            maxValue={ciChartMax}
            accentColor="#e9b949"
            onCategoryHover={handleHover}
            activeCategoryIndex={activeIndex}
            containerWidth={containerWidth}
          />
        </div>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary" aria-hidden="true" />
            <span className="text-xs text-text-secondary">This Entrepreneur</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-white/30 bg-white/5" aria-hidden="true" />
            <span className="text-xs text-text-secondary">{archetypeName} Average</span>
          </div>
        </div>
        <div className="mt-10 max-w-md mx-auto">
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
    </section>
  );
}

// Re-export CorpusMaxScores type for consumers that previously imported from this file
export type { CorpusMaxScores };
