import Link from "next/link";

interface EntrepreneurCardProps {
  id: string;
  name: string;
  industries: string[] | null;
  archetypeName?: string;
}

export function EntrepreneurCard({
  id,
  name,
  industries,
  archetypeName,
}: EntrepreneurCardProps) {
  return (
    <Link
      href={`/entrepreneurs/${id}`}
      className="group rounded-2xl border border-border-glass bg-bg-elevated p-5 transition-all duration-300 ease-[var(--ease-out-expo)] hover:bg-bg-surface hover:border-white/20 hover:shadow-[0_0_24px_rgb(77_163_255/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
    >
      <p
        className="text-base font-semibold text-text-primary group-hover:text-white transition-colors"
        style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
      >
        {name}
      </p>
      {archetypeName && (
        <p className="mt-1 text-xs text-primary/80">{archetypeName}</p>
      )}
      {industries && industries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {industries.slice(0, 4).map((industry) => (
            <span
              key={industry}
              className="rounded-sm bg-white/5 px-2 py-0.5 text-xs text-text-secondary"
            >
              {industry}
            </span>
          ))}
          {industries.length > 4 && (
            <span className="px-1 py-0.5 text-xs text-text-secondary/50">
              +{industries.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
