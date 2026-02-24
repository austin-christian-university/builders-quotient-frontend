import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-accent-gold">
        Legal
      </p>
      <h1 className="mt-3 font-display text-[length:var(--text-fluid-4xl)] font-bold tracking-[-0.01em]">
        Terms of Service
      </h1>
      <p className="mt-2 text-[length:var(--text-fluid-sm)] text-text-secondary">
        Last updated: February 2026
      </p>

      <Card className="mt-10">
        <CardContent className="prose prose-invert max-w-none pt-6 text-text-secondary">
          <p>
            By accessing or using the Builders Quotient assessment service (the
            &ldquo;Service&rdquo;) provided by Austin Christian University
            (&ldquo;ACU&rdquo;), you agree to the following terms.
          </p>
          <p>
            The Service is intended for educational assessment purposes. You
            agree to provide accurate information and to complete the assessment
            honestly. Attempts to manipulate, share, or reproduce assessment
            content are prohibited.
          </p>
          <p>
            ACU reserves the right to modify these terms at any time.
            Continued use of the Service after changes constitutes acceptance of
            the updated terms.
          </p>
          <p>
            All assessment content, scoring methodologies, and related
            intellectual property are owned by ACU. The Service is provided
            &ldquo;as is&rdquo; without warranties of any kind.
          </p>
        </CardContent>
      </Card>

      <Link
        href="/"
        className="mt-8 inline-block text-[length:var(--text-fluid-sm)] text-text-secondary underline underline-offset-4 transition-colors hover:text-text-primary"
      >
        &larr; Back to home
      </Link>
    </main>
  );
}
