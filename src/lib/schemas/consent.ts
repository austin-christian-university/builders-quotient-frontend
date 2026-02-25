import { z } from "zod";

export const consentTypes = [
  "terms_privacy",
  "video_recording",
  "biometric",
] as const;

export type ConsentType = (typeof consentTypes)[number];

/** Version string for the current consent text — bump when consent language changes. */
export const CONSENT_VERSION = "2026-02-25-v1";

export const consentDataSchema = z.object({
  termsPrivacy: z.literal(true),
  videoRecording: z.literal(true),
  biometric: z.literal(true),
  /** Must match the current CONSENT_VERSION — rejects stale consent payloads. */
  consentVersion: z.literal(CONSENT_VERSION),
  consentedAt: z.string().datetime(),
});

export type ConsentData = z.infer<typeof consentDataSchema>;
