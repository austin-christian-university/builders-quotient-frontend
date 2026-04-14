import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getExplorerData } from "@/lib/queries/entrepreneurs";
import { StatCard } from "@/components/entrepreneurs/StatCard";
import { ArchetypeGrid } from "@/components/entrepreneurs/ArchetypeGrid";
import { ExplorerScatterPlots } from "./ExplorerScatterPlots";
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

  const { gridCells, stats, entrepreneurs, corpusMax } = data;
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
              label={`are ${stats.dominantArchetype.name}s`}
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
            className="text-2xl font-bold text-text-primary mb-2 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            16 Archetypes
          </h2>
          <p className="text-text-secondary/70 text-center mb-10 max-w-xl mx-auto">
            Every entrepreneur falls into one of 16 cognitive archetypes based on how
            they solve problems and create opportunities.
          </p>
          <ArchetypeGrid cells={gridCells} maxCount={maxCount} />
        </div>
      </section>

      {/* Scatter Plots */}
      <section className="px-6 py-16 md:py-24 border-t border-border/50">
        <div className="mx-auto max-w-7xl">
          <h2
            className="text-2xl font-bold text-text-primary mb-2 text-center"
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
