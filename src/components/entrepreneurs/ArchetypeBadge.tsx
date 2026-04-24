import Link from "next/link";

interface ArchetypeBadgeProps {
  archetypeKey: string;
  name: string;
  tagline?: string;
  linked?: boolean;
  className?: string;
}

export function ArchetypeBadge({
  archetypeKey,
  name,
  tagline,
  linked = false,
  className = "",
}: ArchetypeBadgeProps) {
  const content = (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border-glass bg-white/5 px-4 py-1.5 backdrop-blur-sm ${className}`}
    >
      <span
        className="text-sm font-semibold text-text-primary"
        style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
      >
        {name}
      </span>
      {tagline && (
        <span className="text-xs text-text-secondary hidden sm:inline">
          {tagline}
        </span>
      )}
    </span>
  );

  if (linked) {
    return (
      <Link
        href={`/entrepreneurs/archetype/${archetypeKey}`}
        className="transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base rounded-full"
      >
        {content}
      </Link>
    );
  }

  return content;
}
