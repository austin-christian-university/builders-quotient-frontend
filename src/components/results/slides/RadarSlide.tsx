"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

type ProfilePoint = { category: string; percentile: number };

type Props = {
    data: {
        pi: ProfilePoint[];
        ci: ProfilePoint[];
    };
};

export function RadarSlide({ data }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const allPoints = [...data.pi, ...data.ci];
    const numPoints = allPoints.length;
    if (!numPoints) return null;

    const size = 300;
    const center = size / 2;
    const radius = center * 0.8;

    const getCoordinatesForPercent = (percent: number, index: number) => {
        const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
        const r = radius * (percent / 100);
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    };

    const polygonPath = allPoints
        .map((p, i) => {
            const { x, y } = getCoordinatesForPercent(p.percentile, i);
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <section className="flex h-full flex-col justify-center items-center px-6 relative w-full">
            <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-text-secondary uppercase tracking-widest text-sm mb-12 font-semibold text-center"
            >
                Your Profile Shape
            </motion.p>

            <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
                {mounted ? (
                    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible drop-shadow-2xl">
                        {/* Background concentric polygons (grids) */}
                        {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => {
                            const points = allPoints.map((_, i) => {
                                const { x, y } = getCoordinatesForPercent(scale * 100, i);
                                return `${x},${y}`;
                            }).join(" ");
                            return (
                                <polygon
                                    key={scale}
                                    points={points}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="1"
                                />
                            );
                        })}

                        {/* Axes connecting center to outer edge */}
                        {allPoints.map((_, i) => {
                            const { x, y } = getCoordinatesForPercent(100, i);
                            return (
                                <line
                                    key={i}
                                    x1={center}
                                    y1={center}
                                    x2={x}
                                    y2={y}
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="1"
                                />
                            );
                        })}

                        {/* Dynamic Polygon Data Area */}
                        <motion.polygon
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.5, type: "spring", delay: 0.5 }}
                            points={polygonPath}
                            fill="url(#gradientRadar)"
                            stroke="var(--color-primary)"
                            strokeWidth="2"
                        />

                        {/* Points / Dots on the Polygon */}
                        {allPoints.map((p, i) => {
                            const { x, y } = getCoordinatesForPercent(p.percentile, i);
                            return (
                                <motion.circle
                                    key={i}
                                    cx={x}
                                    cy={y}
                                    r={4}
                                    fill="white"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 + i * 0.1 }}
                                />
                            );
                        })}

                        {/* Labels */}
                        {allPoints.map((p, i) => {
                            const { x, y } = getCoordinatesForPercent(115, i);
                            return (
                                <motion.text
                                    key={i}
                                    x={x}
                                    y={y}
                                    fill="rgba(255,255,255,0.7)"
                                    fontSize="10"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5 }}
                                    className="uppercase font-medium tracking-wider"
                                >
                                    {p.category.split(' ').map((word, idx) => (
                                        <tspan key={idx} x={x} dy={idx === 0 ? 0 : 12}>{word}</tspan>
                                    ))}
                                </motion.text>
                            );
                        })}

                        <defs>
                            <linearGradient id="gradientRadar" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.2" />
                            </linearGradient>
                        </defs>
                    </svg>
                ) : null}
            </div>
        </section>
    );
}
