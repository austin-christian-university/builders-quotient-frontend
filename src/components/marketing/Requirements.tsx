import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const requirements = [
  {
    title: "Camera & Microphone",
    description:
      "You\u2019ll record short video responses. Make sure your browser can access both.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M23 7l-7 5 7 5V7z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    title: "~20 Minutes",
    description:
      "Set aside uninterrupted time. You can\u2019t pause and resume the assessment.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Quiet Space",
    description:
      "Find a distraction-free environment. Background noise can affect recording quality.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
];

function Requirements() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <p className="text-center text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
            Before You Start
          </p>
          <h2 className="mt-4 text-center font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-[-0.01em] text-text-primary">
            What you need
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {requirements.map((req, i) => (
            <ScrollReveal key={req.title} delay={i * 0.1}>
              <Card className="flex h-full flex-col items-center p-6 text-center">
                <CardContent className="flex flex-1 flex-col items-center gap-4 p-0">
                  <span className="text-primary">{req.icon}</span>
                  <h3 className="font-display text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
                    {req.title}
                  </h3>
                  <p className="text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                    {req.description}
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export { Requirements };
