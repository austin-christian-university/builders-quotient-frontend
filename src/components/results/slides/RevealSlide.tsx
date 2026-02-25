"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

type Props = {
    data: {
        displayName: string | null;
        bqPercentile: number;
    };
};

export function RevealSlide({ data }: Props) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const end = data.bqPercentile;
        if (end === 0) {
            // Reset count when percentile is 0 (e.g., component reused with new data)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCount(0);
            return;
        }
        const duration = 2000;
        let startTimestamp: number | null = null;
        let animationFrameId: number;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(easeProgress * end));
            if (progress < 1) {
                animationFrameId = window.requestAnimationFrame(step);
            }
        };
        animationFrameId = window.requestAnimationFrame(step);

        return () => window.cancelAnimationFrame(animationFrameId);
    }, [data.bqPercentile]);

    return (
        <section className="flex h-full flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Background Orbs */}
            <motion.div
                className="absolute w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full bg-primary/20 blur-[100px] -top-1/4 -right-1/4"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="z-10 text-center flex flex-col items-center gap-6 mt-[-10vh]">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-text-secondary text-[length:var(--text-fluid-lg)] font-medium tracking-wide"
                >
                    {data.displayName ? `${data.displayName}, your Builder's Quotient is...` : "Your Builder's Quotient is..."}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, delay: 0.5, type: "spring", stiffness: 50 }}
                    className="relative"
                >
                    <div className="text-[length:var(--text-fluid-5xl)] font-display font-bold leading-none bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent drop-shadow-2xl flex items-baseline">
                        {count}
                        <span className="text-[length:var(--text-fluid-2xl)] ml-1 text-white/50 font-normal">%</span>
                    </div>

                    <motion.div
                        className="absolute inset-0 bg-primary/30 blur-3xl -z-10 rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5, duration: 1 }}
                >
                    <p className="max-w-md mx-auto text-text-secondary text-[length:var(--text-fluid-base)]">
                        You scored higher than <span className="text-white font-semibold">{data.bqPercentile}%</span> of the population.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
