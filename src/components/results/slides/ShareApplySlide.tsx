"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import type { Archetype } from "@/lib/schemas/results";

const EASE = [0.16, 1, 0.3, 1] as const;

interface ShareApplySlideProps {
    archetype: Archetype;
    assessmentType: "public" | "admissions";
}

export function ShareApplySlide({ archetype, assessmentType }: ShareApplySlideProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = useCallback(async () => {
        const shareText = `I\u2019m ${archetype.name} \u2014 discover your Builder Profile.`;
        const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

        if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
            try {
                await navigator.share({
                    title: "My Builder Profile",
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled or share failed — fall through silently
                if (err instanceof Error && err.name !== "AbortError") {
                    console.error("Share failed:", err);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Clipboard write failed:", err);
            }
        }
    }, [archetype.name]);

    const isAdmissions = assessmentType === "admissions";

    return (
        <section className="flex h-full flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Background glow — blue primary */}
            <motion.div
                aria-hidden="true"
                className="absolute w-[100vw] h-[100vw] max-w-[700px] max-h-[700px] rounded-full blur-[130px] bottom-0 left-1/2 -translate-x-1/2 mix-blend-screen opacity-25"
                style={{ background: "#4da3ff" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.25, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
            />

            {/* Gold accent glow top-right */}
            <motion.div
                aria-hidden="true"
                className="absolute w-64 h-64 rounded-full blur-[100px] top-0 right-0 opacity-20"
                style={{ background: "#e9b949" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 0.4 }}
            />

            <div className="z-10 w-full max-w-sm flex flex-col items-center gap-6">
                {/* Eyebrow */}
                <motion.p
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="text-white/50 uppercase tracking-[0.3em] text-xs font-semibold"
                >
                    Share Your Results
                </motion.p>

                {/* Social card preview */}
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
                    className="w-full"
                >
                    <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden p-6 shadow-2xl">
                        {/* Inner gradient overlay */}
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 opacity-15 bg-gradient-to-br from-[#4da3ff] to-transparent pointer-events-none"
                        />

                        {/* Corner accent */}
                        <div
                            aria-hidden="true"
                            className="absolute top-0 right-0 w-24 h-24 rounded-bl-full blur-[40px] opacity-20 pointer-events-none"
                            style={{ background: "#e9b949" }}
                        />

                        <div className="relative z-10 flex flex-col gap-4">
                            {/* Card header */}
                            <div className="flex items-center justify-between">
                                <p className="uppercase tracking-[0.3em] text-[10px] text-white/40 font-semibold">
                                    Builder&rsquo;s Quotient
                                </p>
                                <div
                                    aria-hidden="true"
                                    className="w-5 h-5 rounded-full border border-white/20 bg-white/10"
                                />
                            </div>

                            {/* Archetype name */}
                            <div>
                                <h2 className="font-display text-[length:var(--text-fluid-2xl)] font-bold text-white leading-tight tracking-[-0.01em]">
                                    {archetype.name}
                                </h2>
                                <p className="mt-1 text-sm text-white/60 italic">&ldquo;{archetype.tagline}&rdquo;</p>
                            </div>

                            {/* Tagline */}
                            <p className="text-xs text-white/50 border-t border-white/10 pt-3">
                                Discover your Builder Profile
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Share button */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
                    className="w-full"
                >
                    <button
                        onClick={handleShare}
                        className="w-full rounded-full border border-white/20 bg-white/5 backdrop-blur-sm py-3.5 px-6 text-sm font-semibold text-white/90 hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4da3ff] transition-all duration-200 touch-manipulation"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                        aria-live="polite"
                    >
                        {copied ? "Copied!" : "Share Your Profile"}
                    </button>
                </motion.div>

                {/* Apply CTA — admissions only */}
                {isAdmissions && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
                        className="w-full flex flex-col items-center gap-4"
                    >
                        {/* Separator */}
                        <div className="flex items-center gap-3 w-full" aria-hidden="true">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-white/30 text-xs uppercase tracking-[0.2em]">What&rsquo;s next</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Encouragement copy */}
                        <p className="text-center text-sm text-white/70 leading-relaxed text-balance">
                            We&rsquo;ve reviewed your results and we think you have the potential to be a
                            high&#8209;performing builder. We&rsquo;d love for you to apply.
                        </p>

                        {/* Apply button */}
                        <a
                            href="https://apply.austinchristianu.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center rounded-full py-4 px-8 text-sm font-bold text-[#0a0a0c] uppercase tracking-[0.1em] transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_24px_rgba(233,185,73,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e9b949] touch-manipulation"
                            style={{
                                background: "#e9b949",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            Apply to ACU
                        </a>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
