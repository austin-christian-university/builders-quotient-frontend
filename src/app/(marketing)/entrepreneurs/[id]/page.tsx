import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getEntrepreneurProfile } from "@/lib/queries/entrepreneurs";
import { PI_STYLES, CI_STYLES } from "@/lib/schemas/entrepreneurs";
import { PageHeader, EndCta } from "@/components/swiss/Swiss";
import { PracticalIntelligenceSection, CreativeIntelligenceSection } from "./EntrepreneurProfileVisuals";
import { CommunicationStyleSection } from "@/components/entrepreneurs/CommunicationStyleSection";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getEntrepreneurProfile(id);
  if (!data) return { title: "Entrepreneur Not Found" };

  return {
    title: `${data.entrepreneur.name} — ${data.entrepreneur.archetype_name} | Builder's Quotient`,
    description: `Explore ${data.entrepreneur.name}'s cognitive profile. ${data.entrepreneur.archetype_tagline}`,
  };
}

export default async function EntrepreneurProfilePage({ params }: PageProps) {
  const { id } = await params;
  const data = await getEntrepreneurProfile(id);
  if (!data) notFound();

  const { entrepreneur, archetypeAvgPiScores, archetypeAvgCiScores, corpusMax, allEntrepreneurs, personalityVector, corpusAvgPersonalityVector, communicationNarrative } = data;

  const piStyleLabel = PI_STYLES.find((s) => s.key === entrepreneur.pi_style)?.label ?? entrepreneur.pi_style;
  const ciStyleLabel = CI_STYLES.find((s) => s.key === entrepreneur.ci_style)?.label ?? entrepreneur.ci_style;

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <PageHeader
        eyebrow={
          <Link
            href={`/entrepreneurs/archetype/${entrepreneur.archetype_key}`}
            className="inline-flex items-center gap-1.5 text-[#8c8a84] transition-colors hover:text-ink"
          >
            <span aria-hidden="true">←</span> {entrepreneur.archetype_name}
          </Link>
        }
        title={entrepreneur.name}
      >
        {entrepreneur.industries && entrepreneur.industries.length > 0 && (
          <ul className="mt-[clamp(24px,3vw,36px)] flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-secondary" aria-label="Industries">
            {entrepreneur.industries.map((industry) => (
              <li key={industry}>{industry}</li>
            ))}
          </ul>
        )}

        <div className="mt-[clamp(32px,5vw,56px)] grid grid-cols-4 gap-x-4 border-t border-ink pt-6 md:grid-cols-12 md:gap-x-6">
          <div className="col-span-4 mb-4 text-sm text-[#8c8a84] md:col-span-3 md:mb-0">Archetype</div>
          <div className="col-span-4 min-w-0 md:col-span-9">
            <Link
              href={`/entrepreneurs/archetype/${entrepreneur.archetype_key}`}
              className="group block"
            >
              <span className="block text-[clamp(26px,3.2vw,40px)] font-semibold leading-[1.05] tracking-[-0.04em] group-hover:text-vermilion">
                {entrepreneur.archetype_name}
              </span>
              {entrepreneur.archetype_tagline && (
                <span className="mt-2 block text-[17px] leading-[1.45] text-[#3d3c39]">
                  {entrepreneur.archetype_tagline}
                </span>
              )}
            </Link>
            <p className="mt-5 text-sm text-text-secondary">
              <span className="text-ink">{piStyleLabel}</span> thinker
              <span className="mx-2" aria-hidden="true">/</span>
              <span className="text-ink">{ciStyleLabel}</span> creator
            </p>
            {entrepreneur.bio_narrative && (
              <p className="mt-8 max-w-[60ch] text-[clamp(17px,1.4vw,19px)] leading-[1.55] text-[#3d3c39]">
                {entrepreneur.bio_narrative}
              </p>
            )}
          </div>
        </div>
      </PageHeader>

      <PracticalIntelligenceSection
        n="01"
        piScores={entrepreneur.pi_category_scores}
        archetypeAvgPiScores={archetypeAvgPiScores}
        corpusMax={corpusMax}
        entrepreneurId={entrepreneur.id}
        allEntrepreneurs={allEntrepreneurs}
        archetypeName={entrepreneur.archetype_name}
      />

      <CreativeIntelligenceSection
        n="02"
        ciScores={entrepreneur.ci_category_scores}
        archetypeAvgCiScores={archetypeAvgCiScores}
        corpusMax={corpusMax}
        entrepreneurId={entrepreneur.id}
        allEntrepreneurs={allEntrepreneurs}
        archetypeName={entrepreneur.archetype_name}
      />

      {personalityVector && (
        <CommunicationStyleSection
          n="03"
          personalityVector={personalityVector}
          corpusAvgPersonalityVector={corpusAvgPersonalityVector}
          communicationNarrative={communicationNarrative}
          entrepreneurName={entrepreneur.name}
        />
      )}

      <EndCta
        title="See how you compare"
        body={
          <>
            Take the Builder&apos;s Quotient assessment and discover your own cognitive profile, including how
            your creative intelligence compares to 248 entrepreneurs.
          </>
        }
        cta="Begin Assessment"
        href="/assess/overview"
      />
    </main>
  );
}
