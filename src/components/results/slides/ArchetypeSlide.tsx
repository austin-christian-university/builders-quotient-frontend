"use client";

import { motion } from "motion/react";
import type { Archetype } from "@/lib/schemas/results";

type Props = {
    data: Archetype;
};

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The reveal. Built like the landing's sample profile sheet: a 2px ink frame,
 * ruled rows, and the archetype name set as giant display type.
 */
export function ArchetypeSlide({ data }: Props) {
    return (
        <section className="flex min-h-full md:h-full flex-col items-center justify-center px-5 py-16 md:px-10 md:py-16">
            <motion.article
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
                className="w-full max-w-4xl border-2 border-ink bg-[#fbfaf6]"
            >
                <header className="flex items-center justify-between gap-4 border-b border-ink px-4 py-3 text-sm font-semibold text-ink md:px-6">
                    <span>Your Archetype</span>
                    <span aria-hidden="true" className="block h-2.5 w-2.5 bg-vermilion" />
                </header>

                <div className="px-4 pt-7 pb-8 md:px-6 md:pt-10 md:pb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.25, ease }}
                        className="font-display text-[clamp(46px,10.5vw,124px)] font-semibold leading-[0.9] tracking-[-0.055em] text-ink [overflow-wrap:anywhere]"
                    >
                        {data.name}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="mt-5 max-w-[40ch] text-[clamp(18px,1.8vw,22px)] font-medium leading-[1.35] tracking-[-0.01em] text-ink md:mt-7"
                    >
                        &ldquo;{data.tagline}&rdquo;
                    </motion.p>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.15 }}
                    className="border-t border-ink px-4 py-5 text-[15px] leading-[1.55] text-[#3d3c39] md:px-6 md:py-6 md:text-base"
                >
                    <span className="block max-w-[62ch]">{data.description}</span>
                </motion.p>
            </motion.article>
        </section>
    );
}
