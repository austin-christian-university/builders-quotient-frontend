"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // The total animation takes about 2.5-3 seconds.
        // Unmount after that time so the user can interact with the page.
        const timer = setTimeout(() => {
            setIsVisible(false);
            onComplete();
        }, 3500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-base overflow-hidden"
                >
                    {/* Subtle background glow */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.15, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(255_255_255),transparent_50%)]"
                    />

                    <motion.div
                        // Initial state: hidden by clipPath (wipe from bottom)
                        initial={{
                            clipPath: "inset(100% 0 0 0)",
                            filter: "brightness(0) blur(4px)",
                            scale: 0.95,
                            opacity: 0
                        }}
                        animate={{
                            clipPath: "inset(0% 0 0 0)",
                            filter: ["brightness(2) blur(2px)", "brightness(1) blur(0px)"],
                            scale: 1,
                            opacity: 1
                        }}
                        transition={{
                            duration: 2,
                            ease: [0.16, 1, 0.3, 1], // easeOutExpo
                            filter: { duration: 1.5, delay: 0.5 },
                            scale: { duration: 2, ease: "easeOut" },
                            opacity: { duration: 0.2 }
                        }}
                        className="relative h-[200px] w-[200px] sm:h-[240px] sm:w-[240px]"
                    >
                        <Image
                            src="/White-Crest.png"
                            alt="Austin Christian University Crest"
                            fill
                            className="object-contain"
                            priority
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
