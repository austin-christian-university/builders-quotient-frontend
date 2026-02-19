---
name: data-fetching
description: Data fetching and caching patterns. Use when fetching data, implementing caching strategies, or organizing queries.
user-invocable: false
---

# Data Fetching Patterns

## Server Component Fetching

```tsx
// page.tsx - fetch directly, no useEffect
export default async function Page() {
  const data = await fetchData()
  return <Component data={data} />
}
```

## Suspense Streaming

Each Suspense boundary streams independently:

```tsx
export default async function Page() {
  return (
    <>
      <Suspense fallback={<VignetteSkeleton />}>
        <VignetteSection />
      </Suspense>
      <Suspense fallback={<ProgressSkeleton />}>
        <ProgressTracker />
      </Suspense>
    </>
  )
}

async function VignetteSection() {
  const vignettes = await getAssignedVignettes(sessionId)
  return <VignetteList data={vignettes} />
}
```

## Query Organization

```
lib/queries/
├── applicants.ts
├── assessment.ts
├── vignettes.ts
└── personality.ts
```

```tsx
// lib/queries/vignettes.ts
import { createClient } from "@/lib/supabase/server"

export async function getAssignedVignettes(sessionId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("assessment_sessions")
    .select("*, pi_vignettes(*), ci_vignettes(*)")
    .eq("id", sessionId)
    .single()
  return data
}
```

## Parallel Data Fetching

```tsx
// Fetch in parallel, not waterfall
export default async function Page({ params }) {
  const [session, vignettes, personality] = await Promise.all([
    getSession(params.id),
    getVignettes(params.id),
    getPersonalityItems(),
  ])
  return <Assessment session={session} vignettes={vignettes} personality={personality} />
}
```

## Anti-patterns

```tsx
// DON'T: useEffect waterfall
"use client"
useEffect(() => { fetch(...).then(setData) }, [])

// DO: Server Component
export default async function Page() {
  const data = await fetch(...)
  return <Component data={data} />
}
```
