import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getArchetypeDetail } from "@/lib/queries/entrepreneurs";
import { ARCHETYPES, PI_STYLES, CI_STYLES } from "@/lib/schemas/entrepreneurs";
import { EntrepreneurCard } from "@/components/entrepreneurs/EntrepreneurCard";
import { Button } from "@/components/ui/button";
import { ArchetypeDetailRadars } from "./ArchetypeDetailRadars";

interface PageProps {
  params: Promise<{ archetype_key: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { archetype_key } = await params;
  const ref = ARCHETYPES.find((a) => a.key === archetype_key);
  if (!ref) return { title: "Archetype Not Found" };

  return {
    title: `${ref.name} — ${ref.tagline} | Builder's Quotient`,
    description: `Explore the ${ref.name} entrepreneur archetype. ${ref.tagline}`,
  };
}

export async function generateStaticParams() {
  return ARCHETYPES.map((a) => ({ archetype_key: a.key }));
}

export default async function ArchetypeDetailPage({ params }: PageProps) {
  const { archetype_key } = await params;
  const data = await getArchetypeDetail(archetype_key);
  if (!data) notFound();

  const { archetype, description, entrepreneurs, avgPiScores, avgCiScores, corpusAvgPiScores, corpusAvgCiScores, corpusMax } = data;

  const piStyleLabel = PI_STYLES.find((s) => s.key === archetype.piStyle)?.label ?? archetype.piStyle;
  const ciStyleLabel = CI_STYLES.find((s) => s.key === archetype.ciStyle)?.label ?? archetype.ciStyle;

  return (
    <main className="relative min-h-screen bg-bg-base">
      {/* Header */}
      <section className="relative px-6 pt-24 pb-12 md:pt-32 md:pb-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgb(77_163_255/0.06),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <Link
            href="/entrepreneurs"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-text-secondary/60 hover:text-text-secondary transition-colors mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Archetypes
          </Link>

          <h1
            className="text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-text-primary"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            {archetype.name}
          </h1>
          <p className="mt-3 text-xl text-text-secondary/90 font-light italic">
            &ldquo;{archetype.tagline}&rdquo;
          </p>

          {description && (
            <p className="mx-auto mt-6 max-w-2xl text-base text-text-secondary leading-relaxed">
              {description}
            </p>
          )}

          {/* Style badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              {piStyleLabel} thinker
            </span>
            <span className="rounded-full border border-secondary/30 bg-secondary/5 px-4 py-1.5 text-sm text-secondary">
              {ciStyleLabel} creator
            </span>
          </div>

          <p className="mt-4 text-sm text-text-secondary/50" style={{ fontVariantNumeric: "tabular-nums" }}>
            {entrepreneurs.length} entrepreneur{entrepreneurs.length !== 1 ? "s" : ""} share{entrepreneurs.length === 1 ? "s" : ""} this archetype
          </p>
        </div>
      </section>

      {/* Radar Charts */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-xl font-bold text-text-primary mb-2 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            What makes {archetype.name}s distinct
          </h2>
          <p className="text-text-secondary/60 text-sm text-center mb-8">
            Compared to the average across all {entrepreneurs.length > 1 ? "248" : "all"} entrepreneurs
          </p>
          <ArchetypeDetailRadars
            avgPiScores={avgPiScores}
            avgCiScores={avgCiScores}
            corpusAvgPiScores={corpusAvgPiScores}
            corpusAvgCiScores={corpusAvgCiScores}
            corpusMax={corpusMax}
          />
        </div>
      </section>

      {/* Entrepreneur Grid */}
      <section className="px-6 py-12 md:py-16 border-t border-border/50">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-xl font-bold text-text-primary mb-8 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            {archetype.name}s
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entrepreneurs.map((e) => (
              <EntrepreneurCard
                key={e.id}
                id={e.id}
                name={e.name}
                industries={e.industries}
              />
            ))}
          </div>
        </div>
      </section>

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
            Are you {archetype.name === "The Anchor" || archetype.name === "The Alchemist" || archetype.name === "The Optimizer" ? "an" : "a"} {archetype.name}?
          </h2>
          <p className="mt-3 text-base text-text-secondary/90 font-light">
            Take the assessment to find out.
          </p>
          <div className="mt-8">
            <Button as={Link} href="/assess/overview" size="lg" variant="outline" className="rounded-full">
              Discover your archetype
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
