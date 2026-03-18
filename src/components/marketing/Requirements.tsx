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
              <Card className="group relative flex h-full flex-col items-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-xl transition-all duration-500 hover:bg-white/[0.04] hover:-translate-y-2 hover:shadow-[0_20px_40px_-20px_rgba(255,255,255,0.15)] hover:border-white/20">
                {/* Spotlight glow effect on hover */}
                <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                <CardContent className="relative z-10 flex flex-1 flex-col items-center gap-5 p-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-110">
                    {req.icon}
                  </div>
                  <h3 className="font-display text-[length:var(--text-fluid-xl)] font-semibold text-text-primary tracking-tight">
                    {req.title}
                  </h3>
                  <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary/80">
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
