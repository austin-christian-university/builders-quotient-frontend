"use client";

import type { NarrativeBlock } from "@/lib/schemas/results";
import { NarrativeSheet } from "./IntelligenceNarrativeSlide";

interface CommunicationNarrativeSlideProps {
  data: {
    narrative: NarrativeBlock[];
  };
}

export function CommunicationNarrativeSlide({
  data,
}: CommunicationNarrativeSlideProps) {
  return <NarrativeSheet label="Communication Style" narrative={data.narrative} />;
}
