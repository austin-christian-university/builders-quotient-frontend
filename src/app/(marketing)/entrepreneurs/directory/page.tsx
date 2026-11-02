import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getExplorerData } from "@/lib/queries/entrepreneurs";
import { PageHeader, Section, EndCta } from "@/components/swiss/Swiss";
import { DirectoryList } from "./DirectoryList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrepreneur Directory | Builder's Quotient",
  description:
    "Browse and search 248+ entrepreneurs by name or archetype. See how real founders think and create.",
};

export default async function EntrepreneurDirectoryPage() {
  const data = await getExplorerData();
  if (!data) notFound();

  const { entrepreneurs } = data;

  const entries = entrepreneurs.map((e) => ({
    id: e.id,
    name: e.name,
    archetype_key: e.archetype_key,
    archetype_name: e.archetype_name,
    archetype_tagline: e.archetype_tagline,
    industries: e.industries,
  }));

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <PageHeader
        eyebrow={
          <Link href="/entrepreneurs" className="hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink">
            <span aria-hidden="true">←</span> Archetype Explorer
          </Link>
        }
        title="Entrepreneur Directory"
        lede={`Search ${entrepreneurs.length} entrepreneurs by name or filter by archetype.`}
      />

      <Section n="01" label="Index">
        <DirectoryList entrepreneurs={entries} />
      </Section>

      <EndCta
        title="Find out which archetype you are."
        body="Take the assessment and see which of these founders think like you."
        cta="Discover your archetype"
      />
    </main>
  );
}
