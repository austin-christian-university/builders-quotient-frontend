import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-accent-gold">
        Get in Touch
      </p>
      <h1 className="mt-3 font-display text-[length:var(--text-fluid-4xl)] font-bold tracking-[-0.01em]">
        Contact
      </h1>
      <p className="mt-2 text-[length:var(--text-fluid-sm)] text-text-secondary">
        We&rsquo;d love to hear from you.
      </p>

      <Card className="mt-10">
        <CardContent className="prose prose-invert max-w-none pt-6 text-text-secondary">
          <p>
            Have questions about the Builders Quotient assessment, your results,
            or the admissions process? Reach out and we&rsquo;ll get back to you
            as soon as we can.
          </p>
          <p>
            Email us at{" "}
            <a
              href="mailto:bq@austinchristianu.org"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              bq@austinchristianu.org
            </a>
          </p>
          <p>
            Austin Christian University
            <br />
            Austin, TX
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
