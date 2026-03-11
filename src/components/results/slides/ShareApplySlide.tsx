"use client";

import { useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import type { ResultsPageData } from "@/lib/schemas/results";
import { toBlob } from "html-to-image";
import { RadarChart } from "@/components/results/RadarChart";
import { getShortLabel } from "@/components/results/short-labels";

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

interface MatchupCardProps {
    data: ResultsPageData;
    matchType: "reasoning" | "communication";
    isExporting: boolean;
}

function MatchupCard({ data, matchType, isExporting }: MatchupCardProps) {
    const match = matchType === "reasoning" ? data.reasoningMatch : data.communicationMatch;
    const primary = match?.primary;
    if (!primary) return null;

    const accentColor = matchType === "reasoning" ? "#4da3ff" : "#e9b949";
    const label = matchType === "reasoning" ? "Reasoning Match" : "Communication Match";
    const founderLabel = matchType === "reasoning" ? "Thinks Like" : "Communicates Like";
    const displayName = data.applicant.displayName || "You";

    return (
        <div className="flex flex-col h-full bg-[#0a0a0c] p-6 relative overflow-hidden" style={{ transform: isExporting ? "translateZ(0)" : "none" }}>
            {/* Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[60px] pointer-events-none"
                style={{ background: `${accentColor}18` }}
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* Eyebrow */}
                <span className="uppercase tracking-[0.2em] text-[9px] text-white/40 font-semibold mb-auto">
                    {label}
                </span>

                {/* Match area */}
                <div className="flex flex-col items-center gap-3 my-auto text-center">
                    {/* You */}
                    <div>
                        <p className="text-[8px] uppercase tracking-[0.2em] text-white/35 font-semibold mb-1">You</p>
                        <p className="font-display text-lg font-bold text-white leading-tight">{displayName}</p>
                        <p className="text-[10px] font-semibold mt-1" style={{ color: accentColor }}>
                            {data.archetype.name}
                        </p>
                    </div>

                    {/* Connector */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-px bg-white/12" />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                            <path d="M8 3l4 4-4 4" /><path d="M16 21l-4-4 4-4" /><line x1="12" y1="7" x2="12" y2="17" />
                        </svg>
                        <div className="w-8 h-px bg-white/12" />
                    </div>

                    {/* Founder */}
                    <div>
                        <p className="text-[8px] uppercase tracking-[0.2em] text-white/35 font-semibold mb-1">{founderLabel}</p>
                        <p className="font-display text-2xl font-extrabold text-white leading-tight">
                            {primary.entrepreneurName}
                        </p>
                        {primary.companies && primary.companies.length > 0 && (
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-1" style={{ color: `${accentColor}CC` }}>
                                {primary.companies.join(", ")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto">
                    <div className="h-px w-full bg-gradient-to-r from-white/15 to-transparent mb-3" />
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-14 opacity-60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/White-Crest.png" alt="ACU" className="h-full w-auto object-contain" />
                        </div>
                        <p className="text-[8px] text-white/35 uppercase tracking-[0.15em] font-semibold">Find Your Match</p>
                        <p className="text-[7px] text-white/25 tracking-[0.1em]">bq.austinchristianu.org</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface RadarShareCardProps {
    data: ResultsPageData;
    variant: "pi" | "ci";
    isExporting: boolean;
}

function RadarShareCard({ data, variant, isExporting }: RadarShareCardProps) {
    const radar = variant === "pi" ? data.piRadar : data.ciRadar;
    if (radar.length === 0) return null;

    const accentColor = variant === "pi" ? "#4da3ff" : "#e9b949";
    const subtitle = variant === "pi" ? "Practical Intelligence" : "Creative Intelligence";

    const categories = radar.map((c) => getShortLabel(c.category));
    const rawScores = radar.map((c) => c.studentScore);
    const maxScore = Math.max(...rawScores) || 1;
    const studentScores = rawScores.map((s) => (s / maxScore) * 100);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0c] p-5 relative overflow-hidden text-center" style={{ transform: isExporting ? "translateZ(0)" : "none" }}>
            {/* Glow */}
            <div
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[50px] pointer-events-none"
                style={{ background: `${accentColor}20` }}
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* Eyebrow + subtitle */}
                <div className="mb-2">
                    <span className="uppercase tracking-[0.2em] text-[9px] text-white/40 font-semibold">Builder DNA</span>
                    <p className="text-[10px] font-semibold mt-1" style={{ color: `${accentColor}AA` }}>
                        {subtitle}
                    </p>
                </div>

                {/* Radar */}
                <div className="flex-1 flex items-center justify-center min-h-0">
                    <RadarChart
                        categories={categories}
                        studentScores={studentScores}
                        accentColor={accentColor}
                        size={320}
                        maxValue={100}
                        gridStyle="axesOnly"
                    />
                </div>

                {/* Footer */}
                <div className="mt-auto">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent mb-3" />
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-14 opacity-60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/White-Crest.png" alt="ACU" className="h-full w-auto object-contain" />
                        </div>
                        <p className="text-[8px] text-white/35 uppercase tracking-[0.15em] font-semibold">Find Your Profile</p>
                        <p className="text-[7px] text-white/25 tracking-[0.1em]">bq.austinchristianu.org</p>
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

                <div className="mt-auto w-full pt-6">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-14 opacity-60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/White-Crest.png" alt="ACU" className="h-full w-auto object-contain" />
                        </div>
                        <p className="text-[8px] text-white/35 uppercase tracking-[0.15em] font-semibold">Find Your Archetype</p>
                        <p className="text-[7px] text-white/25 tracking-[0.1em]">bq.austinchristianu.org</p>
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

    // Derive sheen styles unconditionally (hooks can't be inside conditional JSX)
    const sheenBgPosition = useTransform(() => `${sheenPositionX.get()} ${sheenPositionY.get()}`);
    const sheenBgOpacity = useTransform(() => Math.min(sheenOpacity.get() * 2, 0.5));

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
                                backgroundPosition: sheenBgPosition,
                                backgroundSize: '200% 200%',
                                opacity: sheenBgOpacity,
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
    const cards: { id: string; render: (exp: boolean) => React.ReactNode }[] = [];
    if (data.reasoningMatch?.primary) {
        cards.push({
            id: "reasoning-match",
            render: (exp) => <MatchupCard data={data} matchType="reasoning" isExporting={exp} />,
        });
    }
    if (data.communicationMatch?.primary) {
        cards.push({
            id: "communication-match",
            render: (exp) => <MatchupCard data={data} matchType="communication" isExporting={exp} />,
        });
    }
    if (data.piRadar.length > 0) {
        cards.push({
            id: "pi-radar",
            render: (exp) => <RadarShareCard data={data} variant="pi" isExporting={exp} />,
        });
    }
    if (data.ciRadar.length > 0) {
        cards.push({
            id: "ci-radar",
            render: (exp) => <RadarShareCard data={data} variant="ci" isExporting={exp} />,
        });
    }
    cards.push({
        id: "archetype",
        render: (exp) => <ArchetypeCard data={data} isExporting={exp} />,
    });

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const handleCopyLink = useCallback(async () => {
        const shareUrl = typeof window !== "undefined" ? window.location.href : "";
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

            // Let Framer Motion snap to flat (0deg rotation) before capture
            await new Promise((resolve) => setTimeout(resolve, 150));

            // Inline <img> srcs as data URLs so the cloner doesn't re-fetch
            const imgs = printRef.current.querySelectorAll("img");
            const originalSrcs: string[] = [];
            for (const img of imgs) {
                originalSrcs.push(img.src);
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    canvas.getContext("2d")!.drawImage(img, 0, 0);
                    img.src = canvas.toDataURL("image/png");
                } catch { /* keep original */ }
            }

            const blob = await toBlob(printRef.current, {
                pixelRatio: 2,
                style: { transform: "none" },
                skipFonts: true,
                filter: (node: HTMLElement) => {
                    // Skip decorative blur overlays that slow serialization
                    if (node.style?.filter?.includes("blur") || node.className?.includes?.("blur-")) {
                        return false;
                    }
                    return true;
                },
            });

            // Restore original image srcs
            imgs.forEach((img, i) => { img.src = originalSrcs[i]; });

            if (!blob) throw new Error("Image capture returned empty");

            const filename = `builder-profile-${cards[currentIndex].id}.png`;
            const file = new File([blob], filename, { type: "image/png" });

            // Try Web Share API first (works on mobile Safari / Android)
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file] });
            } else {
                // Blob URL + anchor download (desktop)
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = filename;
                link.href = blobUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            }
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            console.error("Capture failed:", err);
        } finally {
            setIsExporting(false);
        }
    }, [currentIndex, cards]);

    const isAdmissions = data.applicant.assessmentType === "admissions";

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
                                {cards[currentIndex].render(isExporting)}
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

