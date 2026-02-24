import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-accent-gold">
        Legal
      </p>
      <h1 className="mt-3 font-display text-[length:var(--text-fluid-4xl)] font-bold tracking-[-0.01em]">
        Privacy Policy
      </h1>
      <p className="mt-2 text-[length:var(--text-fluid-sm)] text-text-secondary">
        Last updated: February 2026
      </p>

      <Card className="mt-10">
        <CardContent className="prose prose-invert max-w-none pt-6 text-text-secondary">
          <p>
            Austin Christian University (&ldquo;ACU,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us&rdquo;) operates the Builders Quotient assessment service
            (the &ldquo;Service&rdquo;). This policy describes how we collect,
            use, and protect your information when you use the Service.
          </p>
          <p>
            We collect information you provide directly&mdash;such as your name,
            email address, and assessment responses&mdash;as well as technical
            data like browser type and IP address to maintain the integrity of
            the assessment.
          </p>
          <p>
            Your data is stored securely and used solely for assessment scoring,
            academic research, and improving the Service. We do not sell your
            personal information to third parties.
          </p>
          <p>
            For questions about this policy, contact us at{" "}
            <a
              href="mailto:bq@austinchristianu.org"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              bq@austinchristianu.org
            </a>
            .
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
