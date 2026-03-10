"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PersonalityLikert } from "./PersonalityLikert";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type {
  PersonalityItem,
  LikertValue,
} from "@/lib/assessment/personality-bank";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const noMotion = {
  hidden: {},
  visible: {},
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const noStagger = {
  visible: {},
};

const transition = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1] as const,
};

type PersonalityQuizPageProps = {
  items: PersonalityItem[];
  responses: Record<string, LikertValue>;
  onResponse: (itemId: string, value: LikertValue) => void;
  pageOffset: number;
};

export function PersonalityQuizPage({
  items,
  responses,
  onResponse,
  pageOffset,
}: PersonalityQuizPageProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // The card that number keys will apply to
  const activeIndex = items.findIndex((item) => !responses[item.id]);
  const resolvedActiveIndex = activeIndex === -1 ? items.length - 1 : activeIndex;

  // Keep refs in sync so the keydown listener always reads the latest values
  const itemsRef = useRef(items);
  const responsesRef = useRef(responses);
  const onResponseRef = useRef(onResponse);
  useEffect(() => {
    itemsRef.current = items;
    responsesRef.current = responses;
    onResponseRef.current = onResponse;
  });

  // Global number key handler — works regardless of focus position
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Ignore modified key combos (Cmd+1, Ctrl+1, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const num = parseInt(e.key, 10);
      if (!(num >= 1 && num <= 5)) return;

      const container = containerRef.current;
      if (!container) return;

      const currentItems = itemsRef.current;
      const currentResponses = responsesRef.current;

      // Always target the first unanswered question (or last if all answered).
      // This keeps the "quick answers" flow advancing through the page
      // regardless of which radiogroup currently has focus.
      let targetIndex = currentItems.findIndex((item) => !currentResponses[item.id]);
      if (targetIndex === -1) targetIndex = currentItems.length - 1;

      const item = currentItems[targetIndex];
      if (!item) return;

      onResponseRef.current(item.id, num as LikertValue);

      // Scroll the next unanswered card into view (keyboard UX only)
      const nextResponses = { ...currentResponses, [item.id]: num as LikertValue };
      const nextActiveIdx = currentItems.findIndex((it) => !nextResponses[it.id]);
      if (nextActiveIdx !== -1) {
        (container.children[nextActiveIdx] as HTMLElement)?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      } else {
        // All answered — scroll last card's bottom into view to reveal the nav buttons
        (container.children[container.children.length - 1] as HTMLElement)?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="flex flex-col gap-4"
      initial="hidden"
      animate="visible"
      variants={prefersReducedMotion ? noStagger : stagger}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          variants={prefersReducedMotion ? noMotion : fadeUp}
          transition={prefersReducedMotion ? { duration: 0 } : transition}
          className={cn(
            "rounded-2xl border p-5 backdrop-blur-xl transition-shadow duration-300 ease-[var(--ease-out-expo)] sm:p-6",
            i === resolvedActiveIndex
              ? "border-primary/30 bg-bg-elevated/60 shadow-[0_0_24px_rgb(77_163_255/0.08)]"
              : "border-border-glass bg-bg-elevated/60"
          )}
        >
          <p
            id={`likert-label-${item.id}`}
            className="mb-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary"
          >
            <span className="mr-2 tabular-nums text-text-secondary">
              {pageOffset + i + 1}.
            </span>
            {item.text}
          </p>
          <PersonalityLikert
            itemId={item.id}
            questionText={item.text}
            value={responses[item.id]}
            onChange={onResponse}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
