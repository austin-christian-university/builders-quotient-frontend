"use client";

import { motion } from "motion/react";

type Props = {
    data: {
        displayName: string | null;
        bqPercentile: number;
        archetype: string;
    };
};

export function ShareSlide({ data }: Props) {
    const namePossessive = data.displayName ? `${data.displayName}\u2019s` : "Your";

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "My Builder's Quotient Results",
                    text: `I scored in the ${data.bqPercentile}th percentile and got the ${data.archetype} archetype!`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error("Error sharing", err);
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <section className="flex h-full flex-col justify-center items-center px-6 relative overflow-hidden">
            {/* Dynamic Backgrounds */}
            <motion.div
                className="absolute w-[150vw] h-[150vw] max-w-[1000px] max-h-[1000px] bg-primary/20 rounded-full blur-[150px] mix-blend-screen opacity-50"
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, type: "spring" }}
                className="z-10 w-full max-w-sm"
            >
                <div className="relative aspect-[3/4] rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-8 mb-8 flex flex-col justify-between shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-hidden shine-effect">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/30 rounded-bl-full blur-[40px] -z-10" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/30 rounded-tr-full blur-[50px] -z-10" />

                    <div>
                        <h3 className="uppercase tracking-widest text-xs text-white/70 mb-2">Builder's Quotient</h3>
                        <div className="font-display font-bold text-3xl text-white leading-none">
                            {namePossessive} Results
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div>
                            <div className="text-white/50 text-sm uppercase tracking-wide">Overall Percentile</div>
                            <div className="font-display font-bold text-[length:var(--text-fluid-4xl)] text-white">
                                {Math.round(data.bqPercentile)}%
                            </div>
                        </div>

                        <div>
                            <div className="text-white/50 text-sm uppercase tracking-wide">Archetype</div>
                            <div className="font-display font-bold text-[length:var(--text-fluid-2xl)] text-white text-balance leading-tight">
                                {data.archetype}
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-white/30 border-t border-white/10 pt-4 flex justify-between items-center">
                        <span>buildersquotient.com</span>
                        <span className="w-4 h-4 rounded-full border border-white/30 bg-white/10" />
                    </div>
                </div>

                <button
                    onClick={handleShare}
                    className="w-full bg-white text-black font-bold py-4 rounded-full hover:scale-105 transition-transform duration-300 shadow-xl shadow-white/10 uppercase tracking-widest text-sm"
                >
                    Share Results
                </button>
            </motion.div>
        </section>
    );
}
