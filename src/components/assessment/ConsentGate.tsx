"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CONSENT_VERSION, type ConsentData } from "@/lib/schemas/consent";

const legalLinkClass =
  "text-primary underline underline-offset-4 hover:text-primary/80";

type ConsentGateProps = {
  onAccept: (consent: ConsentData) => void;
  /** Hide biometric checkbox (already accepted in equipment check) */
  hideBiometric?: boolean;
  /** Custom heading eyebrow text. Default: "Before We Begin" */
  eyebrow?: string;
  /** Custom heading text. Default: "Consent & Disclosure" */
  heading?: string;
  /** Custom button text. Default: "Continue to Equipment Check" */
  buttonText?: string;
  /** Show decline link below button */
  onDecline?: () => void;
  /** If true, renders without the outer min-h-dvh centering wrapper (for embedding in another page) */
  embedded?: boolean;
};

export function ConsentGate({
  onAccept,
  hideBiometric = false,
  eyebrow = "Before We Begin",
  heading = "Consent & Disclosure",
  buttonText = "Continue to Equipment Check",
  onDecline,
  embedded = false,
}: ConsentGateProps) {
  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const [videoRecording, setVideoRecording] = useState(false);
  const [biometric, setBiometric] = useState(false);

  const allChecked = hideBiometric
    ? termsPrivacy && videoRecording
    : termsPrivacy && videoRecording && biometric;

  function handleContinue() {
    if (!allChecked) return;
    onAccept({
      termsPrivacy: true,
      videoRecording: true,
      biometric: true,
      consentVersion: CONSENT_VERSION,
      consentedAt: new Date().toISOString(),
    });
  }

  const card = (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em]">
          {heading}
        </h1>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Section A: How This Assessment Works */}
        <section>
          <h2 className="text-[length:var(--text-fluid-base)] font-semibold text-text-primary">
            How This Assessment Works
          </h2>
          <ul className="mt-3 space-y-2 text-[length:var(--text-fluid-sm)] text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              Your responses are recorded via webcam (video and audio)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              Recordings are transcribed using automated speech-to-text
              technology
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              Your responses are compared against expert scoring rubrics to
              generate your Builders Quotient profile
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              All data is processed solely for assessment scoring and
              comparison&thinsp;&mdash;&thinsp;it is never sold, shared with
              third parties for marketing, or used outside this platform
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              De-identified data may be used for academic research on
              intelligence and entrepreneurship
            </li>
          </ul>
        </section>

        {/* Section B: Biometric Data Notice */}
        <section>
          <h2 className="text-[length:var(--text-fluid-base)] font-semibold text-text-primary">
            Biometric Data Notice
          </h2>
          <p className="mt-2 text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-accent-gold">
            Required by Texas &amp; Illinois law
          </p>
          <ul className="mt-3 space-y-2 text-[length:var(--text-fluid-sm)] text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              This assessment captures audio recordings from which voiceprint
              data may be derived during transcription
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              Video recordings may contain facial geometry data
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              Biometric data is used exclusively for assessment scoring and
              identity verification
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              Biometric data is retained for no longer than 1&nbsp;year after
              assessment completion and then permanently destroyed
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              Biometric data will never be sold, leased, traded, or otherwise
              shared for profit
            </li>
          </ul>
        </section>

        {/* Consent checkboxes */}
        <fieldset className="space-y-3">
          <legend className="sr-only">Consent checkboxes</legend>

          <Checkbox
            id="consent-terms"
            checked={termsPrivacy}
            onChange={setTermsPrivacy}
          >
            I have read and agree to the{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={legalLinkClass}>
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className={legalLinkClass}>
              Terms of Service
            </Link>
          </Checkbox>

          <Checkbox
            id="consent-recording"
            checked={videoRecording}
            onChange={setVideoRecording}
          >
            I consent to video and audio recording of my assessment responses
            as described above
          </Checkbox>

          {!hideBiometric && (
            <Checkbox
              id="consent-biometric"
              checked={biometric}
              onChange={setBiometric}
              className="border border-border-glass"
            >
              I consent to the collection and processing of biometric
              identifiers (voiceprint, facial geometry) as described in the{" "}
              <Link
                href="/biometric-policy"
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                Biometric Data Policy
              </Link>
            </Checkbox>
          )}
        </fieldset>

        {/* Continue button */}
        <div className="space-y-3 text-center">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!allChecked}
            onClick={handleContinue}
          >
            {buttonText}
          </Button>

          {onDecline && (
            <button
              type="button"
              onClick={onDecline}
              className="text-[length:var(--text-fluid-sm)] text-text-secondary transition-colors hover:text-text-primary"
            >
              I&apos;d rather not continue
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (embedded) {
    return card;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      {card}
    </div>
  );
}
