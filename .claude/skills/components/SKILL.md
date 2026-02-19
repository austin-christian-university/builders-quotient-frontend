---
name: components
description: React component patterns. Use when creating or modifying components, handling client/server boundaries, or working with styling.
user-invocable: false
---

# Component Patterns

## Organization

```
components/
├── ui/           # Base primitives (button, input, card, badge)
├── forms/        # Form components (text-field, select, radio-group)
├── layout/       # Header, footer, nav, assessment-shell
├── assessment/   # Assessment flow components (vignette-card, quiz-item, progress-bar)
└── marketing/    # Landing page sections
```

## Naming

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Exports: Named exports preferred

## Server vs Client

**Default to Server Components.** Only add `"use client"` when you need:
- useState, useEffect, useContext
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)

```tsx
// Server Component (default)
export function Card({ data }) {
  return <div>{data.title}</div>
}

// Client Component
"use client"
export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

## Composition

Keep Server Components at top, Client as islands:

```tsx
// page.tsx (Server)
export default async function Page() {
  const data = await fetchData()
  return (
    <div>
      <StaticHeader data={data} />
      <InteractiveWidget />  {/* Client island */}
    </div>
  )
}
```

## Styling

Use `cn` utility for conditional Tailwind:

```tsx
import { cn } from "@/lib/utils"

export function Button({ variant, className, ...props }) {
  return (
    <button
      className={cn(
        "rounded-full px-6 py-3 font-medium transition-all",
        variant === "primary" && "bg-accent text-white shadow-[0_12px_30px_rgba(77,163,255,0.35)]",
        variant === "ghost" && "border border-border/70 hover:border-accent/70",
        className
      )}
      {...props}
    />
  )
}
```

## Accessibility

- MUST: Icon-only buttons need `aria-label`
- MUST: Visible focus states (`:focus-visible`) using accent blue ring
- MUST: Use semantic elements (`button`, `a`, not `div`)
