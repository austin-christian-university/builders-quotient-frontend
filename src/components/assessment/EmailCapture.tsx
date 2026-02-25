"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { captureEmail } from "@/lib/actions/applicant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LeadType } from "@/lib/schemas/applicant";

type FormState =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<
        Record<"email" | "firstName" | "phone" | "leadType", string>
      >;
    }
  | null;

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const leadTypeOptions: { value: LeadType; label: string }[] = [
  { value: "prospective_student", label: "I\u2019m a prospective student" },
  { value: "general_interest", label: "I\u2019m anybody else" },
];

export function EmailCapture() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      return await captureEmail(formData);
    },
    null
  );

  const [leadType, setLeadType] = useState<LeadType | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const leadTypeRef = useRef<HTMLFieldSetElement>(null);

  // Focus first invalid field on error
  useEffect(() => {
    if (!state || state.success) return;
    if (state.fieldErrors?.email) {
      emailRef.current?.focus();
    } else if (state.fieldErrors?.firstName) {
      firstNameRef.current?.focus();
    } else if (state.fieldErrors?.phone) {
      phoneRef.current?.focus();
    } else if (state.fieldErrors?.leadType) {
      leadTypeRef.current?.focus();
    }
  }, [state]);

  const failState = state && !state.success ? state : null;
  const emailError = failState?.fieldErrors?.email;
  const firstNameError = failState?.fieldErrors?.firstName;
  const phoneError = failState?.fieldErrors?.phone;
  const leadTypeError = failState?.fieldErrors?.leadType;
  const generalError =
    failState?.error && !failState.fieldErrors ? failState.error : null;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Achievement header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10">
            <svg
              className="h-8 w-8 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-secondary">
            Assessment Complete
          </p>
          <h1 className="mt-2 font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em]">
            Get Your Results
          </h1>
          <p className="mt-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
            Enter your details to receive your personalized Builders Quotient
            profile via email and text within 24&nbsp;hours.
          </p>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-4" noValidate>
          {/* General error */}
          {generalError && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            >
              {generalError}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[length:var(--text-fluid-sm)] font-medium text-text-primary"
            >
              Email address
            </label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              required
              placeholder="you@example.com"
              aria-invalid={emailError ? "true" : undefined}
              aria-describedby={emailError ? "email-error" : undefined}
            />
            {emailError && (
              <p
                id="email-error"
                role="alert"
                className="mt-1.5 text-[length:var(--text-fluid-sm)] text-red-400"
              >
                {emailError}
              </p>
            )}
          </div>

          {/* First name */}
          <div>
            <label
              htmlFor="firstName"
              className="mb-1.5 block text-[length:var(--text-fluid-sm)] font-medium text-text-primary"
            >
              First name{" "}
              <span className="text-text-secondary">(optional)</span>
            </label>
            <Input
              ref={firstNameRef}
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Your first name&hellip;"
              aria-invalid={firstNameError ? "true" : undefined}
              aria-describedby={
                firstNameError ? "firstName-error" : undefined
              }
            />
            {firstNameError && (
              <p
                id="firstName-error"
                role="alert"
                className="mt-1.5 text-[length:var(--text-fluid-sm)] text-red-400"
              >
                {firstNameError}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-[length:var(--text-fluid-sm)] font-medium text-text-primary"
            >
              Phone number
            </label>
            <Input
              ref={phoneRef}
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="(512) 555-1234"
              aria-invalid={phoneError ? "true" : undefined}
              aria-describedby={
                phoneError ? "phone-error" : "phone-disclosure"
              }
            />
            {phoneError && (
              <p
                id="phone-error"
                role="alert"
                className="mt-1.5 text-[length:var(--text-fluid-sm)] text-red-400"
              >
                {phoneError}
              </p>
            )}
            <p
              id="phone-disclosure"
              className="mt-1.5 text-[length:var(--text-fluid-xs)] leading-relaxed text-text-secondary"
            >
              We&rsquo;ll text you once when your results are ready. No spam,
              ever. Message&nbsp;&amp;&nbsp;data rates may apply.
            </p>
          </div>

          {/* Lead type toggle */}
          <fieldset
            ref={leadTypeRef}
            tabIndex={-1}
            aria-describedby={leadTypeError ? "leadType-error" : undefined}
          >
            <legend className="mb-2 text-[length:var(--text-fluid-sm)] font-medium text-text-primary">
              What best describes you?{" "}
              <span className="font-normal text-text-secondary">
                So we can personalize your results
              </span>
            </legend>
            <input type="hidden" name="leadType" value={leadType ?? ""} />
            <LeadTypeRadioGroup
              options={leadTypeOptions}
              value={leadType}
              onChange={setLeadType}
            />
            {leadTypeError && (
              <p
                id="leadType-error"
                role="alert"
                className="mt-1.5 text-[length:var(--text-fluid-sm)] text-red-400"
              >
                {leadTypeError}
              </p>
            )}
          </fieldset>

          {/* Marketing consent */}
          <div className="space-y-3 rounded-xl border border-border-glass bg-bg-elevated/60 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="smsMarketingConsent"
                value="true"
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-border-glass bg-bg-elevated/60 bg-center bg-no-repeat transition-colors checked:border-primary/60 checked:bg-primary/20 checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg+viewBox%3D%220+0+16+16%22+fill%3D%22none%22+xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath+d%3D%22M12+5L6.5+11+4+8.5%22+stroke%3D%22%234da3ff%22+stroke-width%3D%222%22+stroke-linecap%3D%22round%22+stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
              />
              <span className="text-[length:var(--text-fluid-xs)] leading-relaxed text-text-secondary">
                I&rsquo;d like to receive text messages from ACU about programs
                and opportunities. Approx. 2&nbsp;msgs/month.
                Msg&nbsp;&amp;&nbsp;data rates may apply. Reply STOP to opt
                out.
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="emailMarketingConsent"
                value="true"
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-border-glass bg-bg-elevated/60 bg-center bg-no-repeat transition-colors checked:border-primary/60 checked:bg-primary/20 checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg+viewBox%3D%220+0+16+16%22+fill%3D%22none%22+xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath+d%3D%22M12+5L6.5+11+4+8.5%22+stroke%3D%22%234da3ff%22+stroke-width%3D%222%22+stroke-linecap%3D%22round%22+stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
              />
              <span className="text-[length:var(--text-fluid-xs)] leading-relaxed text-text-secondary">
                Send me updates about ACU programs, events, and opportunities
                via email. Unsubscribe anytime.
              </span>
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner />
                Request My Results
              </>
            ) : (
              "Request My Results"
            )}
          </Button>

          {/* Legal links */}
          <p className="text-center text-[length:var(--text-fluid-xs)] leading-relaxed text-text-secondary">
            By submitting, you agree to our{" "}
            <a
              href="/terms"
              className="text-text-primary underline underline-offset-4 transition-colors hover:text-primary"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-text-primary underline underline-offset-4 transition-colors hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </div>
    </div>
  );
}

