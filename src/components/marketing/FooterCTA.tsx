import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

function FooterCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {/* Radial glow behind CTA */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgb(77_163_255/0.1),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <ScrollReveal>
          <h2 className="font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-[-0.01em] text-text-primary">
            Ready to find out how you&nbsp;think?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
            Take the Builders Quotient assessment and discover your
            entrepreneurial&nbsp;intelligence&nbsp;profile.
          </p>
          <div className="mt-10">
            <Button as={Link} href="/assess/overview" size="lg">
              Begin Assessment
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export { FooterCTA };
