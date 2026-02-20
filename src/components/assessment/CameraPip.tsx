"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";

type CameraPipProps = {
  stream: MediaStream | null;
};

export function CameraPip({ stream }: CameraPipProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
      layoutId="camera"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 right-6 z-50 h-24 w-24 overflow-hidden rounded-full ring-1 ring-white/10 shadow-2xl"
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
