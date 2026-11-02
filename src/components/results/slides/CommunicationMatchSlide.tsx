"use client";

import type { NarrativeMatch } from "@/lib/schemas/results";
import { MatchSlide } from "@/components/results/NarrativeMatchCard";

interface CommunicationMatchSlideProps {
  data: NarrativeMatch | null;
}

// Ink, not vermilion: "Thinks like" keeps the one red highlight.
const ACCENT = "#111111";

export function CommunicationMatchSlide({ data }: CommunicationMatchSlideProps) {
  return (
    <MatchSlide
      data={data}
      accentColor={ACCENT}
      label="Communication Match"
      domainLabel="Communication Style"
      primaryHeading="Your communication style most resembles"
      runnerUpHeading="You also communicate like"
      emptyHeading="Communication match coming soon"
      emptyBody={
        <>We&rsquo;re building communication-based entrepreneur matching. Check back soon.</>
      }
    />
  );
}
