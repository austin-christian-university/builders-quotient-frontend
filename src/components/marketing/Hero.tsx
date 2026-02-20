import Link from "next/link";
import { Button } from "@/components/ui/button";

function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6">
      {/* Layered background gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-bg-base" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgb(77_163_255/0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgb(233_185_73/0.06),transparent)]" />
        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgb(255 255 255) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p
          className="animate-fade-up text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary"
          style={{ animationDelay: "0ms" }}
        >
          Austin Christian University
        </p>

        <h1
          className="animate-fade-up mt-6 font-display text-[length:var(--text-fluid-4xl)] font-bold leading-[1.1] tracking-[-0.01em] text-text-primary"
          style={{ animationDelay: "100ms" }}
        >
          Discover how you think like an&nbsp;entrepreneur
        </h1>

        <p
          className="animate-fade-up mx-auto mt-6 max-w-xl text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary"
          style={{ animationDelay: "200ms" }}
        >
          A psychometric assessment that maps your practical intelligence,
          creative reasoning, and&nbsp;entrepreneurial personality.
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-col items-center gap-4"
          style={{ animationDelay: "300ms" }}
        >
          <Button as={Link} href="/assess/setup" size="lg">
            Begin Assessment
          </Button>
          <p className="text-[length:var(--text-fluid-xs)] text-text-secondary">
            ~20&nbsp;min &middot; Camera required &middot; No&nbsp;retakes
          </p>
        </div>
      </div>
    </section>
  );
}

export { Hero };
