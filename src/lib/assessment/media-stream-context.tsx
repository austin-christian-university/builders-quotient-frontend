"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useMediaStream } from "./use-media-stream";

type MediaStreamContextValue = ReturnType<typeof useMediaStream>;

const MediaStreamContext = createContext<MediaStreamContextValue | null>(null);

export function MediaStreamProvider({ children }: { children: ReactNode }) {
  const mediaStream = useMediaStream();

  // Stop all tracks on unmount (leaving assessment flow).
  // Use ref-based cleanup (not mediaStream.stop()) to avoid setting state
  // during React strict mode's simulated unmount — state updates there
  // persist and prevent re-acquisition when a vignette page mounts later.
  useEffect(() => {
    return () => {
      mediaStream.streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MediaStreamContext.Provider value={mediaStream}>
      {children}
    </MediaStreamContext.Provider>
  );
}

export function useMediaStreamContext(): MediaStreamContextValue {
  const ctx = useContext(MediaStreamContext);
  if (!ctx) {
    throw new Error(
      "useMediaStreamContext must be used within MediaStreamProvider"
    );
  }
  return ctx;
}
