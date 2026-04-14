interface StatCardProps {
  value: string;
  label: string;
  sublabel?: string;
}

export function StatCard({ value, label, sublabel }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border-glass bg-white/[0.03] px-6 py-5 backdrop-blur-md">
      <p
        className="text-2xl font-bold text-text-primary"
        style={{
          fontFamily: "'Inter Tight', Inter, sans-serif",
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-text-secondary">{label}</p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-text-secondary/60">{sublabel}</p>
      )}
    </div>
  );
}
