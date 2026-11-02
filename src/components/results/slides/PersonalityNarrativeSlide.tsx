"use client";

import type { NarrativeBlock } from "@/lib/schemas/results";
import { NarrativeSheet } from "./IntelligenceNarrativeSlide";

interface PersonalityNarrativeSlideProps {
  data: {
    narrative: NarrativeBlock[];
  };
}

export function PersonalityNarrativeSlide({
  data,
}: PersonalityNarrativeSlideProps) {
  return <NarrativeSheet label="Entrepreneur Personality" narrative={data.narrative} />;
}
