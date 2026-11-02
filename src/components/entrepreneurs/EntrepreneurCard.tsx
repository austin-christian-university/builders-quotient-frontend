import Link from "next/link";

interface EntrepreneurCardProps {
  id: string;
  name: string;
  industries: string[] | null;
  archetypeName?: string;
}

/**
 * One row of a Swiss Ink typographic index: name, optional archetype, industry
 * tags as plain grey text, hairline rule below. Render inside a list whose
 * container carries the top ink rule.
 */
export function EntrepreneurCard({
  id,
  name,
  industries,
  archetypeName,
}: EntrepreneurCardProps) {
  const tags = industries && industries.length > 0 ? industries.slice(0, 4) : [];
  const extra = industries && industries.length > 4 ? industries.length - 4 : 0;

  return (
    <Link
      href={`/entrepreneurs/${id}`}
      className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-border py-4 hover:bg-ink/[0.03] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto]"
    >
      <span className="min-w-0 text-lg font-semibold leading-tight tracking-[-0.02em] text-ink">
        {name}
        {archetypeName && (
          <span className="ml-2 text-sm font-normal tracking-normal text-[#8c8a84]">{archetypeName}</span>
        )}
      </span>
      <span
        className="col-start-1 row-start-2 min-w-0 text-sm text-text-secondary md:col-start-2 md:row-start-1"
      >
        {tags.join(", ")}
        {extra > 0 && <span className="text-[#8c8a84]"> +{extra}</span>}
      </span>
      <span
        className="col-start-2 row-start-1 text-ink transition-transform group-hover:translate-x-1 group-hover:text-vermilion md:col-start-3"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}
