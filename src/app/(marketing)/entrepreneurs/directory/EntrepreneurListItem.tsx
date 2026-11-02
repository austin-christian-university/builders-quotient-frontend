import Link from "next/link";

interface EntrepreneurListItemProps {
  id: string;
  name: string;
  archetypeName: string;
  archetypeTagline: string;
  industries: string[] | null;
}

/**
 * Directory index row: name / archetype + tagline / industries / arrow, ruled
 * below. Collapses to stacked text at phone width.
 */
export function EntrepreneurListItem({
  id,
  name,
  archetypeName,
  archetypeTagline,
  industries,
}: EntrepreneurListItemProps) {
  const tags = industries && industries.length > 0 ? industries.slice(0, 3) : [];
  const extra = industries && industries.length > 3 ? industries.length - 3 : 0;

  return (
    <Link
      href={`/entrepreneurs/${id}`}
      className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-border py-4 hover:bg-ink/[0.03] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink md:grid-cols-[minmax(0,4fr)_minmax(0,4fr)_minmax(0,3fr)_auto] md:gap-x-6"
    >
      <span className="min-w-0 text-lg font-semibold leading-tight tracking-[-0.02em] text-ink">
        {name}
      </span>
      <span className="col-start-1 row-start-2 min-w-0 text-sm md:col-start-2 md:row-start-1">
        <span className="text-ink">{archetypeName}</span>
        <span className="text-[#8c8a84]"> — {archetypeTagline}</span>
      </span>
      {tags.length > 0 ? (
        <span className="col-start-1 row-start-3 min-w-0 text-sm text-text-secondary md:col-start-3 md:row-start-1">
          {tags.join(", ")}
          {extra > 0 && <span className="text-[#8c8a84]"> +{extra}</span>}
        </span>
      ) : (
        <span className="hidden md:block" aria-hidden="true" />
      )}
      <span
        className="col-start-2 row-start-1 text-ink transition-transform group-hover:translate-x-1 group-hover:text-vermilion md:col-start-4"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}
