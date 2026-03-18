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
          <h2 className="font-display text-[length:var(--text-fluid-4xl)] font-bold tracking-tight text-text-primary bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-500 pb-1">
            Ready to find out how you&nbsp;think?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[length:var(--text-fluid-lg)] leading-relaxed text-text-secondary/90 font-light">
            Take the Builders Quotient assessment and discover your
            entrepreneurial&nbsp;intelligence&nbsp;profile.
          </p>
          <div className="mt-12 group relative inline-flex items-center justify-center">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-glow-pulse" />
            <Button 
              as={Link} 
              href="/assess/overview" 
              size="lg"
              className="relative rounded-full border border-white/10 bg-white/5 px-12 py-8 text-lg font-medium tracking-widest uppercase text-text-primary backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
              Begin Assessment
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export { FooterCTA };
