---
name: server-actions
description: Server Actions patterns for mutations. Use when creating form handlers, database mutations, or any "use server" functions.
user-invocable: false
---

# Server Actions Patterns

## File Organization

```
lib/actions/
├── assessment-actions.ts    # Assessment session, responses
├── applicant-actions.ts     # Applicant creation, intake
└── auth-actions.ts          # Auth flows
```

## Basic Pattern

```tsx
// lib/actions/applicant-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
})

export async function createApplicant(formData: FormData) {
  const validated = schema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
  })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("applicants")
    .insert(validated)
    .select()
    .single()

  if (error) throw error
  revalidatePath("/assessment")
  return data
}
```

## Return Type for Forms

```tsx
type ActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function submitIntake(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = schema.safeParse({...})

  if (!result.success) {
    return {
      success: false,
      fieldErrors: result.error.flatten().fieldErrors,
    }
  }

  try {
    await supabase.from("applicants").insert(result.data)
    return { success: true }
  } catch {
    return { success: false, error: "Failed to create" }
  }
}
```

## Rules

- MUST: Add `"use server"` at top of file
- MUST: Validate all input with Zod
- MUST: Revalidate affected paths after mutations
- NEVER: Trust client input without validation
