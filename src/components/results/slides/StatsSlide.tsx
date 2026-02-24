"use client";

import { motion } from "motion/react";
import type { ResultsStats } from "@/lib/schemas/results";

type Props = {
    data: ResultsStats;
};

function StatBox({ label, value, delay }: { label: string; value: string | React.ReactNode; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-center"
        >
            <div className="font-display text-[length:var(--text-fluid-3xl)] font-bold text-white mb-2 leading-none">
                {value}
            </div>
            <div className="text-sm text-text-secondary uppercase tracking-wide font-medium">
                {label}
            </div>
        </motion.div>
    );
}

export function StatsSlide({ data }: Props) {
    return (
        <section className="flex h-full flex-col justify-center items-center px-6">
            <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-text-secondary uppercase tracking-widest text-sm mb-12 font-semibold"
            >
                By the Numbers
            </motion.p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
                <StatBox
                    delay={0.2}
                    label="Categories Above Average"
                    value={<>{data.piCategoriesAboveAvg + data.ciCategoriesAboveAvg}<span className="text-2xl text-white/50">/10</span></>}
                />
                <div className="col-span-2 lg:col-span-2 row-span-2 bg-gradient-to-br from-primary/10 to-transparent border border-white/10 rounded-2xl p-8 backdrop-blur-md flex flex-col justify-between overflow-hidden relative">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"
                    />
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-primary uppercase tracking-wider text-sm font-bold mb-4"
                        >
                            Strongest Category
                        </motion.div>
                        <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="font-display text-[length:var(--text-fluid-4xl)] font-bold text-white mb-2 leading-tight"
                        >
                            {data.strongestCategory.name}
                        </motion.h3>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="text-right"
                    >
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="font-display font-bold text-[length:var(--text-fluid-5xl)] text-white">{Math.round(data.strongestCategory.percentile)}</span>
                            <span className="text-xl text-white/50">%</span>
                        </div>
                        <div className="text-white/60 text-sm">Percentile</div>
                    </motion.div>
                </div>

                <StatBox
                    delay={0.4}
                    label="Biggest Gap Over Peers"
                    value={`+${Math.round(data.biggestGap)}%`}
                />
                <StatBox
                    delay={0.6}
                    label="Compared Against"
                    value={<>{data.corpusSize.toLocaleString()}<span className="text-lg text-white/50 block mt-1 leading-none">Builders</span></>}
                />
            </div>
        </section>
    );
}
