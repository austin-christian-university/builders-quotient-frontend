"use client";

import { motion } from "motion/react";
import { PersonalityLikert } from "./PersonalityLikert";
import type {
  PersonalityItem,
  LikertValue,
} from "@/lib/assessment/personality-bank";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.08 },
  },
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
  return (
    <motion.div
      className="flex flex-col gap-4"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          variants={fadeUp}
          transition={transition}
          className="rounded-2xl border border-border-glass bg-bg-elevated/60 p-5 backdrop-blur-xl sm:p-6"
        >
          <p className="mb-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
            <span className="mr-2 tabular-nums text-text-secondary">
              {pageOffset + i + 1}.
            </span>
            {item.text}
          </p>
          <PersonalityLikert
            itemId={item.id}
            value={responses[item.id]}
            onChange={onResponse}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
