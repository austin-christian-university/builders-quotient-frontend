"use client";

import { motion } from "motion/react";
import type { Archetype } from "@/lib/schemas/results";

type Props = {
    data: Archetype;
};

export function ArchetypeSlide({ data }: Props) {
    return (
        <section className="flex h-full flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Dynamic Background matching variant */}
            <motion.div
                className={`absolute w-[100vw] h-[100vw] max-w-[800px] max-h-[800px] rounded-full blur-[120px] bottom-0 left-1/2 -translate-x-1/2 mix-blend-screen opacity-30 ${data.variant === 'pi' ? 'bg-primary' : 'bg-secondary'}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.3, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
            />

            <div className="z-10 text-center flex flex-col items-center w-full max-w-sm" style={{ perspective: "1000px" }}>
                <motion.p
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-text-secondary uppercase tracking-widest text-sm mb-6 font-semibold"
                >
                    Your Archetype
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, rotateX: 20, y: 40 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    transition={{ duration: 1.2, type: "spring", bounce: 0.4, delay: 0.2 }}
                    className="relative w-full aspect-[4/5] rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden flex flex-col items-center justify-center p-8 group shadow-2xl"
                >
                    {/* Inner glow */}
                    <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${data.variant === 'pi' ? 'from-primary' : 'from-secondary'} to-transparent`} />

                    {/* Gloss reflection overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                    <motion.h2
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="font-display text-[length:var(--text-fluid-4xl)] font-bold text-white mb-4 text-center leading-tight drop-shadow-md"
                    >
                        {data.name}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="text-[length:var(--text-fluid-base)] text-white/80 text-center italic"
                    >
                        &ldquo;{data.tagline}&rdquo;
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.4 }}
                        className="absolute bottom-8 left-8 right-8 text-center text-sm text-text-secondary border-t border-white/10 pt-6"
                    >
                        Based on your strongest area:<br />
                        <span className="text-white font-medium block mt-1">{data.basedOnCategory}</span>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
