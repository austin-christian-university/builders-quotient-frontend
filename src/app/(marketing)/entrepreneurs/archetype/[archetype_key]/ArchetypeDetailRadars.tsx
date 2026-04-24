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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* PI Radar */}
      <div>
        <p
          className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-4 text-center"
          style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
        >
          Practical Intelligence
        </p>
        <div ref={piContainerRef} className="w-full max-w-md mx-auto">
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
            <span className="text-xs text-text-secondary">This Archetype</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-white/30 bg-white/5" aria-hidden="true" />
            <span className="text-xs text-text-secondary">All Entrepreneurs</span>
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
        <div ref={ciContainerRef} className="w-full max-w-md mx-auto">
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
            <span className="text-xs text-text-secondary">This Archetype</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-white/30 bg-white/5" aria-hidden="true" />
            <span className="text-xs text-text-secondary">All Entrepreneurs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
