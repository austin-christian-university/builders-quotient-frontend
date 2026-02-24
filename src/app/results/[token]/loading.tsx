export default function ResultsLoading() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 animate-glow-pulse" />
        <p className="font-display text-lg tracking-tight text-text-secondary animate-fade-in">
          Preparing your results&hellip;
        </p>
      </div>
    </main>
  );
}
