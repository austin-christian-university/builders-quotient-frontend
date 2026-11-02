"use client";

import { useState } from "react";
import type { ReviewVignette } from "@/lib/queries/vignettes";
import { Button } from "@/components/ui/button";
import { VignetteReviewCard } from "./VignetteReviewCard";

type TypeFilter = "practical" | "creative";
type StatusFilter = "active" | "inactive";

function FilterButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "secondary" : "outline"}
      aria-pressed={selected}
      onClick={onClick}
      className={selected ? undefined : "border-border text-text-secondary hover:border-ink"}
    >
      <span className="tabular-nums">{children}</span>
    </Button>
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
      <div className="space-y-2">
        {/* Type filter */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Vignette type">
          <FilterButton
            selected={typeFilter === "practical"}
            onClick={() => setTypeFilter("practical")}
          >
            Practical ({pi.length})
          </FilterButton>
          <FilterButton
            selected={typeFilter === "creative"}
            onClick={() => setTypeFilter("creative")}
          >
            Creative ({ci.length})
          </FilterButton>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Vignette status">
          <FilterButton
            selected={statusFilter === "active"}
            onClick={() => setStatusFilter("active")}
          >
            Active ({activeCount})
          </FilterButton>
          <FilterButton
            selected={statusFilter === "inactive"}
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive ({inactiveCount})
          </FilterButton>
        </div>
      </div>

      {/* Results */}
      <div className="mt-[clamp(32px,5vw,56px)] space-y-[clamp(40px,6vw,64px)]">
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
          <p className="border-t border-ink pt-6 text-text-secondary">
            No {statusFilter} {typeFilter} vignettes found.
          </p>
        )}
      </div>
    </>
  );
}
