---
name: forms
description: Form handling patterns with Server Actions. Use when building forms, handling validation, managing form state, or working with useActionState.
user-invocable: false
---

# Form Handling Patterns

## Basic Server Action Form

```tsx
// Server Component
import { createApplicant } from "@/lib/actions/applicant-actions"

export default function IntakePage({ user }) {
  return (
    <form action={createApplicant}>
      <input name="firstName" />
      <input name="email" type="email" />
      <button type="submit">Continue</button>
    </form>
  )
}
```

## With useActionState (React 19)

```tsx
"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending}>
      {pending ? "Saving..." : "Continue"}
    </button>
  )
}

export function IntakeForm() {
  const [state, formAction] = useActionState(submitIntake, { success: false })

  return (
    <form action={formAction}>
      <input name="firstName" aria-describedby="firstName-error" />
      {state.fieldErrors?.firstName && (
        <p id="firstName-error" className="text-red-400 text-sm">
          {state.fieldErrors.firstName[0]}
        </p>
      )}
      <SubmitButton />
    </form>
  )
}
```

## Input Attributes

```tsx
// Email
<input type="email" inputMode="email" autoComplete="email" spellCheck={false} />

// Phone
<input type="tel" inputMode="tel" autoComplete="tel" />

// Name
<input type="text" autoComplete="given-name" />
```

## Accessibility Rules

- MUST: Use `<label>` with `htmlFor` matching input `id`
- MUST: Use `aria-describedby` to link errors to inputs
- MUST: Keep submit enabled until request starts
- MUST: Show spinner + original label during loading
- MUST: Focus first error field on validation failure
- NEVER: Block paste in inputs
- MUST: Warn on unsaved changes before navigation

## Anti-patterns

```tsx
// DON'T disable submit until "valid"
<button disabled={!isValid}>Submit</button>

// DO keep enabled, validate on submit
<button type="submit">Submit</button>

// DON'T block typing
onChange={(e) => { if (isValid(e.target.value)) setValue(...) }}

// DO accept input, validate after
onChange={(e) => setValue(e.target.value)}
onBlur={() => validate()}
```
