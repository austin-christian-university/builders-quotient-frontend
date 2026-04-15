import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getExplorerData } from "@/lib/queries/entrepreneurs";
import { DirectoryList } from "./DirectoryList";

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
    <main className="relative min-h-screen bg-bg-base">
      <section className="relative px-6 pt-24 pb-16 md:pt-32 md:pb-20">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgb(77_163_255/0.06),transparent)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <Link
            href="/entrepreneurs"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-text-secondary/60 hover:text-text-secondary transition-colors mb-8"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Archetype Explorer
          </Link>

          {/* Header */}
          <h1
            className="text-[clamp(1.875rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-text-primary"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            Entrepreneur Directory
          </h1>
          <p className="mt-3 text-base text-text-secondary/80 font-light max-w-xl">
            Search {entrepreneurs.length} entrepreneurs by name or filter by archetype.
          </p>

          {/* Directory list */}
          <div className="mt-10">
            <DirectoryList entrepreneurs={entries} />
          </div>
        </div>
      </section>
    </main>
  );
}
