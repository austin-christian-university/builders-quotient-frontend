"use client";

import { useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import type { ResultsPageData } from "@/lib/schemas/results";
import { toPng } from "html-to-image";

const EASE = [0.16, 1, 0.3, 1] as const;

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
const ChevronLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
    </svg>
);

const ChevronRight = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
);

const LinkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

// ---------------------------------------------------------------------------
// Card Components
// ---------------------------------------------------------------------------

function FounderMatchCard({ data, isExporting }: { data: ResultsPageData, isExporting: boolean }) {
    const primary = data.reasoningMatch?.primary || data.communicationMatch?.primary;
    if (!primary) return null;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0c] p-6 relative overflow-hidden text-left" style={{ transform: isExporting ? "translateZ(0)" : "none" }}>
            {/* Glow layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#4da3ff]/10 to-transparent pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#4da3ff]/20 blur-3xl rounded-full" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                    <span className="uppercase tracking-[0.2em] text-[10px] text-white/50 font-medium font-mono">Founder Match</span>
                    <div className="w-6 h-6 rounded-full border border-white/20 bg-white/10" />
                </div>

                <p className="text-sm text-white/60 mb-1">Your Builder Profile aligns with</p>
                <h2 className="font-display text-4xl font-bold text-white leading-none tracking-tight">
                    {primary.entrepreneurName}
                </h2>

                {primary.companies && primary.companies.length > 0 && (
                    <p className="mt-2 text-xs text-[#4da3ff]/80 font-medium tracking-wide uppercase">
                        {primary.companies.join(", ")}
                    </p>
                )}

                {/* Content to fill space */}
                <div className="mt-6 flex flex-col gap-4">
                    {(primary.domainStyle || primary.bioNarrative) && (
                        <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 font-mono">The Playbook</p>
                            <p className="text-sm text-white/80 leading-relaxed line-clamp-4">
                                {primary.domainStyle || primary.bioNarrative}
                            </p>
                        </div>
                    )}
                    {primary.strengths && (
                        <div>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 font-mono">Superpower</p>
                            <p className="text-sm text-white/80 leading-relaxed line-clamp-3">
                                {primary.strengths}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-auto">
                    <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent mb-4" />
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="font-bold text-white text-lg leading-tight">{data.archetype.name}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-mono">Builder&rsquo;s Quotient</p>
                        </div>
                        <div className="h-6 opacity-60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/white_crest_and_wordmark.png" alt="ACU" className="h-full w-auto object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SuperpowerCard({ data, isExporting }: { data: ResultsPageData, isExporting: boolean }) {
    // Combine PI and CI, sort by score, take top 3
    const combined = [...data.piCategories, ...data.ciCategories]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0c] p-6 relative overflow-hidden text-left" style={{ transform: isExporting ? "translateZ(0)" : "none" }}>
            <div className="absolute inset-0 bg-gradient-to-bl from-[#e9b949]/10 to-transparent pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#e9b949]/20 blur-3xl rounded-full" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                    <span className="uppercase tracking-[0.2em] text-[10px] text-white/50 font-medium font-mono">Top Traits</span>
                    <div className="w-6 h-6 rounded-full border border-white/20 bg-white/10" />
                </div>

                <div className="flex flex-col gap-5 flex-1 justify-center">
                    {combined.map((trait, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-white/90">{trait.category}</span>
                                <span className="text-[#e9b949] font-bold text-[10px]">{Math.round(trait.score)}th percentile</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative">
                                {/* We use width directly for html-to-image compatibility instead of Framer Motion animation width */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#e9b949]/50 to-[#e9b949] rounded-full"
                                    style={{ width: `${trait.score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto">
                    <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent mb-4" />
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="font-bold text-white text-lg leading-tight">{data.archetype.name}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-mono">Builder&rsquo;s Quotient</p>
                        </div>
                        <div className="h-6 opacity-60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/white_crest_and_wordmark.png" alt="ACU" className="h-full w-auto object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ArchetypeCard({ data, isExporting }: { data: ResultsPageData, isExporting: boolean }) {
    return (
        <div className="flex flex-col h-full bg-[#0a0a0c] p-6 relative overflow-hidden text-center" style={{ transform: isExporting ? "translateZ(0)" : "none" }}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />
            {/* subtle noise - conditionally hide if exporting to optimize capture or keep for vibe, html-to-image handles SVGs fine usually */}
            {!isExporting && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            )}

            <div className="relative z-10 flex flex-col h-full items-center justify-center pt-8">
                <p className="uppercase tracking-[0.3em] text-[10px] text-white/50 font-medium mb-4 font-mono">Builder Profile</p>

                <h2 className="font-display text-4xl font-bold text-white leading-tight mb-3">
                    {data.archetype.name}
                </h2>

                <p className="text-sm text-white/60 italic font-serif px-4">
                    &ldquo;{data.archetype.tagline}&rdquo;
                </p>

                <div className="mt-auto w-full text-left pt-6">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
                    <div className="flex justify-between items-end px-2">
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Builder&rsquo;s Quotient</p>
                        <div className="h-6 opacity-60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/white_crest_and_wordmark.png" alt="ACU" className="h-full w-auto object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


// ---------------------------------------------------------------------------
// 3D Tilt Wrapper
// ---------------------------------------------------------------------------

function TiltWrapper({
    children,
    cardRef,
    isExporting
}: {
    children: React.ReactNode;
    cardRef: React.RefObject<HTMLDivElement | null>;
    isExporting: boolean;
}) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const sheenPositionX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"]);
    const sheenPositionY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"]);
    const sheenOpacity = useTransform(() => Math.abs(x.get()) + Math.abs(y.get()));

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isExporting) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    // Turn off perspective during export to ensure html-to-image captures perfectly flat
    const currentRotateX = isExporting ? "0deg" : rotateX;
    const currentRotateY = isExporting ? "0deg" : rotateY;

    return (
        <motion.div
            className="relative w-full aspect-[9/16] max-w-[300px] perspective-[1000px] max-h-[55vh] md:max-h-[60vh] mx-auto select-none touch-manipulation"
            style={{ perspective: isExporting ? "none" : 1000 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                className="w-full h-full relative"
                style={{
                    rotateX: currentRotateX,
                    rotateY: currentRotateY,
                    transformStyle: "preserve-3d"
                }}
            >
                <div
                    ref={cardRef}
                    className="w-full h-full absolute inset-0 rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] bg-[#0a0a0c] border border-white/10"
                    style={{
                        willChange: isExporting ? 'auto' : 'transform',
                    }}
                >
                    {children}

                    {/* Holographic Sheen Overlay */}
                    {!isExporting && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none mix-blend-screen rounded-2xl bg-gradient-to-tr from-white/0 via-white/30 to-white/0"
                            style={{
                                backgroundPosition: useTransform(() => `${sheenPositionX.get()} ${sheenPositionY.get()}`),
                                backgroundSize: '200% 200%',
                                opacity: useTransform(() => Math.min(sheenOpacity.get() * 2, 0.5)),
                            }}
                        />
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export interface ShareApplySlideProps {
    data: ResultsPageData;
}

export function ShareApplySlide({ data }: ShareApplySlideProps) {
    const [copied, setCopied] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);

    const printRef = useRef<HTMLDivElement>(null);

    // Build available cards dynamically
    const cards: { id: string; component: React.ElementType<{ data: ResultsPageData, isExporting: boolean }> }[] = [];
    if (data.reasoningMatch?.primary || data.communicationMatch?.primary) {
        cards.push({ id: 'founder', component: FounderMatchCard });
    }
    if (data.piCategories.length > 0 || data.ciCategories.length > 0) {
        cards.push({ id: 'superpower', component: SuperpowerCard });
    }
    cards.push({ id: 'archetype', component: ArchetypeCard });

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const handleCopyLink = useCallback(async () => {
        const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Clipboard write failed:", err);
        }
    }, []);

    const handleDownloadImage = useCallback(async () => {
        if (!printRef.current) return;
        try {
            setIsExporting(true);

            // Allow a tiny moment for Framer Motion to snap rotate to 0deg before capture
            await new Promise((resolve) => setTimeout(resolve, 50));

            const dataUrl = await toPng(printRef.current, {
                quality: 1,
                pixelRatio: 3,
                cacheBust: true,
                style: { transform: 'none' } // guarantee flat capture for mobile devices
            });

            const link = document.createElement('a');
            link.download = `builder-profile-${cards[currentIndex].id}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Capture failed:", err);
        } finally {
            setIsExporting(false);
        }
    }, [currentIndex, cards]);

    const isAdmissions = data.applicant.assessmentType === "admissions";
    const CurrentCardComponent = cards[currentIndex].component;

    // Animation variants for carousel
    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (dir: number) => ({
            x: dir < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95,
        }),
    };

    return (
        <section className="flex h-full flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background glow */}
            <motion.div
                aria-hidden="true"
                className="absolute w-[100vw] h-[100vw] max-w-[700px] max-h-[700px] rounded-full blur-[130px] bottom-0 left-1/2 -translate-x-1/2 mix-blend-screen opacity-20 pointer-events-none"
                style={{ background: "#4da3ff" }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.2, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
            />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="text-center z-10 mb-4 shrink-0 mt-8"
            >
                <p className="text-white/50 uppercase tracking-[0.3em] text-xs font-semibold">Share Your Profile</p>
                <div className="flex justify-center gap-1.5 mt-4">
                    {cards.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Carousel & Card wrapper */}
            <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
                className="z-10 w-full max-w-md flex items-center justify-between gap-1 md:gap-4 relative"
            >
                {/* Left Nav */}
                {cards.length > 1 && (
                    <button
                        onClick={handlePrev}
                        className="p-1 md:p-2 text-white/40 hover:text-white transition-colors h-12 w-12 flex items-center justify-center shrink-0 select-none touch-manipulation hover:bg-white/5 rounded-full active:scale-95"
                        aria-label="Previous card"
                    >
                        <ChevronLeft />
                    </button>
                )}

                {/* The Card */}
                <div className="flex-1 w-full flex justify-center py-2">
                    <TiltWrapper cardRef={printRef} isExporting={isExporting}>
                        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.4, ease: EASE }}
                                className="absolute inset-0"
                            >
                                <CurrentCardComponent data={data} isExporting={isExporting} />
                            </motion.div>
                        </AnimatePresence>
                    </TiltWrapper>
                </div>

                {/* Right Nav */}
                {cards.length > 1 && (
                    <button
                        onClick={handleNext}
                        className="p-1 md:p-2 text-white/40 hover:text-white transition-colors h-12 w-12 flex items-center justify-center shrink-0 select-none touch-manipulation hover:bg-white/5 rounded-full active:scale-95"
                        aria-label="Next card"
                    >
                        <ChevronRight />
                    </button>
                )}
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
                className="z-10 w-full max-w-[280px] mt-6 flex flex-col gap-2 relative"
            >
                {/* Save to Camera Roll */}
                <button
                    onClick={handleDownloadImage}
                    disabled={isExporting}
                    className="w-full rounded-full border border-white/20 bg-white/5 backdrop-blur-sm py-3.5 px-6 text-sm font-semibold text-white/90 hover:border-white/40 hover:bg-white/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    {isExporting ? (
                        <div className="flex items-center gap-2 text-white/70">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>Preparing image...</span>
                        </div>
                    ) : (
                        <>
                            <DownloadIcon />
                            <span>Save to Camera Roll</span>
                        </>
                    )}
                </button>

                {/* Copy Link */}
                <button
                    onClick={handleCopyLink}
                    disabled={isExporting}
                    className="w-full py-2.5 px-6 text-xs font-medium text-white/50 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                    <LinkIcon />
                    {copied ? "Link Copied!" : "Copy Link to Results"}
                </button>

                {/* Apply CTA — admissions only */}
                {isAdmissions && (
                    <>
                        <div className="flex items-center gap-3 w-full mt-2 mb-1" aria-hidden="true">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-white/30 text-[9px] uppercase tracking-[0.2em] font-medium">What&rsquo;s next</span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>
                        <a
                            href="https://apply.austinchristianu.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center rounded-full py-3.5 px-8 text-sm font-bold text-[#0a0a0c] uppercase tracking-[0.1em] transition-all hover:brightness-110 hover:shadow-[0_0_24px_rgba(233,185,73,0.3)] touch-manipulation"
                            style={{ background: "#e9b949" }}
                        >
                            Apply to ACU
                        </a>
                    </>
                )}
            </motion.div>
        </section>
    );
}

