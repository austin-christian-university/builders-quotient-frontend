import Link from "next/link";

interface EntrepreneurListItemProps {
  id: string;
  name: string;
  archetypeName: string;
  archetypeTagline: string;
  industries: string[] | null;
}

export function EntrepreneurListItem({
  id,
  name,
  archetypeName,
  archetypeTagline,
  industries,
}: EntrepreneurListItemProps) {
  return (
    <Link
      href={`/entrepreneurs/${id}`}
      className="group flex items-center gap-4 rounded-xl border border-border-glass bg-bg-elevated px-5 py-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-bg-surface hover:border-white/20 hover:shadow-[0_0_24px_rgb(77_163_255/0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
    >
      {/* Name + archetype */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="text-base font-semibold text-text-primary group-hover:text-white transition-colors"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            {name}
          </span>
          <span className="text-sm text-primary/80">{archetypeName}</span>
        </div>
        <p className="mt-0.5 text-xs text-text-secondary/60 italic truncate">
          {archetypeTagline}
        </p>
      </div>

      {/* Industry tags */}
      {industries && industries.length > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {industries.slice(0, 3).map((industry) => (
            <span
              key={industry}
              className="rounded-sm bg-white/5 px-2 py-0.5 text-xs text-text-secondary"
            >
              {industry}
            </span>
          ))}
          {industries.length > 3 && (
            <span className="px-1 py-0.5 text-xs text-text-secondary/50">
              +{industries.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Arrow */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-text-secondary/30 group-hover:text-primary/60 transition-colors"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
