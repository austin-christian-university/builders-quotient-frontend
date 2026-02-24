"use client";

import { motion } from "motion/react";
import type { CategoryScore } from "@/lib/schemas/results";
import { useEffect, useState } from "react";

type Props = {
    data: {
        headline: number;
        categories: CategoryScore[];
    };
    title: string;
    variant: "pi" | "ci";
};

function ProgressLine({ category, percentile, index, variant }: { category: string, percentile: number, index: number, variant: "pi" | "ci" }) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        // Delay slightly based on index
        const timer = setTimeout(() => setWidth(percentile), 500 + index * 150);
        return () => clearTimeout(timer);
    }, [percentile, index]);

    const colorClass = variant === "pi" ? "bg-primary" : "bg-secondary";

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
                <span className="text-white/90 font-medium">{category}</span>
                <span className="text-white/60">{percentile}th</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full ${colorClass} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
        </div>
    );
}

export function IntelligenceSlide({ data, title, variant }: Props) {
    return (
        <section className="flex h-full flex-col justify-center px-6 sm:px-12 max-w-4xl mx-auto w-full relative">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
            >
                <p className="text-text-secondary uppercase tracking-widest text-sm mb-2 font-semibold border-l-2 border-white/20 pl-4">{title}</p>
                <div className="flex items-end gap-3 mb-2">
                    <h2 className="font-display text-[length:var(--text-fluid-5xl)] font-bold text-white leading-none">
                        {data.headline}
                    </h2>
                    <span className="text-[length:var(--text-fluid-xl)] text-white/50 mb-1 font-light">%</span>
                </div>
                <p className="text-text-secondary">Your overall percentile in {title}.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mt-8">
                {data.categories.map((cat, i) => (
                    <motion.div
                        key={cat.category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                    >
                        <ProgressLine
                            category={cat.category}
                            percentile={cat.percentile}
                            index={i}
                            variant={variant}
                        />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
