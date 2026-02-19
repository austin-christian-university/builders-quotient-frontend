---
name: types
description: Zod schema and type validation patterns. Use when defining types, validating data, or working with schemas.
user-invocable: false
---

# Type Validation with Zod

## Schema Organization

```
lib/schemas/
├── applicant.ts        # Applicant and intake schemas
├── assessment.ts       # Session, response, scoring schemas
├── personality.ts      # Personality item, response, score schemas
├── vignette.ts         # PI and CI vignette schemas
└── index.ts            # Re-exports
```

## Basic Schema

```tsx
import { z } from "zod"

export const ApplicantSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  displayName: z.string().optional(),
  createdAt: z.coerce.date(),
})

export type Applicant = z.infer<typeof ApplicantSchema>
```

## Form Schemas

Separate create/update schemas:

```tsx
export const CreateApplicantSchema = ApplicantSchema.omit({ id: true, createdAt: true })
export const IntakeFormSchema = CreateApplicantSchema.extend({
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required" }) }),
})

export type IntakeFormInput = z.infer<typeof IntakeFormSchema>
```

## Assessment-Specific Types

```tsx
// Personality
export const LikertValueSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
export type LikertValue = z.infer<typeof LikertValueSchema>

export const PersonalityFacetSchema = z.enum(['AM', 'RT', 'IN', 'AU', 'SE', 'ST', 'IL', 'GR', 'AC'])
export type PersonalityFacet = z.infer<typeof PersonalityFacetSchema>

// Reasoning moves (PI: 26 binary moves, CI: 24 binary moves)
export const ReasoningMovesSchema = z.record(z.string(), z.boolean())
export type ReasoningMoves = z.infer<typeof ReasoningMovesSchema>
```

## Server Action Usage

```tsx
"use server"

import { IntakeFormSchema } from "@/lib/schemas/applicant"

export async function submitIntake(formData: FormData) {
  const result = IntakeFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    consent: formData.get("consent") === "true",
  })

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors }
  }

  await supabase.from("applicants").insert(result.data)
}
```

## Coercion for Form Data

Form data is always strings. Use coercion:

```tsx
const FormSchema = z.object({
  count: z.coerce.number().min(1),
  date: z.coerce.date(),
  active: z.coerce.boolean(),
})
```
