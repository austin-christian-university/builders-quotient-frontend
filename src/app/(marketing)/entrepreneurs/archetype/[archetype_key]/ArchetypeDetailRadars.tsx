"use client";

import { useState, useCallback } from "react";
import { RadarChart } from "@/components/results/RadarChart";
import { getShortLabel } from "@/components/results/short-labels";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
import {
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
} from "@/lib/assessment/scoring-categories";
import type { CorpusMaxScores } from "@/lib/schemas/entrepreneurs";

interface ArchetypeDetailRadarsProps {
  avgPiScores: Record<string, number>;
  avgCiScores: Record<string, number>;
  corpusAvgPiScores: Record<string, number>;
  corpusAvgCiScores: Record<string, number>;
  corpusMax: CorpusMaxScores;
}

export function ArchetypeDetailRadars({
  avgPiScores,
  avgCiScores,
  corpusAvgPiScores,
  corpusAvgCiScores,
  corpusMax,
}: ArchetypeDetailRadarsProps) {
  const [piContainerRef, piContainerWidth] = useContainerWidth();
  const [ciContainerRef, ciContainerWidth] = useContainerWidth();
  const [piActiveIndex, setPiActiveIndex] = useState<number | null>(null);
  const [ciActiveIndex, setCiActiveIndex] = useState<number | null>(null);

  const piLabels = PI_CANONICAL_CATEGORIES.map(getShortLabel);
  const ciLabels = CI_CANONICAL_CATEGORIES.map(getShortLabel);

  const piStudent = PI_CANONICAL_CATEGORIES.map((c) => avgPiScores[c] ?? 0);
  const piCorpus = PI_CANONICAL_CATEGORIES.map((c) => corpusAvgPiScores[c] ?? 0);
  const piMax = PI_CANONICAL_CATEGORIES.map((c) => corpusMax.pi[c] ?? 1);
  const piChartMax = Math.max(...piMax);

  const ciStudent = CI_CANONICAL_CATEGORIES.map((c) => avgCiScores[c] ?? 0);
  const ciCorpus = CI_CANONICAL_CATEGORIES.map((c) => corpusAvgCiScores[c] ?? 0);
  const ciMax = CI_CANONICAL_CATEGORIES.map((c) => corpusMax.ci[c] ?? 1);
  const ciChartMax = Math.max(...ciMax);

  const handlePiHover = useCallback((idx: number | null) => setPiActiveIndex(idx), []);
  const handleCiHover = useCallback((idx: number | null) => setCiActiveIndex(idx), []);

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-8">
      {/* PI Radar */}
      <div>
        <h3 className="mb-6 border-b border-ink pb-3 text-lg font-semibold tracking-[-0.02em] text-ink">
          Practical Intelligence
        </h3>
        <div ref={piContainerRef} className="w-full max-w-md mx-auto">
          <RadarChart
            categories={piLabels}
            studentScores={piStudent}
            corpusScores={piCorpus}
            maxValue={piChartMax}
            accentColor="#e8452c"
            onCategoryHover={handlePiHover}
            activeCategoryIndex={piActiveIndex}
            containerWidth={piContainerWidth}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-vermilion" aria-hidden="true" />
            This Archetype
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 border border-ink/40 bg-ink/5" aria-hidden="true" />
            All Entrepreneurs
          </div>
        </div>
      </div>

      {/* CI Radar */}
      <div>
        <h3 className="mb-6 border-b border-ink pb-3 text-lg font-semibold tracking-[-0.02em] text-ink">
          Creative Intelligence
        </h3>
        <div ref={ciContainerRef} className="w-full max-w-md mx-auto">
          <RadarChart
            categories={ciLabels}
            studentScores={ciStudent}
            corpusScores={ciCorpus}
            maxValue={ciChartMax}
            accentColor="#111111"
            onCategoryHover={handleCiHover}
            activeCategoryIndex={ciActiveIndex}
            containerWidth={ciContainerWidth}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-ink" aria-hidden="true" />
            This Archetype
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 border border-ink/40 bg-ink/5" aria-hidden="true" />
            All Entrepreneurs
          </div>
        </div>
      </div>
    </div>
  );
}
