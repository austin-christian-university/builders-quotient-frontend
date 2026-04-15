import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getExplorerData } from "@/lib/queries/entrepreneurs";
import { StatCard } from "@/components/entrepreneurs/StatCard";
import { ArchetypeGrid } from "@/components/entrepreneurs/ArchetypeGrid";
import { ExplorerScatterPlots } from "./ExplorerScatterPlots";
import { CorpusCommunicationRadar } from "./CorpusCommunicationRadar";
import TraitScatterChart from "./TraitScatterChart";
import BeeSwarmChart from "./BeeSwarmChart";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How Do Entrepreneurs Think? | Builder's Quotient",
  description:
    "Explore 16 entrepreneur archetypes derived from real cognitive data. See how 248+ entrepreneurs across 220 industries reason and create.",
};

export default async function EntrepreneurExplorerPage() {
  const data = await getExplorerData();
  if (!data) notFound();

  const { gridCells, stats, entrepreneurs, corpusAvgPersonalityVector, personalityTraitStats, personalityVectors } = data;
  const maxCount = Math.max(...gridCells.map((c) => c.count));

  // Prepare scatter plot dots
  const scatterDots = entrepreneurs.map((e) => ({
    id: e.id,
    name: e.name,
    piD1: e.pi_d1_score,
    piD2: e.pi_d2_score,
    ciD1: e.ci_d1_score,
    ciD2: e.ci_d2_score,
    archetypeKey: e.archetype_key,
  }));

  return (
    <main className="relative min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative px-6 pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgb(77_163_255/0.08),transparent)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-text-secondary/60 mb-4">
            Builder&apos;s Quotient Research
          </p>
          <h1
            className="text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight bg-gradient-to-br from-white via-neutral-100 to-neutral-500/80 bg-clip-text text-transparent pb-2"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            How do the world&apos;s top entrepreneurs think?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary/90 font-light leading-relaxed">
            We analyzed {stats.totalEntrepreneurs} entrepreneurs across{" "}
            {stats.totalIndustries} industries to map how they reason and
            create.
          </p>

          {/* Stat cards */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              value={`${stats.pctInsightDriven}%`}
              label="are insight-driven creators"
              sublabel="Lead with intuition, not validation"
            />
            <StatCard
              value="#1 differentiator"
              label={stats.topDifferentiator}
              sublabel="The skill that separates entrepreneurs most"
            />
            <StatCard
              value={`${stats.dominantArchetype.pct}%`}
              label={`are ${stats.dominantArchetype.name.replace(/^The /, "")}s`}
              sublabel="Nearly half share one archetype"
            />
            <StatCard
              value={`${stats.emptyArchetypeCount} archetypes`}
              label="have zero entrepreneurs"
              sublabel="What kind is almost unheard of?"
            />
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Button as={Link} href="/assess/overview" size="lg" variant="outline" className="rounded-full">
              Discover your archetype
            </Button>
          </div>
        </div>
      </section>

      {/* 4x4 Grid */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <h2
            className="text-[clamp(1.5rem,1.15rem+1.75vw,2.25rem)] font-bold text-text-primary mb-2 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            16 Archetypes
          </h2>
          <p className="text-text-secondary/70 text-center mb-10 max-w-xl mx-auto">
            Our framework organizes entrepreneurial thinking into 16 archetypes based
            on practical intelligence and creative intelligence profiles.
          </p>
          <ArchetypeGrid cells={gridCells} maxCount={maxCount} />

          <div className="mt-8 text-center">
            <Link
              href="/entrepreneurs/directory"
              className="inline-flex items-center gap-1.5 py-3 text-sm text-primary/80 hover:text-primary transition-colors"
            >
              Browse all {stats.totalEntrepreneurs} entrepreneurs
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Scatter Plots */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <h2
            className="text-[clamp(1.5rem,1.15rem+1.75vw,2.25rem)] font-bold text-text-primary mb-2 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            The Data Behind the Archetypes
          </h2>
          <p className="text-text-secondary/70 text-center mb-10 max-w-xl mx-auto">
            Each dot is a real entrepreneur. Hover to see who they are, click
            to explore their profile.
          </p>
          <ExplorerScatterPlots dots={scatterDots} />
        </div>
      </section>

      {/* Corpus Communication Style */}
      {corpusAvgPersonalityVector && personalityTraitStats && (
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <h2
              className="text-[clamp(1.5rem,1.15rem+1.75vw,2.25rem)] font-bold text-text-primary mb-2 text-center"
              style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
            >
              How Entrepreneurs Communicate
            </h2>
            <p className="text-text-secondary/70 text-center mb-10 max-w-xl mx-auto">
              Communication style across {stats.totalEntrepreneurs} entrepreneurs
              — what&apos;s universal, what&apos;s polarizing, and where they
              couldn&apos;t be more different.
            </p>

            {/* Headline stat cards */}
            <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-sm">
                <p
                  className="text-3xl font-bold text-[#63b3ed]"
                  style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                >
                  89%
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Composure Under Pressure
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-[#63b3ed]/70">
                  Nearly universal
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-sm">
                <p
                  className="text-3xl font-bold text-secondary"
                  style={{
                    fontFamily: "'Inter Tight', Inter, sans-serif",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  12–96%
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Formality Range
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-secondary/70">
                  Most polarizing
                </p>
              </div>
            </div>

            {/* Radar chart */}
            <CorpusCommunicationRadar
              corpusAvgPersonalityVector={corpusAvgPersonalityVector}
            />

            {/* Trait scatter: mean vs spread */}
            <div className="mt-10">
              <h3
                className="text-lg font-semibold text-text-primary mb-2 text-center"
                style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
              >
                Consensus vs. Controversy
              </h3>
              <p className="text-text-secondary/70 text-center mb-6 max-w-md mx-auto text-sm">
                Each dot is a trait. Bottom-right means everyone scores high.
                Top-left means low and all over the map.
              </p>
              <div className="max-w-3xl mx-auto">
                <TraitScatterChart traitStats={personalityTraitStats} />
              </div>
            </div>

            {/* Bee swarm: individual distributions */}
            {personalityVectors && (
              <div className="mt-10">
                <h3
                  className="text-lg font-semibold text-text-primary mb-2 text-center"
                  style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                >
                  The Actual Distributions
                </h3>
                <p className="text-text-secondary/70 text-center mb-6 max-w-md mx-auto text-sm">
                  Every dot is a real entrepreneur. See the tight clusters
                  and the wide spreads for yourself.
                </p>
                <div className="max-w-3xl mx-auto">
                  <BeeSwarmChart
                    personalityVectors={personalityVectors}
                    traitStats={personalityTraitStats}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="relative px-6 py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgb(77_163_255/0.08),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2
            className="text-[clamp(1.875rem,4vw,3rem)] font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent pb-1"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            Which archetype are you?
          </h2>
          <p className="mt-4 text-lg text-text-secondary/90 font-light">
            Take the Builder&apos;s Quotient assessment and find out.
          </p>
          <div className="mt-10 group relative inline-flex items-center justify-center">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <Button
              as={Link}
              href="/assess/overview"
              size="lg"
              className="relative rounded-full border border-white/10 bg-white/5 px-12 py-6 text-lg uppercase tracking-widest text-text-primary backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95"
            >
              Begin Assessment
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
