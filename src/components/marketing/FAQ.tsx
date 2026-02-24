"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

const faqs = [
  {
    question: "How long does the assessment take?",
    answer:
      "The full assessment takes approximately 20 minutes. It includes watching AI-narrated entrepreneur vignettes, recording your responses, and completing a personality quiz.",
  },
  {
    question: "Can I retake the assessment?",
    answer:
      "No. The assessment is designed to capture your authentic first reactions. Each participant gets one attempt to ensure the integrity of the results.",
  },
  {
    question: "Do I need to prepare anything?",
    answer:
      "No preparation is needed\u2014the assessment measures how you naturally think. Just make sure you have a working camera and microphone, a quiet space, and about 20 minutes of uninterrupted time.",
  },
  {
    question: "How is my response scored?",
    answer:
      "Your video responses are analyzed using AI trained on data from 274 real entrepreneurs. The system identifies reasoning patterns and scores them across categories of practical and creative intelligence. The personality quiz is scored against established entrepreneurial trait benchmarks.",
  },
  {
    question: "Is my data kept private?",
    answer:
      "Yes. Your video recordings and assessment data are processed securely and used solely for generating your profile. Data is stored in compliance with university privacy policies and is never shared with third parties.",
  },
  {
    question: "What devices are supported?",
    answer:
      "The assessment works best on a laptop or desktop computer with Chrome, Firefox, or Safari. A stable internet connection is required for video recording and submission.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="text-center text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
            Questions
          </p>
          <h2 className="mt-4 text-center font-display text-[length:var(--text-fluid-3xl)] font-bold tracking-[-0.01em] text-text-primary">
            Frequently asked
          </h2>
        </ScrollReveal>

        <div className="mt-16 space-y-2">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div className="rounded-xl border border-border-glass">
                <button
                  id={`faq-trigger-${i}`}
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base rounded-xl"
                  onClick={() => toggle(i)}
                  aria-expanded={openIndex === i}
                  aria-controls={`faq-panel-${i}`}
                >
                  <span className="font-display text-[length:var(--text-fluid-base)] font-medium text-text-primary">
                    {faq.question}
                  </span>
                  {prefersReducedMotion ? (
                    <span
                      className="shrink-0 text-text-secondary"
                      aria-hidden="true"
                      style={{ transform: openIndex === i ? "rotate(45deg)" : undefined }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                  ) : (
                    <motion.span
                      animate={{ rotate: openIndex === i ? 45 : 0 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="shrink-0 text-text-secondary"
                      aria-hidden="true"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </motion.span>
                  )}
                </button>
                {prefersReducedMotion ? (
                  openIndex === i && (
                    <div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${i}`}
                    >
                      <p className="px-6 pb-5 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                        {faq.answer}
                      </p>
                    </div>
                  )
                ) : (
                  <AnimatePresence initial={false}>
                    {openIndex === i && (
                      <motion.div
                        id={`faq-panel-${i}`}
                        role="region"
                        aria-labelledby={`faq-trigger-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export { FAQ };
