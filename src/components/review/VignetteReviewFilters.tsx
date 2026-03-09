"use client";

import { useState } from "react";
import type { ReviewVignette } from "@/lib/queries/vignettes";
import { VignetteReviewCard } from "./VignetteReviewCard";

type TypeFilter = "practical" | "creative";
type StatusFilter = "active" | "inactive";

function PillButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
        selected
          ? "bg-primary text-bg-base shadow-[0_0_16px_rgb(77_163_255/0.3)]"
          : "border border-border-glass bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export function VignetteReviewFilters({
  pi,
  ci,
}: {
  pi: ReviewVignette[];
  ci: ReviewVignette[];
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("practical");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  const source = typeFilter === "practical" ? pi : ci;
  const filtered = source.filter((v) =>
    statusFilter === "active" ? v.active : !v.active
  );

  const activeCount = source.filter((v) => v.active).length;
  const inactiveCount = source.length - activeCount;

  return (
    <>
      <div className="space-y-3">
        {/* Type pills */}
        <div className="flex gap-2" role="group" aria-label="Vignette type">
          <PillButton
            selected={typeFilter === "practical"}
            onClick={() => setTypeFilter("practical")}
          >
            Practical ({pi.length})
          </PillButton>
          <PillButton
            selected={typeFilter === "creative"}
            onClick={() => setTypeFilter("creative")}
          >
            Creative ({ci.length})
          </PillButton>
        </div>

        {/* Status pills */}
        <div className="flex gap-2" role="group" aria-label="Vignette status">
          <PillButton
            selected={statusFilter === "active"}
            onClick={() => setStatusFilter("active")}
          >
            Active ({activeCount})
          </PillButton>
          <PillButton
            selected={statusFilter === "inactive"}
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive ({inactiveCount})
          </PillButton>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 space-y-6">
        {filtered.length > 0 ? (
          filtered.map((v, i) => (
            <VignetteReviewCard
              key={v.id}
              index={i}
              vignetteType={v.vignette_type}
              typeLabel={v.type_label}
              text={v.vignette_text}
              prompts={{
                phase1: v.phase_1_prompt ?? "",
                phase2: v.phase_2_prompt,
                phase3: v.phase_3_prompt,
              }}
              audioUrl={v.audio_url}
              estimatedSeconds={v.estimated_narration_seconds}
            />
          ))
        ) : (
          <p className="text-text-secondary">
            No {statusFilter} {typeFilter} vignettes found.
          </p>
        )}
      </div>
    </>
  );
}
