import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Biometric Data Retention Policy",
};

export default function BiometricPolicyPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-accent-gold">
        Legal
      </p>
      <h1 className="mt-3 font-display text-[length:var(--text-fluid-4xl)] font-bold tracking-[-0.01em]">
        Biometric Data Retention Policy
      </h1>
      <p className="mt-2 text-[length:var(--text-fluid-sm)] text-text-secondary">
        Last updated: February 2026
      </p>

      <Card className="mt-10">
        <CardContent className="space-y-8 pt-6 text-text-secondary">
          {/* Purpose */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Purpose
            </h2>
            <p>
              Austin Christian University (&ldquo;ACU&rdquo;) collects biometric
              identifiers solely for the Builders Quotient assessment&thinsp;&mdash;&thinsp;specifically,
              voiceprint data derived during automated speech-to-text
              transcription and facial geometry data potentially present in video
              recordings. This policy is published in compliance with the
              Illinois Biometric Information Privacy Act (740&nbsp;ILCS&nbsp;14)
              and the Texas Capture or Use of Biometric Identifier Act
              (Tex.&nbsp;Bus.&nbsp;&amp;&nbsp;Com.&nbsp;Code&nbsp;&sect;&nbsp;503.001).
            </p>
          </section>

          {/* What We Collect */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              What We Collect
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-text-primary">Voiceprints</strong>
                &mdash;derived from audio processing during automated
                speech-to-text transcription of your assessment responses
              </li>
              <li>
                <strong className="text-text-primary">Facial geometry</strong>
                &mdash;potentially present in video recordings of your
                assessment responses
              </li>
            </ul>
            <p>
              These biometric identifiers are used exclusively for assessment
              scoring and comparison against expert rubrics. They are never used
              for identification, surveillance, or tracking purposes.
            </p>
          </section>

          {/* Retention Schedule */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Retention Schedule
            </h2>
            <p>
              Biometric data is retained for no longer than <strong className="text-text-primary">1&nbsp;year</strong> after
              assessment completion. Because the video recordings are the source
              of biometric data, both share the same retention lifecycle.
            </p>
          </section>

          {/* Destruction */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Destruction
            </h2>
            <p>
              Within 30&nbsp;days of the retention period expiring, biometric
              data is permanently deleted from all production systems. Encrypted
              backups containing biometric data are purged on their next rotation
              cycle, not to exceed 90&nbsp;days after the retention period
              expires.
            </p>
          </section>

          {/* No Sale or Disclosure */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              No Sale or Disclosure
            </h2>
            <p>
              Biometric data is never sold, leased, traded, or otherwise
              disclosed for profit. Biometric data is not shared with any third
              party except service providers operating under strict contractual
              obligations that prohibit independent use, retention, or
              disclosure.
            </p>
          </section>

          {/* Storage & Security */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Storage &amp; Security
            </h2>
            <p>
              Biometric data is stored encrypted at rest in United States data
              centers. Access is restricted to authorized systems performing
              assessment scoring. Data in transit is encrypted using TLS&nbsp;1.2
              or higher.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Your Rights
            </h2>
            <p>
              You may request information about or deletion of your biometric
              data at any time by contacting{" "}
              <a
                href="mailto:bq@austinchristianu.org"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                bq@austinchristianu.org
              </a>
              . We will respond to your request within 30&nbsp;days.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Contact Us
            </h2>
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
          </section>
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
