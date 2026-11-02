"use client";

import { useState, useCallback, useRef, useEffect, useMemo, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ResultsPageData } from "@/lib/schemas/results";
import { RadarChart } from "@/components/results/RadarChart";
import { getShortLabel } from "@/components/results/short-labels";
import {
    PERSONALITY_DIMENSION_CATEGORIES,
} from "@/lib/assessment/personality-dimensions";
import { useShareCardCache } from "@/lib/hooks/use-share-card-cache";
import { BqMark } from "@/components/brand/BqMark";

const EASE = [0.16, 1, 0.3, 1] as const;

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
const ChevronLeft = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
    </svg>
);

const ChevronRight = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
        <path d="m9 18 6-6-6-6" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
);

const LinkIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

const ShareIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" />
    </svg>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function anchorDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Mobile detection via useSyncExternalStore (coarse pointer + narrow viewport)
function getMobileSnapshot() {
    return window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 768;
}
function getMobileServerSnapshot() {
    return false;
}
function subscribeMobile(callback: () => void) {
    const mql = window.matchMedia("(pointer: coarse)");
    mql.addEventListener("change", callback);
    window.addEventListener("resize", callback);
    return () => {
        mql.removeEventListener("change", callback);
        window.removeEventListener("resize", callback);
    };
}
function useIsMobile() {
    return useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
}

// ---------------------------------------------------------------------------
// Card Components — Swiss Ink share sheets. Paper ground, ink hairlines,
// BqMark lockup up top, ACU line in the footer. The 2px ink frame lives on
// CardFrame (the captured node) so it is part of every exported PNG.
// ---------------------------------------------------------------------------

const VERMILION = "#E8452C";
const INK = "#111111";

function CardShell({
    isExporting,
    label,
    cta,
    children,
}: {
    isExporting: boolean;
    label?: string;
    cta: string;
    children: React.ReactNode;
}) {
    // Sized in container units (cqw) so the poster keeps its proportions at any card width.
    return (
        <div
            className="@container flex h-full flex-col bg-paper text-left text-ink"
            style={{ transform: isExporting ? "translateZ(0)" : "none" }}
        >
            {/* Header — lockup + card name */}
            <div className="flex shrink-0 items-center justify-between gap-[3cqw] border-b-2 border-ink px-[6cqw] py-[4.5cqw]">
                <span className="flex items-center gap-[2.5cqw]">
                    <BqMark className="h-[6.5cqw] w-[6.5cqw] text-ink" />
                    <span className="text-[4.6cqw] font-semibold leading-none tracking-[-0.03em]">Builder&rsquo;s Quotient</span>
                </span>
                {label && <span className="text-[3.6cqw] leading-none text-[#6b6963]">{label}</span>}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">{children}</div>

            {/* Footer — ink band with the call to action and the mark */}
            <div className="flex shrink-0 items-end justify-between gap-[4cqw] bg-ink px-[6cqw] py-[5cqw] text-paper">
                <div className="min-w-0">
                    <p className="text-[5.6cqw] font-semibold leading-none tracking-[-0.03em]">
                        {cta} <span aria-hidden="true">&rarr;</span>
                    </p>
                    <p className="mt-[2cqw] text-[3.4cqw] leading-none text-[#bdbab2]">bq.austinchristianu.org</p>
                    <p className="mt-[1.4cqw] text-[3cqw] leading-none text-[#8c8a84]">Austin Christian University</p>
                </div>
                <BqMark className="h-[13cqw] w-[13cqw] shrink-0 text-paper" />
            </div>
        </div>
    );
}

interface MatchupCardProps {
    data: ResultsPageData;
    matchType: "reasoning" | "communication";
    isExporting: boolean;
}

