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

interface EntrepreneurProfileVisualsProps {
  piScores: Record<string, number>;
  ciScores: Record<string, number>;
  archetypeAvgPiScores: Record<string, number>;
  archetypeAvgCiScores: Record<string, number>;
  corpusMax: CorpusMaxScores;
  entrepreneurId: string;
  piD1: number;
  piD2: number;
  ciD1: number;
  ciD2: number;
  allEntrepreneurs: { id: string; pi_d1_score: number; pi_d2_score: number; ci_d1_score: number; ci_d2_score: number }[];
  archetypeName: string;
}

export function EntrepreneurProfileVisuals({
  piScores,
  ciScores,
  archetypeAvgPiScores,
  archetypeAvgCiScores,
  corpusMax,
  entrepreneurId,
  piD1,
  piD2,
  ciD1,
  ciD2,
  allEntrepreneurs,
  archetypeName,
}: EntrepreneurProfileVisualsProps) {
  const [piContainerRef, piContainerWidth] = useContainerWidth();
  const [ciContainerRef, ciContainerWidth] = useContainerWidth();
  const [piActiveIndex, setPiActiveIndex] = useState<number | null>(null);
  const [ciActiveIndex, setCiActiveIndex] = useState<number | null>(null);

  const piLabels = PI_CANONICAL_CATEGORIES.map(getShortLabel);
  const ciLabels = CI_CANONICAL_CATEGORIES.map(getShortLabel);

  const piStudent = PI_CANONICAL_CATEGORIES.map((c) => piScores[c] ?? 0);
  const piCorpus = PI_CANONICAL_CATEGORIES.map((c) => archetypeAvgPiScores[c] ?? 0);
  const piChartMax = Math.max(...PI_CANONICAL_CATEGORIES.map((c) => corpusMax.pi[c] ?? 0), 0.001);

  const ciStudent = CI_CANONICAL_CATEGORIES.map((c) => ciScores[c] ?? 0);
  const ciCorpus = CI_CANONICAL_CATEGORIES.map((c) => archetypeAvgCiScores[c] ?? 0);
  const ciChartMax = Math.max(...CI_CANONICAL_CATEGORIES.map((c) => corpusMax.ci[c] ?? 0), 0.001);

  const handlePiHover = useCallback((idx: number | null) => setPiActiveIndex(idx), []);
  const handleCiHover = useCallback((idx: number | null) => setCiActiveIndex(idx), []);

  // Scatter plot dots — names are empty since we only need positions for the profile view
  const piScatterDots = allEntrepreneurs.map((e) => ({
    id: e.id,
    name: "",
    x: e.pi_d1_score,
    y: e.pi_d2_score,
    archetypeKey: "",
  }));

  const ciScatterDots = allEntrepreneurs.map((e) => ({
    id: e.id,
    name: "",
    x: e.ci_d1_score,
    y: e.ci_d2_score,
    archetypeKey: "",
  }));

  return (
    <>
      {/* Radar Charts - stacked vertically */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-16">
          {/* PI Radar */}
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-4 text-center"
              style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
            >
              Practical Intelligence
            </p>
            <div ref={piContainerRef} className="w-full max-w-lg mx-auto">
              <RadarChart
                categories={piLabels}
                studentScores={piStudent}
                corpusScores={piCorpus}
                maxValue={piChartMax}
                accentColor="#4da3ff"
                onCategoryHover={handlePiHover}
                activeCategoryIndex={piActiveIndex}
                containerWidth={piContainerWidth}
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
          </div>

          {/* CI Radar */}
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-4 text-center"
              style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
            >
              Creative Intelligence
            </p>
            <div ref={ciContainerRef} className="w-full max-w-lg mx-auto">
              <RadarChart
                categories={ciLabels}
                studentScores={ciStudent}
                corpusScores={ciCorpus}
                maxValue={ciChartMax}
                accentColor="#e9b949"
                onCategoryHover={handleCiHover}
                activeCategoryIndex={ciActiveIndex}
                containerWidth={ciContainerWidth}
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
          </div>
        </div>
      </section>

      {/* Quadrant Position */}
      <section className="px-6 py-12 md:py-16 border-t border-border/50">
        <div className="mx-auto max-w-4xl">
          <h2
            className="text-xl font-bold text-text-primary mb-2 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            Position Among Peers
          </h2>
          <p className="text-text-secondary/60 text-sm text-center mb-8">
            Where this entrepreneur sits relative to all others
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <ScatterPlot
              dots={piScatterDots}
              title="Practical Intelligence"
              xLabelNegative="Interpersonal"
              xLabelPositive="Analytical"
              yLabelNegative="Decisive"
              yLabelPositive="Exploratory"
              highlightId={entrepreneurId}
            />
            <ScatterPlot
              dots={ciScatterDots}
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
    </>
  );
}
