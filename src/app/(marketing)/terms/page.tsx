import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Wrap } from "@/components/swiss/Swiss";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main id="main-content">
      <PageHeader eyebrow="Legal" title="Terms of Service">
        <p className="mt-[clamp(20px,3vw,32px)] text-sm text-text-secondary">Last updated: February 2026</p>
      </PageHeader>

      <Wrap>
        <div className="pb-[clamp(64px,9vw,112px)]">
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <div className="hidden md:col-span-4 md:block" aria-hidden="true" />
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                By accessing or using the Builders Quotient assessment service
                (the &ldquo;Service&rdquo;) provided by Austin Christian
                University (&ldquo;ACU&rdquo;), you agree to the following terms.
                If you do not agree to these terms, do not use the Service.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">01</span>
              <span>Eligibility</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                You must be at least 13 years old to use the Service. By using the
                Service, you represent that you are at least 13 years of age. If
                you are under 18, you represent that your parent or guardian is
                aware of and consents to your use of the Service.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">02</span>
              <span>Assessment Conduct</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
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
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">03</span>
              <span>Video &amp; Audio Recording</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                By proceeding past the consent screen, you consent to recording of
                your video and audio responses via your device&rsquo;s webcam and
                microphone. Recordings are used exclusively for assessment scoring
                and academic research. Recordings are retained for 1&nbsp;year
                after assessment completion and then permanently deleted, as
                described in our{" "}
                <Link
                  href="/privacy"
                  className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">04</span>
              <span>AI-Assisted Processing</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                Your responses are processed using automated speech-to-text
                transcription and AI-assisted scoring tools. Results are generated
                algorithmically and represent one measure of your
                abilities&thinsp;&mdash;&thinsp;they are not definitive or
                infallible. AI service providers used include OpenAI (audio
                transcription and response scoring) and Google Gemini&nbsp;Studio
                (video analysis and transcript extraction).
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">05</span>
              <span>Biometric Data</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                You acknowledge that the assessment collects biometric identifiers
                as described in our{" "}
                <Link
                  href="/biometric-policy"
                  className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  Biometric Data Retention Policy
                </Link>
                . Separate, explicit consent for biometric data collection is
                obtained before recording begins.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">06</span>
              <span>Data Ownership &amp; Use</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                ACU retains ownership of all assessment content, scoring
                methodologies, vignettes, and aggregated or de-identified results.
                Your personal data and recordings remain subject to our{" "}
                <Link
                  href="/privacy"
                  className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  Privacy Policy
                </Link>
                . We will never sell, trade, or monetize your personal data.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">07</span>
              <span>No AI Model Training</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                Your identifiable data will not be used to train general-purpose
                artificial intelligence models. De-identified, aggregated data may
                be used for academic research and to improve the assessment
                methodology.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">08</span>
              <span>Data Deletion</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                You may request deletion of your personal data by emailing{" "}
                <a
                  href="mailto:enrollment@austinchristianu.org"
                  className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  enrollment@austinchristianu.org
                </a>
                . Requests are processed within 30&nbsp;days. De-identified data
                previously used for academic research may be retained after
                deletion of your personally identifiable information.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">09</span>
              <span>Limitation of Liability</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                The Service and assessment results are provided &ldquo;as
                is&rdquo; and &ldquo;as available&rdquo; without warranties of
                any kind, whether express or implied. ACU does not guarantee the
                accuracy, completeness, or usefulness of any assessment results.
                To the fullest extent permitted by law, ACU shall not be liable
                for any indirect, incidental, special, consequential, or punitive
                damages arising from your use of the Service.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">10</span>
              <span>Governing Law</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                These terms are governed by and construed in accordance with the
                laws of the State of Texas. For claims relating to biometric data,
                the applicable state law governs (including Texas CUBI and Illinois
                BIPA where applicable).
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">11</span>
              <span>Changes to These Terms</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                ACU may modify these terms at any time by posting the revised
                version on this page with an updated &ldquo;Last updated&rdquo;
                date. Continued use of the Service after any such changes
                constitutes your acceptance of the updated terms.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">12</span>
              <span>Contact Us</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                For questions about these terms, contact us at{" "}
                <a
                  href="mailto:enrollment@austinchristianu.org"
                  className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  enrollment@austinchristianu.org
                </a>
                .
              </p>
            </div>
          </section>
          <div className="border-t border-ink pt-6">
            <Link
              href="/"
              className="text-[15px] text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              &larr; Back to home
            </Link>
          </div>
        </div>
      </Wrap>
    </main>
  );
}
