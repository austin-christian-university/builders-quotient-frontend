"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CONSENT_VERSION, type ConsentData } from "@/lib/schemas/consent";

function Checkbox({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-glass px-4 py-3 transition-colors hover:bg-white/[0.03] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg-base"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded border border-text-secondary/40 bg-transparent transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none"
        style={{
          backgroundImage: checked
            ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='%230a0a0c' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E")`
            : "none",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <span className="text-[length:var(--text-fluid-sm)] text-text-secondary leading-snug">
        {children}
      </span>
    </label>
  );
}

const legalLinkClass =
  "text-primary underline underline-offset-4 hover:text-primary/80";

export function ConsentGate({
  onAccept,
}: {
  onAccept: (consent: ConsentData) => void;
}) {
  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const [videoRecording, setVideoRecording] = useState(false);
  const [biometric, setBiometric] = useState(false);

  const allChecked = termsPrivacy && videoRecording && biometric;

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

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
            Before We Begin
          </p>
          <h1 className="mt-2 font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em]">
            Consent &amp; Disclosure
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
              <Link href="/privacy" target="_blank" className={legalLinkClass}>
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" target="_blank" className={legalLinkClass}>
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

            <Checkbox
              id="consent-biometric"
              checked={biometric}
              onChange={setBiometric}
            >
              I consent to the collection and processing of biometric
              identifiers (voiceprint, facial geometry) as described in the{" "}
              <Link
                href="/biometric-policy"
                target="_blank"
                className={legalLinkClass}
              >
                Biometric Data Policy
              </Link>
            </Checkbox>
          </fieldset>

          {/* Continue button */}
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!allChecked}
            onClick={handleContinue}
          >
            Continue to Equipment Check
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
