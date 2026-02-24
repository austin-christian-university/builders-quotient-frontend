import { z } from "zod";

export const leadTypes = ["prospective_student", "general_interest"] as const;
export type LeadType = (typeof leadTypes)[number];

/**
 * Strip non-digits from a US phone string and return E.164 format (+1XXXXXXXXXX).
 * Returns `null` if the input doesn't resolve to a valid 10-digit US number.
 */
export function normalizeUSPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/** Validates the email-gate form (captures email after assessment). */
export const emailCaptureSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  firstName: z
    .string()
    .trim()
    .max(100, "Name is too long")
    .transform((v) => v || undefined)
    .optional(),
  phone: z
    .string()
    .min(1, "Please enter your phone number")
    .transform((v) => normalizeUSPhone(v))
    .refine((v): v is string => v !== null, {
      message: "Please enter a valid 10-digit US phone number",
    }),
  leadType: z.enum(leadTypes, {
    message: "Please select what best describes you",
  }),
});

export type EmailCaptureInput = z.infer<typeof emailCaptureSchema>;
