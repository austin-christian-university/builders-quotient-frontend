"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useMediaStream } from "./use-media-stream";

type MediaStreamContextValue = ReturnType<typeof useMediaStream>;

const MediaStreamContext = createContext<MediaStreamContextValue | null>(null);

export function MediaStreamProvider({ children }: { children: ReactNode }) {
  const mediaStream = useMediaStream();

  // Stop all tracks on unmount (leaving assessment flow)
  useEffect(() => {
    return () => {
      mediaStream.stop();
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
