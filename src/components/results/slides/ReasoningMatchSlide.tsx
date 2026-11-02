"use client";

import type { NarrativeMatch } from "@/lib/schemas/results";
import { MatchSlide } from "@/components/results/NarrativeMatchCard";

interface ReasoningMatchSlideProps {
  data: NarrativeMatch | null;
}

// The reasoning match carries the slide's one vermilion highlight.
const ACCENT = "#E8452C";

export function ReasoningMatchSlide({ data }: ReasoningMatchSlideProps) {
  return (
    <MatchSlide
      data={data}
      accentColor={ACCENT}
      label="Reasoning Match"
      domainLabel="Reasoning Style"
      primaryHeading="Your reasoning most resembles"
      runnerUpHeading="You also reason like"
      emptyHeading="Reasoning match coming soon"
      emptyBody={
        <>
          We&rsquo;re building intelligence-based entrepreneur matching. Check back
          soon.
        </>
      }
    />
  );
}
