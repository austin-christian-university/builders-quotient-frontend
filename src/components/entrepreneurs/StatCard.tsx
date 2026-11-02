interface StatCardProps {
  value: string;
  label: string;
  sublabel?: string;
}

/**
 * One stat as a big numeral sitting on an ink rule (Swiss Ink "The data" pattern).
 * Stack several inside a container with `border-t border-ink` to get the ruled list.
 */
export function StatCard({ value, label, sublabel }: StatCardProps) {
  return (
    <div className="grid grid-cols-1 items-end gap-x-6 border-b border-ink pt-5 pb-[18px] md:grid-cols-12">
      <p className="min-w-0 break-words text-[clamp(40px,7.5vw,96px)] font-semibold leading-[0.88] tracking-[-0.055em] tabular-nums md:col-span-8">
        {value}
      </p>
      <div className="mt-3 md:col-span-4 md:mt-0 md:pb-1.5">
        <p className="text-[17px] font-medium leading-snug">{label}</p>
        {sublabel && <p className="mt-1 text-sm text-text-secondary">{sublabel}</p>}
      </div>
    </div>
  );
}
