import { ScrollReveal } from "@/components/ui/scroll-reveal";

function Credibility() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {/* Navy-tinted background band */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgb(31_48_62/0.3),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <ScrollReveal>
          <h2 className="font-display text-[length:var(--text-fluid-5xl)] font-bold tabular-nums text-secondary">
            274
          </h2>
          <p className="mt-2 text-[length:var(--text-fluid-lg)] font-medium text-text-primary" aria-hidden="true">
            real entrepreneurs analyzed
          </p>
          <span className="sr-only">274 real entrepreneurs analyzed</span>
          <p className="mx-auto mt-6 max-w-lg text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
            Our assessment is grounded in real-world data. We studied how
            hundreds of successful entrepreneurs actually think\u2014their
            reasoning patterns, creative strategies, and decision-making
            frameworks\u2014to build a scientifically rigorous measure of
            entrepreneurial intelligence.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

export { Credibility };
