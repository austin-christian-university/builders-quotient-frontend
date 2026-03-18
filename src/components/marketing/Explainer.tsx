import Link from "next/link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "274", label: "entrepreneurs studied" },
  { value: "350,000+", label: "videos evaluated" },
  { value: "5,000+", label: "real decisions extracted" },
];

const outcomes = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    text: "Your entrepreneurial archetype",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    text: "How you reason through real business problems",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    text: "Your creative problem-solving style",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    text: "Your communication style",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    text: "Which real entrepreneurs think most like you",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="12" y1="16" x2="12" y2="8" />
      </svg>
    ),
    text: "Shareable profile cards",
  },
];

function Explainer() {
  return (
    <section id="explainer" className="scroll-mt-8 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Part A: Elevator Pitch */}
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
              About the Assessment
            </p>
            <h2 className="mt-4 font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-[-0.01em] text-text-primary">
              A new kind of exam
            </h2>
            <p className="mt-6 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
              The Builders Quotient is a psychometric assessment created by
              Austin Christian University. Think of it like a personality
              test&nbsp;&mdash; but instead of answering multiple choice
              questions, you watch real business scenarios and explain what
              you&rsquo;d do on camera.
            </p>
            <p className="mt-4 text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
              Our AI compares your reasoning to how hundreds of the
              world&rsquo;s most successful entrepreneurs actually responded to
              similar situations. It measures how you solve problems, think
              creatively, and communicate.
            </p>
          </div>
        </ScrollReveal>

        {/* Part B: Stats */}
        <div className="mt-20 rounded-2xl border border-border-glass bg-bg-elevated/40 px-6 py-10 backdrop-blur-sm md:px-10 md:py-12">
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.12}>
                <div className="text-center">
                  <p className="font-display text-[length:var(--text-fluid-5xl)] font-bold tabular-nums text-secondary">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[length:var(--text-fluid-sm)] font-medium text-text-primary">
                    {stat.label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={0.4}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
              We analyzed hundreds of thousands of videos to find the
              highest-quality entrepreneurial decision-making moments&nbsp;&mdash;
              and distilled them into a rigorous scoring framework.
            </p>
          </ScrollReveal>
        </div>

        {/* Part C: What You Get */}
        <div className="mt-24">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
                Your Results
              </p>
              <h3 className="mt-4 font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em] text-text-primary">
                Your entrepreneurial DNA, decoded
              </h3>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-12 max-w-xl space-y-5">
            {outcomes.map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 text-primary">
                    {item.icon}
                  </span>
                  <p className="text-[length:var(--text-fluid-base)] text-text-primary">
                    {item.text}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.5}>
            <p className="mx-auto mt-10 max-w-2xl text-center text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
              Custom-built algorithms score your responses across
              40,000&nbsp;unique dimension combinations and match you
              against our entire entrepreneur database.
            </p>
          </ScrollReveal>
        </div>

        {/* Part D: Example Link */}
        <ScrollReveal delay={0.6}>
          <div className="mt-12 text-center">
            <Button as={Link} href="/results/test-jordan-maker" variant="outline" size="md">
              See what a result looks like
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export { Explainer };
