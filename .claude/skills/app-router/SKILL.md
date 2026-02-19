---
name: app-router
description: Next.js App Router patterns. Use when working with pages, layouts, routing, data fetching, or any files in the app/ directory.
user-invocable: false
---

# App Router Patterns

## File Conventions

| File | Purpose |
|------|---------|
| `page.tsx` | Route UI (Server Component by default) |
| `layout.tsx` | Shared wrapper (persists across nav) |
| `loading.tsx` | Suspense fallback |
| `error.tsx` | Error boundary |
| `not-found.tsx` | 404 UI |
| `route.ts` | API endpoint |

## Route Groups

Use `(groupname)/` for shared layouts without URL impact:

```
app/
├── (marketing)/            # Public pages, no auth
│   ├── layout.tsx          # Marketing layout (header/footer)
│   └── page.tsx            # Landing page
├── (assessment)/           # Assessment flow
│   ├── layout.tsx          # Assessment session provider
│   ├── start/page.tsx      # Intake form
│   ├── intelligence/       # PI + CI sections
│   └── personality/        # Personality quiz
└── api/                    # Route handlers
```

## Data Fetching

**Server Components are default. Fetch directly:**

```tsx
export default async function Page() {
  const data = await fetchData()
  return <Component data={data} />
}
```

**Use Suspense for streaming:**

```tsx
export default async function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SlowSection />
    </Suspense>
  )
}
```

## Route Protection

Protect in layout.tsx:

```tsx
export default async function Layout({ children }) {
  const user = await getUser()
  if (!user) redirect("/login")
  return <>{children}</>
}
```

## Anti-patterns

- DON'T use useEffect for data fetching
- DON'T use Pages Router patterns (getServerSideProps, pages/)
- DON'T use useRouter from 'next/router' (use 'next/navigation')