function MatchupCard({ data, matchType, isExporting }: MatchupCardProps) {
    const match = matchType === "reasoning" ? data.reasoningMatch : data.communicationMatch;
    const primary = match?.primary;
    if (!primary) return null;

    const isReasoning = matchType === "reasoning";
    const label = isReasoning ? "Reasoning" : "Communication";
    const founderLabel = isReasoning ? "Thinks like" : "Communicates like";
    const displayName = data.applicant.displayName || "You";

    return (
        <CardShell isExporting={isExporting} label={label} cta="Find your match">
            {/* You */}
            <div className="px-[6cqw] pt-[7cqw]">
                <p className="text-[3.6cqw] text-[#6b6963]">You</p>
                <p className="mt-[1.5cqw] text-[9cqw] font-semibold leading-[0.95] tracking-[-0.045em] [overflow-wrap:anywhere]">
                    {displayName}
                </p>
                <p className="mt-[2cqw] text-[4.4cqw] font-medium tracking-[-0.01em] text-[#3d3c39]">
                    {data.archetype.name}
                </p>
            </div>

            {/* Founder — the poster's headline */}
            <div className="mt-auto px-[6cqw] pb-[7cqw]">
                <p
                    className="flex items-center gap-[2cqw] text-[4.4cqw] font-semibold tracking-[-0.01em]"
                    style={{ color: isReasoning ? VERMILION : INK }}
                >
                    <span aria-hidden="true" className="inline-block h-[2.6cqw] w-[2.6cqw]" style={{ background: isReasoning ? VERMILION : INK }} />
                    {founderLabel}
                </p>
                <p className="mt-[3cqw] text-[16cqw] font-semibold leading-[0.86] tracking-[-0.06em] [overflow-wrap:anywhere]">
                    {primary.entrepreneurName}
                </p>
                {primary.companies && primary.companies.length > 0 && (
                    <p className="mt-[4cqw] border-t border-ink pt-[3cqw] text-[4.2cqw] leading-snug text-[#3d3c39]">
                        {primary.companies.join(", ")}
                    </p>
                )}
            </div>
        </CardShell>
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

    const accentColor = variant === "pi" ? VERMILION : INK;

    const categories = radar.map((c) => getShortLabel(c.category));
    const rawScores = radar.map((c) => c.studentScore);
    const maxScore = Math.max(...rawScores) || 1;
    const studentScores = rawScores.map((s) => (s / maxScore) * 100);

    return (
        <CardShell isExporting={isExporting} label={variant === "pi" ? "Practical" : "Creative"} cta="Find your profile">
            <p className="px-[6cqw] pt-[6cqw] text-[10cqw] font-semibold leading-[0.92] tracking-[-0.05em]">
                {variant === "pi" ? "How You Solve" : "How You Create"}
            </p>

            {/* Radar */}
            <div className="flex min-h-0 flex-1 items-center justify-center px-2">
                <RadarChart
                    categories={categories}
                    studentScores={studentScores}
                    accentColor={accentColor}
                    size={320}
                    maxValue={100}
                    gridStyle="axesOnly"
                />
            </div>
        </CardShell>
    );
}

const COMM_SECTOR_COLORS: Record<string, string> = {
    "Energy & Dynamism": "#111111",
    "Confidence & Authority": "#4a4844",
    "Warmth & Interpersonal": "#6b6963",
    "Communication Style": "#8c8a84",
    "Self-Presentation": "#b5b1a7",
};
const COMM_ACCENT = "#2dd4bf";

/** Shortened sector labels for the share card (matches main CommunicationRadarSlide) */
const COMM_SECTOR_SHORT_LABELS: Record<string, string> = {
    "Energy & Dynamism": "Energy",
    "Confidence & Authority": "Confidence",
    "Warmth & Interpersonal": "Warmth",
    "Communication Style": "Style",
    "Self-Presentation": "Presentation",
};

function CommunicationRadarShareCard({ data, isExporting }: { data: ResultsPageData; isExporting: boolean }) {
    const profile = data.communicationProfile;
    if (!profile || profile.length === 0) return null;

    const keyToIndex = new Map(profile.map((p, i) => [p.category, i]));

    const categoryNames = profile.map((p) => p.category);
    const studentScores = profile.map((p) => p.value * 100);

    const sectorGroups = Object.entries(PERSONALITY_DIMENSION_CATEGORIES).map(
        ([catName, keys]) => ({
            label: COMM_SECTOR_SHORT_LABELS[catName] ?? catName,
            color: COMM_SECTOR_COLORS[catName] ?? COMM_ACCENT,
            indices: keys
                .map((k) => keyToIndex.get(k))
                .filter((i): i is number => i !== undefined),
        })
    );

    const dotColors = profile.map((p) => {
        for (const [catName, keys] of Object.entries(PERSONALITY_DIMENSION_CATEGORIES)) {
            if (keys.includes(p.category)) {
                return COMM_SECTOR_COLORS[catName] ?? COMM_ACCENT;
            }
        }
        return COMM_ACCENT;
    });

    return (
        <CardShell isExporting={isExporting} label="Communication" cta="Find your style">
            <p className="px-[6cqw] pt-[6cqw] text-[10cqw] font-semibold leading-[0.92] tracking-[-0.05em]">
                How You Present &amp; Connect
            </p>

            {/* Radar */}
            <div className="flex min-h-0 flex-1 items-center justify-center px-2">
                <RadarChart
                    categories={categoryNames}
                    studentScores={studentScores}
                    accentColor={INK}
                    size={320}
                    maxValue={100}
                    gridStyle="axesOnly"
                    sectorGroups={sectorGroups}
                    dotColors={dotColors}
                    interactive={false}
                />
            </div>
        </CardShell>
    );
}

function ArchetypeCard({ data, isExporting }: { data: ResultsPageData, isExporting: boolean }) {
    return (
        <CardShell isExporting={isExporting} label="Profile" cta="Find your archetype">
            <div className="px-[6cqw] pt-[7cqw]">
                <p className="text-[3.6cqw] text-[#6b6963]">{data.applicant.displayName || "You"} is</p>
            </div>
            <div className="mt-auto flex flex-col px-[6cqw] pb-[7cqw]">
                <p className="flex items-center gap-[2cqw] text-[4.4cqw] font-semibold" style={{ color: VERMILION }}>
                    <span aria-hidden="true" className="inline-block h-[2.6cqw] w-[2.6cqw]" style={{ background: VERMILION }} />
                    Archetype
                </p>
                <h2 className="mt-[3cqw] text-[17cqw] font-semibold leading-[0.86] tracking-[-0.06em] [overflow-wrap:anywhere]">
                    {data.archetype.name}
                </h2>
                <p className="mt-[5cqw] border-t border-ink pt-[3cqw] text-[4.6cqw] leading-[1.35] text-[#3d3c39]">
                    &ldquo;{data.archetype.tagline}&rdquo;
                </p>
            </div>
        </CardShell>
    );
}


// ---------------------------------------------------------------------------
// Card frame — the captured node. Square, 2px ink, no tilt, sheen or shadow.
// ---------------------------------------------------------------------------

function CardFrame({
    children,
    cardRef,
}: {
    children: React.ReactNode;
    cardRef: React.RefObject<HTMLDivElement | null>;
}) {
    return (
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[min(300px,calc(55vh*0.5625))] select-none touch-manipulation md:max-w-[min(300px,calc(54vh*0.5625))]">
            <div
                ref={cardRef}
                className="absolute inset-0 overflow-hidden border-2 border-ink bg-paper"
            >
                {children}
            </div>
        </div>
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
    const [pendingShareBlob, setPendingShareBlob] = useState<Blob | null>(null);

    const printRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

    // Build available cards dynamically (memoized so useCallback deps stay stable)
    const cards = useMemo(() => {
        const result: { id: string; render: (exp: boolean) => React.ReactNode }[] = [];
        if (data.reasoningMatch?.primary) {
            result.push({
                id: "reasoning-match",
                render: (exp) => <MatchupCard data={data} matchType="reasoning" isExporting={exp} />,
            });
        }
        if (data.communicationMatch?.primary) {
            result.push({
                id: "communication-match",
                render: (exp) => <MatchupCard data={data} matchType="communication" isExporting={exp} />,
            });
        }
        if (data.piRadar.length > 0) {
            result.push({
                id: "pi-radar",
                render: (exp) => <RadarShareCard data={data} variant="pi" isExporting={exp} />,
            });
        }
        if (data.ciRadar.length > 0) {
            result.push({
                id: "ci-radar",
                render: (exp) => <RadarShareCard data={data} variant="ci" isExporting={exp} />,
            });
        }
        if (data.communicationProfile && data.communicationProfile.length > 0) {
            result.push({
                id: "communication-radar",
                render: (exp) => <CommunicationRadarShareCard data={data} isExporting={exp} />,
            });
        }
        result.push({
            id: "archetype",
            render: (exp) => <ArchetypeCard data={data} isExporting={exp} />,
        });
        return result;
    }, [data]);

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    // Pre-generate share card blob in the background
    const currentCardId = cards[currentIndex]?.id ?? "";
    const { getBlob, cachedBlob } = useShareCardCache(printRef, currentCardId, {
        enabled: true,
    });

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

    /** Try to share a blob via the native share sheet. Returns true on success. */
    const tryNativeShare = useCallback(async (blob: Blob, filename: string): Promise<boolean> => {
        if (!navigator.canShare) return false;
        const file = new File([blob], filename, { type: "image/png" });
        if (!navigator.canShare({ files: [file] })) return false;
        await navigator.share({ files: [file] });
        return true;
    }, []);

    /** Share from the preview overlay (fresh gesture) */
    const handleOverlayShare = useCallback(async () => {
        if (!pendingShareBlob) return;
        const filename = `builder-profile-${currentCardId}.png`;
        try {
            const shared = await tryNativeShare(pendingShareBlob, filename);
            if (!shared) anchorDownload(pendingShareBlob, filename);
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            anchorDownload(pendingShareBlob, filename);
        } finally {
            setPendingShareBlob(null);
        }
    }, [pendingShareBlob, currentCardId, tryNativeShare]);

    const handleDismissOverlay = useCallback(() => {
        setPendingShareBlob(null);
    }, []);

    const handleDownloadImage = useCallback(async () => {
        if (!printRef.current) return;
        const filename = `builder-profile-${cards[currentIndex].id}.png`;

        try {
            // ------- Mobile path: use native share sheet -------
            if (isMobile) {
                // Happy path: blob is pre-cached, fire share immediately (gesture preserved)
                if (cachedBlob) {
                    const shared = await tryNativeShare(cachedBlob, filename);
                    if (shared) return;
                    // canShare failed — fall through to anchor download
                    anchorDownload(cachedBlob, filename);
                    return;
                }

                // Blob not ready yet — generate on demand
                setIsExporting(true);
                const blob = await getBlob();
                setIsExporting(false);

                // Try share — may fail with NotAllowedError if gesture expired
                try {
                    const shared = await tryNativeShare(blob, filename);
                    if (shared) return;
                    anchorDownload(blob, filename);
                } catch (err) {
                    if (err instanceof Error && err.name === "AbortError") return;
                    if (err instanceof Error && err.name === "NotAllowedError") {
                        // Gesture expired — show preview overlay for a fresh tap
                        setPendingShareBlob(blob);
                        return;
                    }
                    anchorDownload(blob, filename);
                }
                return;
            }

            // ------- Desktop path: anchor download -------
            setIsExporting(true);
            const blob = await getBlob();
            anchorDownload(blob, filename);
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            console.error("Capture failed:", err);
        } finally {
            setIsExporting(false);
        }
    }, [currentIndex, cards, isMobile, cachedBlob, getBlob, tryNativeShare]);

    const showApply =
        data.applicant.assessmentType === "admissions" ||
        data.applicant.leadType === "prospective_student";

    // Track previous index so we know which card is exiting (and in which direction)
    const prevIndexRef = useRef(currentIndex);
    const prevIndex = prevIndexRef.current;
    useEffect(() => {
        prevIndexRef.current = currentIndex;
    }, [currentIndex]);

    const navBtn =
        "flex h-11 w-11 shrink-0 select-none items-center justify-center border border-ink text-ink transition-colors duration-150 hover:bg-ink hover:text-paper touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

    return (
        <section className="relative flex min-h-full flex-col items-center justify-center overflow-x-hidden px-4 pt-14 pb-24 md:h-full md:pt-16 md:pb-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="z-10 mb-4 flex w-full max-w-[300px] shrink-0 items-center justify-between gap-4"
            >
                <p className="text-sm text-[#8c8a84]">Share Your Profile</p>
                <div className="flex gap-1" aria-hidden="true">
                    {cards.map((_, i) => (
                        <div
                            key={i}
                            className={`h-[3px] w-4 transition-colors duration-200 ${i === currentIndex ? "bg-ink" : "bg-border"}`}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Carousel & Card wrapper */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                className="relative z-10 flex w-full max-w-md items-center justify-between gap-2 md:gap-4"
            >
                {/* Left Nav */}
                {cards.length > 1 && (
                    <button type="button" onClick={handlePrev} className={navBtn} aria-label="Previous card">
                        <ChevronLeft />
                    </button>
                )}

                {/* The Card */}
                <div className="flex w-full min-w-0 flex-1 justify-center">
                    <CardFrame cardRef={printRef}>
                        {cards.map((card, i) => {
                            const isActive = i === currentIndex;
                            const isExiting = i === prevIndex && prevIndex !== currentIndex;
                            const targetX = isActive ? 0 : isExiting ? -direction * 40 : direction * 40;
                            return (
                                <motion.div
                                    key={card.id}
                                    className="absolute inset-0"
                                    initial={false}
                                    animate={{
                                        opacity: isActive ? 1 : 0,
                                        x: targetX,
                                    }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                    aria-hidden={!isActive}
                                    style={{ pointerEvents: isActive ? "auto" : "none" }}
                                >
                                    {card.render(isExporting)}
                                </motion.div>
                            );
                        })}
                    </CardFrame>
                </div>

                {/* Right Nav */}
                {cards.length > 1 && (
                    <button type="button" onClick={handleNext} className={navBtn} aria-label="Next card">
                        <ChevronRight />
                    </button>
                )}
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
                className="relative z-10 mt-5 flex w-full max-w-[300px] flex-col gap-2"
            >
                {/* Save / Share */}
                <button
                    type="button"
                    onClick={handleDownloadImage}
                    disabled={isExporting}
                    className="flex min-h-12 w-full items-center justify-center gap-2 border border-ink bg-ink px-6 text-[15px] font-semibold text-paper transition-colors duration-150 hover:bg-[#2a2a2a] disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                    {isExporting ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin border-2 border-paper/30 border-t-paper" />
                            <span>Preparing image{"\u2026"}</span>
                        </span>
                    ) : isMobile ? (
                        <>
                            <ShareIcon />
                            <span>Share Image</span>
                        </>
                    ) : (
                        <>
                            <DownloadIcon />
                            <span>Save Image</span>
                        </>
                    )}
                </button>

                {/* Copy Link */}
                <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={isExporting}
                    className="flex min-h-11 w-full items-center justify-center gap-1.5 border border-ink px-6 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                    <LinkIcon />
                    {copied ? "Link Copied!" : "Copy Link to Results"}
                </button>

                {/* Apply CTA — admissions only */}
                {showApply && (
                    <>
                        <p className="mt-4 border-t border-ink pt-3 text-sm text-[#8c8a84]">What&rsquo;s next</p>
                        <a
                            href="https://www.austinchristianuniversity.org/apply"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-12 w-full items-center justify-between gap-2 border border-vermilion bg-vermilion px-5 text-[15px] font-semibold text-ink transition-colors duration-150 hover:border-[#d93d25] hover:bg-[#d93d25] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                        >
                            Apply to ACU <span aria-hidden="true">&rarr;</span>
                        </a>
                    </>
                )}
            </motion.div>

            {/* Share preview overlay — shown when gesture expired before navigator.share() */}
            <AnimatePresence>
                {pendingShareBlob && (
                    <SharePreviewOverlay
                        blob={pendingShareBlob}
                        onShare={handleOverlayShare}
                        onDismiss={handleDismissOverlay}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}

// ---------------------------------------------------------------------------
// Share Preview Overlay
// ---------------------------------------------------------------------------

function SharePreviewOverlay({
    blob,
    onShare,
    onDismiss,
}: {
    blob: Blob;
    onShare: () => void;
    onDismiss: () => void;
}) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        const url = URL.createObjectURL(blob);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- must create/revoke ObjectURL in effect for cleanup
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [blob]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/95 px-6"
            style={{ overscrollBehavior: "contain" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            {/* Preview image */}
            {objectUrl && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6 w-full max-w-[260px]"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={objectUrl}
                        alt="Your builder profile card"
                        className="w-full"
                    />
                </motion.div>
            )}

            {/* Share button — fresh gesture */}
            <button
                type="button"
                onClick={onShare}
                className="mb-3 flex min-h-12 w-full max-w-[260px] items-center justify-center gap-2 border border-vermilion bg-vermilion px-6 text-[15px] font-semibold text-ink transition-colors duration-150 hover:bg-[#d93d25]"
            >
                <ShareIcon />
                <span>Share Image</span>
            </button>

            {/* Cancel */}
            <button
                type="button"
                onClick={onDismiss}
                className="min-h-11 px-4 text-sm text-[#bdbab2] transition-colors hover:text-paper"
            >
                Cancel
            </button>
        </motion.div>
    );
}
