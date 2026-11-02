import Link from "next/link";

interface ArchetypeBadgeProps {
  archetypeKey: string;
  name: string;
  tagline?: string;
  linked?: boolean;
  className?: string;
}

/**
 * Swiss Ink archetype label: a square ink-ruled tag, name in ink, tagline in
 * grey. No pill, no blur.
 */
export function ArchetypeBadge({
  archetypeKey,
  name,
  tagline,
  linked = false,
  className = "",
}: ArchetypeBadgeProps) {
  const content = (
    <span
      className={`inline-flex items-baseline gap-3 border border-ink px-3 py-1.5 group-hover:bg-ink ${className}`}
    >
      <span className="text-sm font-semibold tracking-[-0.01em] text-ink group-hover:text-paper">{name}</span>
      {tagline && (
        <span className="hidden text-sm text-[#8c8a84] group-hover:text-[#bdbab2] sm:inline">{tagline}</span>
      )}
    </span>
  );

  if (linked) {
    return (
      <Link
        href={`/entrepreneurs/archetype/${archetypeKey}`}
        className="group inline-block focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink"
      >
        {content}
      </Link>
    );
  }

  return content;
}
