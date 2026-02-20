import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const domains = [
  {
    title: "Practical Intelligence",
    description:
      "How you navigate real business situations\u2014diagnosing problems, choosing strategies, and taking action.",
    categories: [
      "Diagnosing",
      "Reasoning",
      "Action",
      "People",
      "Meta-Reasoning",
    ],
  },
  {
    title: "Creative Intelligence",
    description:
      "How you generate novel solutions\u2014observing patterns, reframing problems, and communicating ideas.",
    categories: [
      "Observing",
      "Reframing",
      "Articulating",
      "Evaluating",
      "Communicating",
    ],
  },
];

function WhatYouDiscover() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <p className="text-center text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
            What You Discover
          </p>
          <h2 className="mt-4 text-center font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-[-0.01em] text-text-primary">
            Two dimensions of entrepreneurial thinking
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {domains.map((domain, i) => (
            <ScrollReveal key={domain.title} delay={i * 0.15}>
              <Card className="h-full">
                <CardHeader>
                  <h3 className="font-display text-[length:var(--text-fluid-xl)] font-semibold text-text-primary">
                    {domain.title}
                  </h3>
                  <p className="mt-2 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                    {domain.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-2">
                    {domain.categories.map((cat) => (
                      <li
                        key={cat}
                        className="rounded-full border border-secondary/20 bg-secondary/5 px-3 py-1 text-[length:var(--text-fluid-xs)] font-medium text-secondary"
                      >
                        {cat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export { WhatYouDiscover };
