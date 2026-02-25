"use client";

import { motion } from "motion/react";

type HighlightData = {
    title: string;
    items: Array<{
        description: string;
        rarityPercent?: number;
        rarityFraction?: string;
        categoryName: string;
    }>;
};

type Props = {
    data: HighlightData;
};

export function HighlightSlide({ data }: Props) {
    return (
        <section
            className="flex h-full flex-col justify-center px-6 sm:px-12 max-w-4xl mx-auto w-full relative"
            style={{ background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-secondary) 20%, transparent) 0%, transparent 70%)" }}
        >
            <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-secondary font-semibold tracking-widest uppercase mb-12 text-center text-sm"
            >
                {data.title}
            </motion.p>

            <div className="flex flex-col gap-12 sm:gap-16 items-center">
                {data.items.map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 + idx * 0.4 }}
                        className="text-center max-w-2xl"
                    >
                        <h3 className="font-display text-[length:var(--text-fluid-2xl)] font-bold mb-4 leading-tight text-white drop-shadow-md">
                            &ldquo;{item.description}&rdquo;
                        </h3>

                        <div className="inline-flex items-center justify-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                            <span className="text-secondary font-bold">
                                {item.rarityPercent !== undefined ? `Only ${item.rarityPercent}%` : `Only ${item.rarityFraction}`}
                            </span>
                            <span className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                            <span className="text-white/70 text-sm uppercase tracking-wide">{item.categoryName}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
