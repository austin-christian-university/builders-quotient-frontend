import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Wrap } from "@/components/swiss/Swiss";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main id="main-content">
      <PageHeader eyebrow="Legal" title="Privacy Policy">
        <p className="mt-[clamp(20px,3vw,32px)] text-sm text-text-secondary">Last updated: February 2026</p>
      </PageHeader>

      <Wrap>
        <div className="pb-[clamp(64px,9vw,112px)]">
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">01</span>
              <span>Overview</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                Austin Christian University (&ldquo;ACU,&rdquo; &ldquo;we,&rdquo;
                &ldquo;us&rdquo;) operates the Builders Quotient assessment
                service (the &ldquo;Service&rdquo;). This policy describes how we
                collect, use, and protect your information when you use the
                Service.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">02</span>
              <span>Information We Collect</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>We collect information you provide directly, including:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Contact details</strong>
                  &mdash;name, email address, and phone number
                </li>
                <li>
                  <strong>
                    Assessment responses
                  </strong>
                  &mdash;video recordings, audio recordings, text answers, and
                  personality quiz selections
                </li>
                <li>
                  <strong>Lead preferences</strong>
                  &mdash;whether you identify as a prospective student or general
                  interest
                </li>
              </ul>
              <p>
                We also collect technical data automatically, including browser
                type, IP address, and device fingerprint to maintain the integrity
                of the assessment and prevent misuse.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">03</span>
              <span>Video &amp; Audio Recordings</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>What&rsquo;s recorded</strong>
                  &mdash;webcam video and microphone audio during assessment
                  responses
                </li>
                <li>
                  <strong>Purpose</strong>
                  &mdash;scoring your responses against expert rubrics to generate
                  your Builders Quotient profile
                </li>
                <li>
                  <strong>How processed</strong>
                  &mdash;automated speech-to-text transcription and AI-assisted
                  comparison scoring
                </li>
                <li>
                  <strong>Where stored</strong>
                  &mdash;securely in the United States on encrypted infrastructure
                </li>
                <li>
                  <strong>Retention</strong>
                  &mdash;video and audio recordings are retained for 1&nbsp;year
                  after assessment completion, then permanently deleted
                </li>
              </ul>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">04</span>
              <span>Biometric Data</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>What we collect</strong>
                  &mdash;voiceprint data derived during audio transcription;
                  facial geometry data potentially present in video recordings
                </li>
                <li>
                  <strong>Purpose</strong>
                  &mdash;exclusively for assessment scoring and response
                  processing&thinsp;&mdash;&thinsp;never for identification,
                  surveillance, or tracking
                </li>
                <li>
                  <strong>Legal basis</strong>
                  &mdash;collected with your explicit informed consent (Texas
                  Business &amp; Commerce
                  Code&nbsp;&sect;&nbsp;503.001;&nbsp;Illinois BIPA
                  740&nbsp;ILCS&nbsp;14)
                </li>
                <li>
                  <strong>Retention</strong>
                  &mdash;no longer than 1&nbsp;year after assessment completion
                </li>
                <li>
                  <strong>Destruction</strong>
                  &mdash;permanently deleted from all systems within 30&nbsp;days
                  of retention expiry
                </li>
              </ul>
              <p>
                Biometric data is never sold, leased, traded, or shared for
                profit. For full details, see our{" "}
                <Link
                  href="/biometric-policy"
                  className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  Biometric Data Retention Policy
                </Link>
                .
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">05</span>
              <span>AI &amp; Automated Processing</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Responses are processed using automated speech-to-text and
                  AI&nbsp;scoring tools
                </li>
                <li>
                  All processing is performed solely for the purpose of assessment
                  scoring and comparison
                </li>
                <li>
                  Your data is never used to train general-purpose AI models
                </li>
                <li>
                  AI service providers are contractually prohibited from retaining
                  or training on your data
                </li>
              </ul>
              <p>
                Named providers are listed in the{" "}
                <a href="#third-party" className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2">
                  Third-Party Service Providers
                </a>{" "}
                section below.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">06</span>
              <span>Phone Number Collection &amp; SMS Communications</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                We collect your phone number to deliver your assessment results.
                There are two types of SMS communications:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>
                    Transactional messages
                  </strong>
                  &mdash;a one-time notification when your results are ready. This
                  is sent to everyone who provides a phone number.
                </li>
                <li>
                  <strong>
                    Marketing messages
                  </strong>
                  &mdash;periodic updates about ACU programs and opportunities
                  (approx. 2&nbsp;msgs/month). These are only sent if you
                  explicitly opt in.
                </li>
              </ul>
              <p>
                Message and data rates may apply. You can opt out of marketing
                messages at any time by replying <strong>STOP</strong> to any
                message. Opting out of marketing messages does not affect delivery
                of your assessment results.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">07</span>
              <span>Email Communications</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>We use your email address for two purposes:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>
                    Results delivery
                  </strong>
                  &mdash;your personalized Builders Quotient profile is always
                  sent by email regardless of other preferences.
                </li>
                <li>
                  <strong>
                    Marketing communications
                  </strong>
                  &mdash;updates about ACU programs, events, and opportunities.
                  These are only sent if you explicitly opt in.
                </li>
              </ul>
              <p>
                You can unsubscribe from marketing emails at any time using the
                unsubscribe link included in every message. Unsubscribing does not
                affect delivery of your assessment results.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">08</span>
              <span>How We Use Your Data</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>Your data is used for:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Scoring and delivering your assessment results</li>
                <li>
                  Academic research on intelligence and entrepreneurship (in
                  aggregate, de-identified form)
                </li>
                <li>Improving the Service and assessment methodology</li>
                <li>
                  Sending marketing communications (only with your explicit
                  consent)
                </li>
              </ul>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">09</span>
              <span>Data Security &amp; No Sharing Commitment</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  All data stays within ACU&rsquo;s platform infrastructure
                </li>
                <li>
                  We never sell your personal information or recordings to any
                  third party
                </li>
                <li>
                  We never share your data with advertisers, data brokers, or
                  marketing platforms
                </li>
                <li>
                  Service providers (listed below) process data solely on our
                  behalf under strict contractual obligations
                </li>
              </ul>
            </div>
          </section>
          <section id="third-party" className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">10</span>
              <span>Third-Party Service Providers</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                We use the following third-party services to operate the Service:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>OpenAI</strong>
                  &mdash;audio transcription (Whisper) and response scoring (GPT).
                  Audio recordings and transcripts are sent for processing. OpenAI
                  is contractually prohibited from using your data to train its
                  models.
                </li>
                <li>
                  <strong>
                    Google (Gemini&nbsp;Studio)
                  </strong>
                  &mdash;video analysis for personality assessment and transcript
                  extraction. Video recordings and transcripts are sent for
                  processing. Google is contractually prohibited from using your
                  data to train its models.
                </li>
                <li>
                  <strong>Twilio</strong>
                  &mdash;for sending SMS messages (transactional and marketing).
                  Your phone number is shared with Twilio solely for message
                  delivery.
                </li>
                <li>
                  <strong>Supabase</strong>
                  &mdash;for secure data storage and infrastructure.
                </li>
                <li>
                  <strong>Vercel</strong>
                  &mdash;for hosting and serving the application.
                </li>
              </ul>
              <p>
                These providers process your data under their own privacy policies
                and are contractually bound to protect your information.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">11</span>
              <span>Opt-Out &amp; Unsubscribe Rights</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>SMS</strong>&mdash;reply{" "}
                  <strong>STOP</strong> to any marketing text message to
                  unsubscribe immediately.
                </li>
                <li>
                  <strong>Email</strong>&mdash;click
                  the unsubscribe link in any marketing email to stop receiving
                  them.
                </li>
                <li>
                  You may also contact us at{" "}
                  <a
                    href="mailto:enrollment@austinchristianu.org"
                    className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    enrollment@austinchristianu.org
                  </a>{" "}
                  to manage your communication preferences.
                </li>
              </ul>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">12</span>
              <span>Eligibility</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                This Service is intended for individuals aged 13 and older. If you
                are under 13, you may not use this Service. If we learn that we
                have collected personal information from a child under 13, we will
                promptly delete it. If you believe we have inadvertently collected
                data from a child under 13, please contact us at{" "}
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
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">13</span>
              <span>Data Retention</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>We retain different categories of data for specific periods:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Contact information</strong>
                  &mdash;until you request deletion or 5&nbsp;years of inactivity
                </li>
                <li>
                  <strong>
                    Video &amp; audio recordings
                  </strong>
                  &mdash;1&nbsp;year after assessment completion, then permanently
                  deleted
                </li>
                <li>
                  <strong>Biometric data</strong>
                  &mdash;1&nbsp;year after assessment completion (same lifecycle as
                  video, since video is the biometric source)
                </li>
                <li>
                  <strong>Assessment scores</strong>
                  &mdash;retained for academic research in de-identified form
                </li>
                <li>
                  <strong>
                    De-identified research data
                  </strong>
                  &mdash;retained indefinitely
                </li>
              </ul>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">14</span>
              <span>State-Specific Rights</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                <strong>Texas residents:</strong>{" "}
                You have rights under the Texas Capture or Use of Biometric
                Identifier Act (CUBI) and the Texas Data Privacy and Security Act
                (TDPSA), including the right to know what personal data we collect
                and to request its deletion.
              </p>
              <p>
                <strong>Illinois residents:</strong>{" "}
                You have rights under the Biometric Information Privacy Act (BIPA),
                including the right to receive written notice before collection of
                biometric identifiers and the right to a publicly available
                retention and destruction policy. See our{" "}
                <Link
                  href="/biometric-policy"
                  className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  Biometric Data Retention Policy
                </Link>
                .
              </p>
              <p>
                <strong>
                  California residents:
                </strong>{" "}
                Under the CCPA/CPRA, you have the right to know what personal
                information we collect, the right to request deletion, and the
                right to opt out of the sale of personal information. We do not
                sell or share your personal information for cross-context
                behavioral advertising.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">15</span>
              <span>Right to Request Data Deletion</span>
            </h2>
            <div className="col-span-4 min-w-0 max-w-[62ch] space-y-4 text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink">
              <p>
                You may request deletion of your personal data at any time by
                emailing{" "}
                <a
                  href="mailto:enrollment@austinchristianu.org"
                  className="text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  enrollment@austinchristianu.org
                </a>
                . We will process your request within 30&nbsp;days. Note that
                de-identified data used for academic research may be retained even
                after deletion of personally identifiable information.
              </p>
            </div>
          </section>
          <section className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(40px,6vw,72px)] md:grid-cols-12 md:gap-x-6">
            <h2 className="col-span-4 mb-5 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8">
              <span className="font-semibold tabular-nums text-ink">16</span>
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
