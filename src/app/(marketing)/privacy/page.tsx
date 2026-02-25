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
        <CardContent className="space-y-8 pt-6 text-text-secondary">
          {/* Overview */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Overview
            </h2>
            <p>
              Austin Christian University (&ldquo;ACU,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us&rdquo;) operates the Builders Quotient assessment
              service (the &ldquo;Service&rdquo;). This policy describes how we
              collect, use, and protect your information when you use the
              Service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Information We Collect
            </h2>
            <p>We collect information you provide directly, including:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-text-primary">Contact details</strong>
                &mdash;name, email address, and phone number
              </li>
              <li>
                <strong className="text-text-primary">
                  Assessment responses
                </strong>
                &mdash;video recordings, audio recordings, text answers, and
                personality quiz selections
              </li>
              <li>
                <strong className="text-text-primary">Lead preferences</strong>
                &mdash;whether you identify as a prospective student or general
                interest
              </li>
            </ul>
            <p>
              We also collect technical data automatically, including browser
              type, IP address, and device fingerprint to maintain the integrity
              of the assessment and prevent misuse.
            </p>
          </section>

          {/* Video & Audio Recordings */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Video &amp; Audio Recordings
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-text-primary">What&rsquo;s recorded</strong>
                &mdash;webcam video and microphone audio during assessment
                responses
              </li>
              <li>
                <strong className="text-text-primary">Purpose</strong>
                &mdash;scoring your responses against expert rubrics to generate
                your Builders Quotient profile
              </li>
              <li>
                <strong className="text-text-primary">How processed</strong>
                &mdash;automated speech-to-text transcription and AI-assisted
                comparison scoring
              </li>
              <li>
                <strong className="text-text-primary">Where stored</strong>
                &mdash;securely in the United States on encrypted infrastructure
              </li>
              <li>
                <strong className="text-text-primary">Retention</strong>
                &mdash;video and audio recordings are retained for 1&nbsp;year
                after assessment completion, then permanently deleted
              </li>
            </ul>
          </section>

          {/* Biometric Data */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Biometric Data
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-text-primary">What we collect</strong>
                &mdash;voiceprint data derived during audio transcription;
                facial geometry data potentially present in video recordings
              </li>
              <li>
                <strong className="text-text-primary">Purpose</strong>
                &mdash;exclusively for assessment scoring and response
                processing&thinsp;&mdash;&thinsp;never for identification,
                surveillance, or tracking
              </li>
              <li>
                <strong className="text-text-primary">Legal basis</strong>
                &mdash;collected with your explicit informed consent (Texas
                Business &amp; Commerce
                Code&nbsp;&sect;&nbsp;503.001;&nbsp;Illinois BIPA
                740&nbsp;ILCS&nbsp;14)
              </li>
              <li>
                <strong className="text-text-primary">Retention</strong>
                &mdash;no longer than 1&nbsp;year after assessment completion
              </li>
              <li>
                <strong className="text-text-primary">Destruction</strong>
                &mdash;permanently deleted from all systems within 30&nbsp;days
                of retention expiry
              </li>
            </ul>
            <p>
              Biometric data is never sold, leased, traded, or shared for
              profit. For full details, see our{" "}
              <Link
                href="/biometric-policy"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Biometric Data Retention Policy
              </Link>
              .
            </p>
          </section>

          {/* AI & Automated Processing */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              AI &amp; Automated Processing
            </h2>
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
              <a href="#third-party" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Third-Party Service Providers
              </a>{" "}
              section below.
            </p>
          </section>

          {/* Phone Number Collection & SMS */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Phone Number Collection &amp; SMS Communications
            </h2>
            <p>
              We collect your phone number to deliver your assessment results.
              There are two types of SMS communications:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-text-primary">
                  Transactional messages
                </strong>
                &mdash;a one-time notification when your results are ready. This
                is sent to everyone who provides a phone number.
              </li>
              <li>
                <strong className="text-text-primary">
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
          </section>

          {/* Email Communications */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Email Communications
            </h2>
            <p>We use your email address for two purposes:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-text-primary">
                  Results delivery
                </strong>
                &mdash;your personalized Builders Quotient profile is always
                sent by email regardless of other preferences.
              </li>
              <li>
                <strong className="text-text-primary">
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
          </section>

          {/* How We Use Your Data */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              How We Use Your Data
            </h2>
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
          </section>

          {/* Data Security & No Sharing */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Data Security &amp; No Sharing Commitment
            </h2>
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
          </section>

          {/* Third-Party Service Providers */}
          <section id="third-party">
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Third-Party Service Providers
            </h2>
            <p>
              We use the following third-party services to operate the Service:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-text-primary">OpenAI</strong>
                &mdash;audio transcription (Whisper) and response scoring (GPT).
                Audio recordings and transcripts are sent for processing. OpenAI
                is contractually prohibited from using your data to train its
                models.
              </li>
              <li>
                <strong className="text-text-primary">
                  Google (Gemini&nbsp;Studio)
                </strong>
                &mdash;video analysis for personality assessment and transcript
                extraction. Video recordings and transcripts are sent for
                processing. Google is contractually prohibited from using your
                data to train its models.
              </li>
              <li>
                <strong className="text-text-primary">Twilio</strong>
                &mdash;for sending SMS messages (transactional and marketing).
                Your phone number is shared with Twilio solely for message
                delivery.
              </li>
              <li>
                <strong className="text-text-primary">Supabase</strong>
                &mdash;for secure data storage and infrastructure.
              </li>
              <li>
                <strong className="text-text-primary">Vercel</strong>
                &mdash;for hosting and serving the application.
              </li>
            </ul>
            <p>
              These providers process your data under their own privacy policies
              and are contractually bound to protect your information.
            </p>
          </section>

          {/* Opt-Out & Unsubscribe Rights */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Opt-Out &amp; Unsubscribe Rights
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-text-primary">SMS</strong>&mdash;reply{" "}
                <strong>STOP</strong> to any marketing text message to
                unsubscribe immediately.
              </li>
              <li>
                <strong className="text-text-primary">Email</strong>&mdash;click
                the unsubscribe link in any marketing email to stop receiving
                them.
              </li>
              <li>
                You may also contact us at{" "}
                <a
                  href="mailto:bq@austinchristianu.org"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  bq@austinchristianu.org
                </a>{" "}
                to manage your communication preferences.
              </li>
            </ul>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Eligibility
            </h2>
            <p>
              This Service is intended for individuals aged 13 and older. If you
              are under 13, you may not use this Service. If we learn that we
              have collected personal information from a child under 13, we will
              promptly delete it. If you believe we have inadvertently collected
              data from a child under 13, please contact us at{" "}
              <a
                href="mailto:bq@austinchristianu.org"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                bq@austinchristianu.org
              </a>
              .
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Data Retention
            </h2>
            <p>We retain different categories of data for specific periods:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-text-primary">Contact information</strong>
                &mdash;until you request deletion or 5&nbsp;years of inactivity
              </li>
              <li>
                <strong className="text-text-primary">
                  Video &amp; audio recordings
                </strong>
                &mdash;1&nbsp;year after assessment completion, then permanently
                deleted
              </li>
              <li>
                <strong className="text-text-primary">Biometric data</strong>
                &mdash;1&nbsp;year after assessment completion (same lifecycle as
                video, since video is the biometric source)
              </li>
              <li>
                <strong className="text-text-primary">Assessment scores</strong>
                &mdash;retained for academic research in de-identified form
              </li>
              <li>
                <strong className="text-text-primary">
                  De-identified research data
                </strong>
                &mdash;retained indefinitely
              </li>
            </ul>
          </section>

          {/* State-Specific Rights */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              State-Specific Rights
            </h2>
            <p>
              <strong className="text-text-primary">Texas residents:</strong>{" "}
              You have rights under the Texas Capture or Use of Biometric
              Identifier Act (CUBI) and the Texas Data Privacy and Security Act
              (TDPSA), including the right to know what personal data we collect
              and to request its deletion.
            </p>
            <p>
              <strong className="text-text-primary">Illinois residents:</strong>{" "}
              You have rights under the Biometric Information Privacy Act (BIPA),
              including the right to receive written notice before collection of
              biometric identifiers and the right to a publicly available
              retention and destruction policy. See our{" "}
              <Link
                href="/biometric-policy"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Biometric Data Retention Policy
              </Link>
              .
            </p>
            <p>
              <strong className="text-text-primary">
                California residents:
              </strong>{" "}
              Under the CCPA/CPRA, you have the right to know what personal
              information we collect, the right to request deletion, and the
              right to opt out of the sale of personal information. We do not
              sell or share your personal information for cross-context
              behavioral advertising.
            </p>
          </section>

          {/* Right to Deletion */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Right to Request Data Deletion
            </h2>
            <p>
              You may request deletion of your personal data at any time by
              emailing{" "}
              <a
                href="mailto:bq@austinchristianu.org"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                bq@austinchristianu.org
              </a>
              . We will process your request within 30&nbsp;days. Note that
              de-identified data used for academic research may be retained even
              after deletion of personally identifiable information.
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
