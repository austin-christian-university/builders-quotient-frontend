"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FACET_NAMES: Record<string, string> = {
  AM: "Ambition",
  RT: "Risk Tolerance",
  IN: "Innovativeness",
  AU: "Autonomy",
  SE: "Self-Efficacy",
  ST: "Stress Tolerance",
  IL: "Internal Locus of Control",
  GR: "Grit",
  AC: "Attention Checks",
};

type FacetScoreRow = {
  facet: string;
  item_count: number;
  raw_mean: number;
  rescaled_score: number;
};

type PersonalitySummary = {
  globalIndex: number;
  globalIndexRescaled: number;
  gritMean: number;
  gritRescaled: number;
  attentionFail: boolean;
  infrequencyFail: boolean;
  straightLineFlag: boolean;
  missingItemCount: number;
};

type DebugContentProps = {
  sessionId: string;
  facetScores: FacetScoreRow[];
  summary: PersonalitySummary | null;
  completedAt: string | null;
};

export function DebugContent({
  sessionId,
  facetScores,
  summary,
  completedAt,
}: DebugContentProps) {
  const [jsonExpanded, setJsonExpanded] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-green-400">
            Dev Debug
          </p>
          <h1 className="mt-1 font-display text-[length:var(--text-fluid-xl)] font-bold tracking-[-0.01em]">
            Personality Scores
          </h1>
          <p className="mt-1 font-mono text-xs text-text-secondary">
            Session: {sessionId}
          </p>
          {completedAt && (
            <p className="mt-0.5 font-mono text-xs text-text-secondary">
              Completed: {new Date(completedAt).toLocaleString()}
            </p>
          )}
        </div>

        {summary && (
          <>
            {/* Global Indices */}
            <div className="rounded-2xl border border-white/10 bg-surface-elevated p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-text-secondary">
                Global Indices
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-secondary">
                    Global Entrepreneurial Index
                  </p>
                  <p className="font-display text-2xl font-bold tabular-nums">
                    {summary.globalIndex.toFixed(2)}
                  </p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent-blue"
                      style={{
                        width: `${Math.min(summary.globalIndexRescaled, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs tabular-nums text-text-secondary">
                    {summary.globalIndexRescaled.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Grit</p>
                  <p className="font-display text-2xl font-bold tabular-nums">
                    {summary.gritMean.toFixed(2)}
                  </p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent-gold"
                      style={{
                        width: `${Math.min(summary.gritRescaled, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs tabular-nums text-text-secondary">
                    {summary.gritRescaled.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Quality Flags */}
            <div className="rounded-2xl border border-white/10 bg-surface-elevated p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-text-secondary">
                Quality Flags
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Flag
                  label="Attention Check (AC01)"
                  pass={!summary.attentionFail}
                  passText="PASS"
                  failText="FAIL"
                />
                <Flag
                  label="Infrequency Check (AC02)"
                  pass={!summary.infrequencyFail}
                  passText="CLEAR"
                  failText="FLAG"
                />
                <Flag
                  label="Straight-Lining"
                  pass={!summary.straightLineFlag}
                  passText="CLEAR"
                  failText="FLAG"
                />
                <div>
                  <p className="text-xs text-text-secondary">Missing Items</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                    {summary.missingItemCount}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Facet Scores */}
        <div className="rounded-2xl border border-white/10 bg-surface-elevated p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Facet Scores
          </h2>
          <div className="space-y-3">
            {facetScores.map((row) => (
              <div key={row.facet}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-mono text-xs font-semibold text-accent-blue">
                      {row.facet}
                    </span>
                    <span className="ml-2 text-sm">
                      {FACET_NAMES[row.facet] ?? row.facet}
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs tabular-nums text-text-secondary">
                    <span className="font-semibold text-text-primary">
                      {row.raw_mean.toFixed(2)}
                    </span>
                    {" / "}
                    {row.rescaled_score.toFixed(1)}%
                    <span className="ml-2 text-text-secondary/60">
                      ({row.item_count} items)
                    </span>
                  </div>
                </div>
                <div
                  className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-valuenow={Math.round(row.rescaled_score)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${FACET_NAMES[row.facet] ?? row.facet}: ${row.rescaled_score.toFixed(1)}%`}
                >
                  <div
                    className="h-full rounded-full bg-accent-blue/70"
                    style={{
                      width: `${Math.min(row.rescaled_score, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw JSON */}
        <div className="rounded-2xl border border-white/10 bg-surface-elevated p-5">
          <button
            type="button"
            onClick={() => setJsonExpanded((v) => !v)}
            aria-expanded={jsonExpanded}
            className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary"
          >
            Raw JSON
            <span className="text-xs" aria-hidden="true">
              {jsonExpanded ? "\u25B2" : "\u25BC"}
            </span>
          </button>
          {jsonExpanded && (
            <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-xs text-green-400">
              {JSON.stringify(
                { summary, facetScores },
                null,
                2
              )}
            </pre>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button as={Link} href="/assess/personality" variant="ghost" size="md">
            Back to Quiz
          </Button>
          <Button as={Link} href="/" variant="ghost" size="md">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

function Flag({
  label,
  pass,
  passText,
  failText,
}: {
  label: string;
  pass: boolean;
  passText: string;
  failText: string;
}) {
  return (
    <div>
      <p className="text-xs text-text-secondary">{label}</p>
      <span
        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
          pass
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        }`}
      >
        {pass ? passText : failText}
      </span>
    </div>
  );
}
