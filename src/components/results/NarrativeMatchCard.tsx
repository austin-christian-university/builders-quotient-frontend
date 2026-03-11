"use client";

import type { EntrepreneurNarrative } from "@/lib/schemas/results";

interface NarrativeMatchCardProps {
  data: EntrepreneurNarrative;
  accentColor: string;
  domainLabel: string;
}

export function NarrativeMatchCard({ data, accentColor, domainLabel }: NarrativeMatchCardProps) {
  const bio = data.bioNarrative ?? data.fallbackBioSnippet;

  return (
    <div className="relative rounded-2xl border overflow-hidden" style={{
      background: "rgba(255,255,255,0.04)",
      borderColor: "rgba(255,255,255,0.1)",
      backdropFilter: "blur(20px)",
    }}>
      {/* Accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at top left, ${accentColor}14 0%, transparent 55%)`,
        }}
      />

      <div className="relative z-10 p-6 space-y-5">
        {/* Entrepreneur name */}
        <h3 className="text-2xl font-bold" style={{
          color: "#fff",
          fontFamily: "'Inter Tight', Inter, sans-serif",
          letterSpacing: "-0.01em",
        }}>
          {data.entrepreneurName}
        </h3>

        {/* Company + industry pills */}
        {(data.companies.length > 0 || data.industries.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {data.companies.slice(0, 5).map((company) => (
              <span
                key={company}
                className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                style={{
                  borderColor: `${accentColor}40`,
                  backgroundColor: `${accentColor}12`,
                  color: accentColor,
                }}
              >
                {company}
              </span>
            ))}
            {data.industries.slice(0, 4).map((industry) => (
              <span
                key={industry}
                className="rounded-full border px-2.5 py-0.5 text-xs"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "#9aa0ac",
                }}
              >
                {industry}
              </span>
            ))}
          </div>
        )}

        {/* Bio narrative */}
        {bio && (
          <p className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
            {bio}
          </p>
        )}

        {/* Domain style (Reasoning Style / Communication Style) */}
        {data.domainStyle && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: accentColor }}>
              {domainLabel}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
              {data.domainStyle}
            </p>
          </div>
        )}

        {/* Signature Moves */}
        {data.signatureMoves.length > 0 && (
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: accentColor }}>
              Signature Moves
            </p>
            <div className="space-y-3">
              {data.signatureMoves.slice(0, 3).map((move) => (
                <p key={move.title} className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
                  <strong style={{ color: "rgba(245,246,250,0.9)" }}>{move.title}</strong>
                  {" \u2014 "}
                  {move.description}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {data.strengths && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: accentColor }}>
              Strengths
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
              {data.strengths}
            </p>
          </div>
        )}

        {/* Blindspots */}
        {data.blindspots && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: "#e9b949" }}>
              Blindspots
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
              {data.blindspots}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
