import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getArchetypeDetail } from "@/lib/queries/entrepreneurs";
import { ARCHETYPES, PI_STYLES, CI_STYLES } from "@/lib/schemas/entrepreneurs";
import { EntrepreneurCard } from "@/components/entrepreneurs/EntrepreneurCard";
import { PageHeader, Section, EndCta } from "@/components/swiss/Swiss";
import { ArchetypeDetailRadars } from "./ArchetypeDetailRadars";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ archetype_key: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { archetype_key } = await params;
  const ref = ARCHETYPES.find((a) => a.key === archetype_key);
  if (!ref) return { title: "Archetype Not Found" };

  return {
    title: `${ref.name} — ${ref.tagline} | Builder's Quotient`,
    description: `Explore the ${ref.name.replace(/^The /, "")} entrepreneur archetype. ${ref.tagline}`,
  };
}

export default async function ArchetypeDetailPage({ params }: PageProps) {
  const { archetype_key } = await params;
  const data = await getArchetypeDetail(archetype_key);
  if (!data) notFound();

  const { archetype, description, entrepreneurs, avgPiScores, avgCiScores, corpusAvgPiScores, corpusAvgCiScores, corpusMax } = data;

  const piStyleLabel = PI_STYLES.find((s) => s.key === archetype.piStyle)?.label ?? archetype.piStyle;
  const ciStyleLabel = CI_STYLES.find((s) => s.key === archetype.ciStyle)?.label ?? archetype.ciStyle;

  const shortName = archetype.name.replace(/^The /, "");
  const count = entrepreneurs.length;

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <PageHeader
        eyebrow={
          <Link
            href="/entrepreneurs"
            className="hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink"
          >
            <span aria-hidden="true">←</span> All Archetypes
          </Link>
        }
        title={archetype.name}
        lede={<>&ldquo;{archetype.tagline}&rdquo;</>}
      >
        {description && (
          <p className="mt-6 max-w-[56ch] text-[clamp(17px,1.4vw,19px)] leading-[1.5] text-[#3d3c39]">
            {description}
          </p>
        )}

        <dl className="mt-[clamp(40px,5vw,64px)] grid max-w-[720px] grid-cols-1 border-t border-ink sm:grid-cols-3">
          <div className="border-b border-border py-4 sm:border-b-0 sm:pr-6">
            <dt className="text-sm text-[#8c8a84]">Thinks</dt>
            <dd className="mt-1 text-lg font-semibold tracking-[-0.02em]">{piStyleLabel} thinker</dd>
          </div>
          <div className="border-b border-border py-4 sm:border-b-0 sm:border-l sm:px-6">
            <dt className="text-sm text-[#8c8a84]">Creates</dt>
            <dd className="mt-1 text-lg font-semibold tracking-[-0.02em]">{ciStyleLabel} creator</dd>
          </div>
          <div className="py-4 sm:border-l sm:pl-6">
            <dt className="text-sm text-[#8c8a84]">Shared by</dt>
            <dd className="mt-1 text-lg font-semibold tracking-[-0.02em] tabular-nums">
              {count} entrepreneur{count !== 1 ? "s" : ""}
            </dd>
          </div>
        </dl>
      </PageHeader>

      <Section
        n="01"
        label="Profile"
        title={<>What makes {shortName}s distinct</>}
        lede={`Compared to the average across all ${count > 1 ? "248" : "all"} entrepreneurs`}
      >
        <ArchetypeDetailRadars
          avgPiScores={avgPiScores}
          avgCiScores={avgCiScores}
          corpusAvgPiScores={corpusAvgPiScores}
          corpusAvgCiScores={corpusAvgCiScores}
          corpusMax={corpusMax}
        />
      </Section>

      <Section n="02" label="Entrepreneurs" title={<>{shortName}s</>}>
        <ul className="border-t border-ink">
          {entrepreneurs.map((e) => (
            <li key={e.id}>
              <EntrepreneurCard id={e.id} name={e.name} industries={e.industries} />
            </li>
          ))}
        </ul>
      </Section>

      <EndCta
        title={
          <>
            Are you {/^[aeiou]/i.test(shortName) ? "an" : "a"} {shortName}?
          </>
        }
        body="Take the assessment to find out."
        cta="Discover your archetype"
      />
    </main>
  );
}
