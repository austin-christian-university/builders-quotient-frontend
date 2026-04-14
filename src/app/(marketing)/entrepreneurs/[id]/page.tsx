import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getEntrepreneurProfile } from "@/lib/queries/entrepreneurs";
import { PI_STYLES, CI_STYLES } from "@/lib/schemas/entrepreneurs";
import { ArchetypeBadge } from "@/components/entrepreneurs/ArchetypeBadge";
import { Button } from "@/components/ui/button";
import { EntrepreneurProfileVisuals } from "./EntrepreneurProfileVisuals";

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

  const { entrepreneur, archetypeAvgPiScores, archetypeAvgCiScores, corpusMax, allEntrepreneurs } = data;

  const piStyleLabel = PI_STYLES.find((s) => s.key === entrepreneur.pi_style)?.label ?? entrepreneur.pi_style;
  const ciStyleLabel = CI_STYLES.find((s) => s.key === entrepreneur.ci_style)?.label ?? entrepreneur.ci_style;

  return (
    <main className="relative min-h-screen bg-bg-base">
      {/* Hero Header */}
      <section className="relative px-6 pt-24 pb-12 md:pt-32 md:pb-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgb(77_163_255/0.06),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <Link
            href={`/entrepreneurs/archetype/${entrepreneur.archetype_key}`}
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-text-secondary/60 hover:text-text-secondary transition-colors mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {entrepreneur.archetype_name}
          </Link>

          <h1
            className="text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-text-primary"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            {entrepreneur.name}
          </h1>

          {/* Industries */}
          {entrepreneur.industries && entrepreneur.industries.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {entrepreneur.industries.map((industry) => (
                <span
                  key={industry}
                  className="rounded-sm bg-white/5 px-2.5 py-1 text-xs text-text-secondary"
                >
                  {industry}
                </span>
              ))}
            </div>
          )}

          {/* Archetype badge */}
          <div className="mt-6">
            <ArchetypeBadge
              archetypeKey={entrepreneur.archetype_key}
              name={entrepreneur.archetype_name}
              tagline={entrepreneur.archetype_tagline}
              linked
            />
          </div>

          {/* Style badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-primary/70">{piStyleLabel} thinker</span>
            <span className="text-text-secondary/30">&middot;</span>
            <span className="text-sm text-secondary/70">{ciStyleLabel} creator</span>
          </div>

          {/* Bio */}
          {entrepreneur.bio_narrative && (
            <p className="mx-auto mt-8 max-w-2xl text-base text-text-secondary leading-relaxed">
              {entrepreneur.bio_narrative}
            </p>
          )}
        </div>
      </section>

      {/* Visualizations (client component) */}
      <EntrepreneurProfileVisuals
        piScores={entrepreneur.pi_category_scores}
        ciScores={entrepreneur.ci_category_scores}
        archetypeAvgPiScores={archetypeAvgPiScores}
        archetypeAvgCiScores={archetypeAvgCiScores}
        corpusMax={corpusMax}
        entrepreneurId={entrepreneur.id}
        piD1={entrepreneur.pi_d1_score}
        piD2={entrepreneur.pi_d2_score}
        ciD1={entrepreneur.ci_d1_score}
        ciD2={entrepreneur.ci_d2_score}
        allEntrepreneurs={allEntrepreneurs}
        archetypeName={entrepreneur.archetype_name}
      />

      {/* CTA */}
      <section className="relative px-6 py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgb(77_163_255/0.06),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2
            className="text-2xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent pb-1"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            See how you compare
          </h2>
          <p className="mt-3 text-base text-text-secondary/90 font-light">
            Take the Builder&apos;s Quotient assessment and discover your own
            cognitive&nbsp;profile.
          </p>
          <div className="mt-8">
            <Button as={Link} href="/assess/overview" size="lg" variant="outline" className="rounded-full">
              Begin Assessment
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
