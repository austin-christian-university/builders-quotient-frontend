import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Wrap } from "@/components/swiss/Swiss";

export const metadata: Metadata = {
  title: "Biometric Data Retention Policy",
};

export default function BiometricPolicyPage() {
  return (
    <main id="main-content">
      <PageHeader eyebrow="Legal" title="Biometric Data Retention Policy">
        <p className="mt-[clamp(20px,3vw,32px)] text-sm text-text-secondary">Last updated: February 2026</p>
      </PageHeader>

      <Wrap>
        <div className="pb-[clamp(64px,9vw,112px)]">
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">01</span>
              <span>Purpose</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
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
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">02</span>
              <span>What We Collect</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Voiceprints</strong>
                  &mdash;derived from audio processing during automated
                  speech-to-text transcription of your assessment responses
                </li>
                <li>
                  <strong>Facial geometry</strong>
                  &mdash;potentially present in video recordings of your
                  assessment responses
                </li>
              </ul>
              <p>
                These biometric identifiers are used exclusively for assessment
                scoring and comparison against expert rubrics. They are never used
                for identification, surveillance, or tracking purposes.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">03</span>
              <span>Retention Schedule</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                Biometric data is retained for no longer than <strong>1&nbsp;year</strong> after
                assessment completion. Because the video recordings are the source
                of biometric data, both share the same retention lifecycle.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">04</span>
              <span>Destruction</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                Within 30&nbsp;days of the retention period expiring, biometric
                data is permanently deleted from all production systems. Encrypted
                backups containing biometric data are purged on their next rotation
                cycle, not to exceed 90&nbsp;days after the retention period
                expires.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">05</span>
              <span>No Sale or Disclosure</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                Biometric data is never sold, leased, traded, or otherwise
                disclosed for profit. Biometric data is not shared with any third
                party except service providers operating under strict contractual
                obligations that prohibit independent use, retention, or
                disclosure.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">06</span>
              <span>Storage &amp; Security</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                Biometric data is stored encrypted at rest in United States data
                centers. Access is restricted to authorized systems performing
                assessment scoring. Data in transit is encrypted using TLS&nbsp;1.2
                or higher.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">07</span>
              <span>Your Rights</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                You may request information about or deletion of your biometric
                data at any time by contacting{" "}
                <a
                  href="mailto:enrollment@austinchristianu.org"
                  className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  enrollment@austinchristianu.org
                </a>
                . We will respond to your request within 30&nbsp;days.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">08</span>
              <span>Contact Us</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                For questions about this policy, contact us at{" "}
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
