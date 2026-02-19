---
name: database
description: Supabase database and client patterns. Use when working with Supabase queries, auth, storage, or the Supabase client.
user-invocable: false
---

# Supabase Patterns

## Server Client Setup

```tsx
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

## Browser Client Setup

```tsx
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Key Tables (Shared with triarchic-databank)

| Table | Purpose |
|-------|---------|
| `applicants` | Test-takers (external_id, email, display_name, fingerprint_hash) |
| `assessment_sessions` | One sitting per applicant; tracks assigned vignettes and status |
| `student_responses` | Free-text responses with detected reasoning moves and scores |
| `personality_responses` | Per-item Likert responses (raw + scored values) |
| `personality_scores` | Per-facet computed scores |
| `pi_vignettes` | Practical intelligence assessment items |
| `ci_vignettes` | Creative intelligence assessment items |
| `critical_incidents` | PI incidents from entrepreneur interviews (read-only from frontend) |
| `creative_episodes` | CI episodes from entrepreneur interviews (read-only from frontend) |

## Query Patterns

```tsx
const supabase = await createClient()

// Select with relations
const { data } = await supabase
  .from("assessment_sessions")
  .select("*, applicants(*)")
  .eq("id", sessionId)
  .single()

// Insert response
const { data, error } = await supabase
  .from("student_responses")
  .insert({ session_id, vignette_id, response_text, reasoning_moves })
  .select()
  .single()

// Upsert applicant (dedup by fingerprint)
const { data } = await supabase
  .from("applicants")
  .upsert({ fingerprint_hash, email, display_name })
  .select()
  .single()
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## RLS (Row Level Security)

Always use the anon key with RLS policies. Never expose service_role key to client. The triarchic-databank pipeline uses service_role for write operations; this frontend uses anon key with appropriate RLS policies.
