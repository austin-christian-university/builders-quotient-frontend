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
        <CardContent className="space-y-8 pt-6 text-text-secondary">
          {/* Introduction */}
          <section>
            <p>
              By accessing or using the Builders Quotient assessment service
              (the &ldquo;Service&rdquo;) provided by Austin Christian
              University (&ldquo;ACU&rdquo;), you agree to the following terms.
              If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Eligibility
            </h2>
            <p>
              You must be at least 13 years old to use the Service. By using the
              Service, you represent that you are at least 13 years of age. If
              you are under 18, you represent that your parent or guardian is
              aware of and consents to your use of the Service.
            </p>
          </section>

          {/* Assessment Conduct */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Assessment Conduct
            </h2>
            <p>
              The Service is intended for educational assessment purposes. You
              agree to:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Provide accurate information and complete the assessment honestly</li>
              <li>Record in a private setting free from outside assistance</li>
              <li>Use your own identity&thinsp;&mdash;&thinsp;you may not take the assessment on behalf of another person</li>
              <li>Not share, reproduce, screenshot, or redistribute assessment content, vignettes, or scoring rubrics</li>
            </ul>
            <p>
              Attempts to manipulate, share, or reverse-engineer assessment
              content are prohibited and may result in invalidation of your
              results.
            </p>
          </section>

          {/* Video & Audio Recording */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Video &amp; Audio Recording
            </h2>
            <p>
              By proceeding past the consent screen, you consent to recording of
              your video and audio responses via your device&rsquo;s webcam and
              microphone. Recordings are used exclusively for assessment scoring
              and academic research. Recordings are retained for 1&nbsp;year
              after assessment completion and then permanently deleted, as
              described in our{" "}
              <Link
                href="/privacy"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          {/* AI-Assisted Processing */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              AI-Assisted Processing
            </h2>
            <p>
              Your responses are processed using automated speech-to-text
              transcription and AI-assisted scoring tools. Results are generated
              algorithmically and represent one measure of your
              abilities&thinsp;&mdash;&thinsp;they are not definitive or
              infallible. AI service providers used include OpenAI (audio
              transcription and response scoring) and Google Gemini&nbsp;Studio
              (video analysis and transcript extraction).
            </p>
          </section>

          {/* Biometric Data */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Biometric Data
            </h2>
            <p>
              You acknowledge that the assessment collects biometric identifiers
              as described in our{" "}
              <Link
                href="/biometric-policy"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Biometric Data Retention Policy
              </Link>
              . Separate, explicit consent for biometric data collection is
              obtained before recording begins.
            </p>
          </section>

          {/* Data Ownership & Use */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Data Ownership &amp; Use
            </h2>
            <p>
              ACU retains ownership of all assessment content, scoring
              methodologies, vignettes, and aggregated or de-identified results.
              Your personal data and recordings remain subject to our{" "}
              <Link
                href="/privacy"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Privacy Policy
              </Link>
              . We will never sell, trade, or monetize your personal data.
            </p>
          </section>

          {/* No AI Model Training */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              No AI Model Training
            </h2>
            <p>
              Your identifiable data will not be used to train general-purpose
              artificial intelligence models. De-identified, aggregated data may
              be used for academic research and to improve the assessment
              methodology.
            </p>
          </section>

          {/* Data Deletion */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Data Deletion
            </h2>
            <p>
              You may request deletion of your personal data by emailing{" "}
              <a
                href="mailto:bq@austinchristianu.org"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                bq@austinchristianu.org
              </a>
              . Requests are processed within 30&nbsp;days. De-identified data
              previously used for academic research may be retained after
              deletion of your personally identifiable information.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Limitation of Liability
            </h2>
            <p>
              The Service and assessment results are provided &ldquo;as
              is&rdquo; and &ldquo;as available&rdquo; without warranties of
              any kind, whether express or implied. ACU does not guarantee the
              accuracy, completeness, or usefulness of any assessment results.
              To the fullest extent permitted by law, ACU shall not be liable
              for any indirect, incidental, special, consequential, or punitive
              damages arising from your use of the Service.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Governing Law
            </h2>
            <p>
              These terms are governed by and construed in accordance with the
              laws of the State of Texas. For claims relating to biometric data,
              the applicable state law governs (including Texas CUBI and Illinois
              BIPA where applicable).
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Changes to These Terms
            </h2>
            <p>
              ACU may modify these terms at any time by posting the revised
              version on this page with an updated &ldquo;Last updated&rdquo;
              date. Continued use of the Service after any such changes
              constitutes your acceptance of the updated terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Contact Us
            </h2>
            <p>
              For questions about these terms, contact us at{" "}
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
