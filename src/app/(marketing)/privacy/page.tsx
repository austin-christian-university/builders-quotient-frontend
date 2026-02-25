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
        <CardContent className="prose prose-invert max-w-none space-y-8 pt-6 text-text-secondary">
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
                &mdash;video recordings, text answers, and personality quiz
                selections
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
            <p>
              We do not sell your personal information to third parties.
            </p>
          </section>

          {/* Third-Party Service Providers */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Third-Party Service Providers
            </h2>
            <p>
              We use the following third-party services to operate the Service:
            </p>
            <ul className="list-disc space-y-1 pl-5">
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

          {/* Data Retention */}
          <section>
            <h2 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
              Data Retention
            </h2>
            <p>
              We retain your assessment data and contact information for as long
              as needed to fulfill the purposes described in this policy, or as
              required by law. Assessment responses used for academic research
              are retained in de-identified form indefinitely.
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
