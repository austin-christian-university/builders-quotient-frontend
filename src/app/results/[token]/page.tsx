import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getResultsByToken } from "@/lib/queries/results";
import { ResultsExperience } from "@/components/results/ResultsExperience";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const data = await getResultsByToken(token);

  if (!data) {
    return { title: "Results Not Found | BQ" };
  }

  const name = data.applicant.displayName;
  const title = name ? `${name}'s BQ Results` : "Your BQ Results";
  const description = `Builder's Quotient: ${Math.round(data.overall.bqPercentile)}th percentile. Archetype: ${data.archetype.name}.`;

  return {
    title: `${title} | BQ`,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "profile",
    },
  };
}

export default async function ResultsPage({ params }: Props) {
  const { token } = await params;

  if (!token || token.length > 128) notFound();

  const data = await getResultsByToken(token);

  if (!data) notFound();

  return <ResultsExperience data={data} />;
}
