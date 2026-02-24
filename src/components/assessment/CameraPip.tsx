"use client";

import { useCallback, useRef } from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

type CameraPipProps = {
  stream: MediaStream | null;
};

export function CameraPip({ stream }: CameraPipProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const callbackRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream) {
        el.srcObject = stream;
      }
      videoRef.current = el;
    },
    [stream]
  );

  if (!stream) return null;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 right-6 z-50 h-24 w-24 overflow-hidden rounded-full ring-1 ring-white/10 shadow-2xl"
      aria-hidden="true"
    >
      <video
        ref={callbackRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover [-webkit-transform:scaleX(-1)] [transform:scaleX(-1)]"
      />
    </motion.div>
  );
}
