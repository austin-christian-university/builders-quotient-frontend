"use client";

import { MediaStreamProvider } from "@/lib/assessment/media-stream-context";
import { WarmupExperience } from "@/components/assessment/WarmupExperience";

export function WarmupClient() {
  return (
    <MediaStreamProvider>
      <WarmupExperience />
    </MediaStreamProvider>
  );
}
