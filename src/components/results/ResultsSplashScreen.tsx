"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

type Props = {
  onComplete: () => void;
};

export function ResultsSplashScreen({ onComplete }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const duration = prefersReducedMotion ? 500 : 4000;
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          key="results-splash"
          initial={{ opacity: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.02, filter: "blur(6px)" }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0.15 }
              : { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
          }
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-base overflow-hidden"
          role="status"
          aria-label="Preparing your results"
        >
          {/* Background glow */}
          {!prefersReducedMotion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.15, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(255_255_255),transparent_50%)]"
            />
          )}

          {prefersReducedMotion ? (
            <div className="flex flex-col items-center gap-8">
              <div className="relative h-[160px] w-[160px] sm:h-[200px] sm:w-[200px]">
                <Image
                  src="/White-Crest.png"
                  alt="Austin Christian University Crest"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <p className="font-display text-lg tracking-tight text-text-secondary">
                Preparing your builder&rsquo;s quotient&hellip;
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8">
              {/* Logo reveal */}
              <motion.div
                initial={{
                  clipPath: "inset(100% 0 0 0)",
                  filter: "brightness(0) blur(4px)",
                  scale: 0.95,
                  opacity: 0,
                }}
                animate={{
                  clipPath: "inset(0% 0 0 0)",
                  filter: [
                    "brightness(2) blur(2px)",
                    "brightness(1) blur(0px)",
                  ],
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 2,
                  ease: [0.16, 1, 0.3, 1],
                  filter: { duration: 1.5, delay: 0.5 },
                  scale: { duration: 2, ease: "easeOut" },
                  opacity: { duration: 0.2 },
                }}
                className="relative h-[160px] w-[160px] sm:h-[200px] sm:w-[200px]"
              >
                <Image
                  src="/White-Crest.png"
                  alt="Austin Christian University Crest"
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>

              {/* Text fade-in after logo settles */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 1.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="font-display text-lg tracking-tight text-text-secondary sm:text-xl"
              >
                Preparing your builder&rsquo;s quotient&hellip;
              </motion.p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