// --- LeadType radio group with arrow key navigation ---

function LeadTypeRadioGroup({
  options,
  value,
  onChange,
}: {
  options: { value: LeadType; label: string }[];
  value: LeadType | null;
  onChange: (value: LeadType) => void;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
      e.preventDefault();

      const currentIndex = value ? options.findIndex((o) => o.value === value) : 0;
      let nextIndex: number;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % options.length;
      } else {
        nextIndex = (currentIndex - 1 + options.length) % options.length;
      }

      onChange(options[nextIndex].value);

      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[nextIndex]?.focus();
    },
    [value, options, onChange]
  );

  return (
    <div
      ref={groupRef}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      role="radiogroup"
      aria-label="What best describes you?"
      onKeyDown={handleKeyDown}
    >
      {options.map((option, i) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected || (!value && i === 0) ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={[
              "min-h-[3rem] rounded-xl px-4 py-3",
              "text-[length:var(--text-fluid-sm)] font-medium leading-snug",
              "transition-all duration-200 ease-[var(--ease-out-expo)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
              "cursor-pointer",
              isSelected
                ? "border border-primary/60 bg-primary/10 text-text-primary shadow-[0_0_16px_rgb(77_163_255/0.2)]"
                : "border border-border-glass bg-bg-elevated/60 text-text-secondary hover:border-white/20 hover:bg-white/5",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
