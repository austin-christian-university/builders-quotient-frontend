import { SwissLanding } from "@/components/marketing/SwissLanding";
import { getProfiledEntrepreneurCount } from "@/lib/queries/entrepreneurs";

// The founder count is read from the corpus, refreshed hourly.
export const revalidate = 3600;

/** Fallback if the count query fails: the profiled corpus as of 2026-11-02. */
const FOUNDER_COUNT_FALLBACK = 248;

export default async function HomePage() {
  const founderCount = (await getProfiledEntrepreneurCount()) ?? FOUNDER_COUNT_FALLBACK;
  return <SwissLanding founderCount={founderCount} />;
}
