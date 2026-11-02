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
import { PageHeader, Section, EndCta } from "@/components/swiss/Swiss";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How Do Entrepreneurs Think? | Builder's Quotient",
  description:
    "Explore 16 entrepreneur archetypes derived from real cognitive data. See how 248+ entrepreneurs across 220 industries reason and create.",
};

export default async function EntrepreneurExplorerPage() {
  const data = await getExplorerData();
  if (!data) notFound();

  const {
    gridCells,
    stats,
    entrepreneurs,
    corpusAvgPersonalityVector,
    personalityTraitStats,
    personalityVectors,
  } = data;
  const maxCount = Math.max(...gridCells.map((c) => c.count));

  const scatterDots = entrepreneurs.map((e) => ({
    id: e.id,
    name: e.name,
    piD1: e.pi_d1_score,
    piD2: e.pi_d2_score,
    ciD1: e.ci_d1_score,
    ciD2: e.ci_d2_score,
    archetypeKey: e.archetype_key,
  }));

  const traitStatsByKey = new Map(
    (personalityTraitStats ?? []).map((trait) => [trait.key, trait]),
  );

  const composureTrait = traitStatsByKey.get("pv_06");
  const formalityTrait = traitStatsByKey.get("pv_17");

  const communicationHighlights = [
    {
      eyebrow: "Shared baseline",
      value: composureTrait ? `${Math.round(composureTrait.mean * 100)}%` : "\u2014",
      traitName: "Composure Under Pressure",
      detail: "Composure under pressure stays high across the corpus.",
    },
    {
      eyebrow: "Widest spread",
      value: formalityTrait
        ? `${Math.round(formalityTrait.min * 100)}\u2013${Math.round(formalityTrait.max * 100)}%`
        : "\u2014",
      traitName: "Formality",
      detail: "Formality is where founder styles split most sharply.",
    },
  ];

  return (
    <main id="main-content">
      <PageHeader
        eyebrow="Builder’s Quotient Research"
        title={<>How do the world&apos;s top entrepreneurs think?</>}
        lede={
          <>
            We analyzed {stats.totalEntrepreneurs} entrepreneurs across{" "}
            {stats.totalIndustries} industries to map how they reason and create.
          </>
        }
      >
        <div className="mt-[clamp(28px,3.5vw,44px)]">
          <Link
            href="/assess/overview"
            className="inline-flex h-12 items-center gap-2.5 whitespace-nowrap border border-ink px-[22px] text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Discover your archetype <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </PageHeader>

      <Section n="01" label="Findings">
        <div className="border-t border-ink">
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
      </Section>

      <Section
        n="02"
        label="Archetypes"
        title="16 Archetypes"
        lede="Our framework organizes entrepreneurial thinking into 16 archetypes based on practical intelligence and creative intelligence profiles."
      >
        <ArchetypeGrid cells={gridCells} maxCount={maxCount} />

        <div className="mt-8">
          <Link
            href="/entrepreneurs/directory"
            className="inline-flex items-center gap-2 border-b border-ink py-1 text-[15px] font-semibold transition-colors hover:border-vermilion hover:text-vermilion"
          >
            Browse all {stats.totalEntrepreneurs} entrepreneurs
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </Section>

      <Section
        n="03"
        label="The data"
        title="The Data Behind the Archetypes"
        lede={
          <>
            <span className="hidden md:inline">
              Each dot is a real entrepreneur, positioned by the two strongest
              axes within practical and creative intelligence. Clusters reveal
              the archetypes. Hover to see who they are; click to explore a
              profile.
            </span>
            <span className="md:hidden">
              Each dot is a real entrepreneur, positioned by the two strongest
              axes within practical and creative intelligence. Clusters reveal
              the archetypes. Tap a dot to see who they are, then tap the arrow
              to open their profile.
            </span>
          </>
        }
      >
        <ExplorerScatterPlots dots={scatterDots} />
      </Section>

      {corpusAvgPersonalityVector && personalityTraitStats && (
        <Section
          n="04"
          label="Communication"
          title="How Entrepreneurs Communicate"
          lede={
            <>
              Video analysis of {stats.totalEntrepreneurs}&nbsp;entrepreneurs reveals
              what&apos;s universal and what&apos;s polarizing in how they present.
            </>
          }
        >
          {/* Stat highlights: big numerals on ink rules */}
          <div className="grid grid-cols-1 border-t border-ink md:grid-cols-2 md:gap-x-6">
            {communicationHighlights.map((highlight) => (
              <div key={highlight.traitName} className="border-b border-ink pt-4 pb-5">
                <p className="text-sm text-[#8c8a84]">{highlight.eyebrow}</p>
                <p className="mt-4 text-[clamp(52px,7vw,88px)] font-semibold leading-[0.85] tracking-[-0.055em] tabular-nums">
                  {highlight.value}
                </p>
                <p className="mt-4 text-[17px] font-semibold">{highlight.traitName}</p>
                <p className="mt-1 max-w-[40ch] text-sm leading-5 text-text-secondary">
                  {highlight.detail}
                </p>
              </div>
            ))}
          </div>

          <ChartBlock
            title="Entrepreneurial Average — Communication Profile"
            description="The shape of a typical founder across 20 behavioral dimensions, averaged from video interviews."
          >
            <CorpusCommunicationRadar
              corpusAvgPersonalityVector={corpusAvgPersonalityVector}
            />
          </ChartBlock>

          <ChartBlock
            title="Where Founders Agree & Diverge"
            description="Each dot is one trait. High on the chart means founders vary widely; far right means the group scores high on average."
          >
            <TraitScatterChart traitStats={personalityTraitStats} />
          </ChartBlock>

          {personalityVectors && (
            <ChartBlock
              title={<>Five Traits, {stats.totalEntrepreneurs}&nbsp;Founders</>}
              description="Each dot is one entrepreneur. On some traits founders converge on a shared baseline; on others they spread wide open—style over consensus."
            >
              <BeeSwarmChart
                personalityVectors={personalityVectors}
                traitStats={personalityTraitStats}
              />
            </ChartBlock>
          )}
        </Section>
      )}

      <EndCta
        title="Which archetype are you?"
        body="Take the Builder’s Quotient assessment and find out."
        cta="Begin Assessment"
        href="/assess/overview"
      />
    </main>
  );
}

function ChartBlock({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-[clamp(56px,7vw,88px)] border-t border-ink pt-5">
      <h3 className="text-[clamp(20px,2vw,24px)] font-semibold leading-tight tracking-[-0.025em]">
        {title}
      </h3>
      <p className="mt-2 mb-8 max-w-[56ch] text-[15px] leading-[1.5] text-text-secondary">
        {description}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
