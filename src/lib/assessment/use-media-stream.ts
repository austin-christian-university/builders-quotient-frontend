"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StreamStatus = "idle" | "acquiring" | "active" | "error" | "stopped";

export function useMediaStream() {
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const acquire = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setError("Media devices not supported");
      return;
    }

    setStatus("acquiring");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      });

      // Stop any previous stream
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      setStatus("active");

      // Monitor track ended events (camera disconnection)
      const onEnded = () => {
        setStatus("error");
        setError("Camera or microphone disconnected");
      };
      stream.getTracks().forEach((track) => {
        track.addEventListener("ended", onEnded);
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setStatus("error");
      setError(
        name === "NotAllowedError"
          ? "Camera access denied"
          : "Failed to access camera"
      );
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus("stopped");
  }, []);

  // Acquire on mount, stop on unmount
  useEffect(() => {
    acquire();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stream: streamRef.current,
    streamRef,
    status,
    error,
    retry: acquire,
    stop,
  };
}
