"use client";

import { useCallback, useRef, useState } from "react";

type RecorderStatus = "idle" | "recording" | "stopping" | "done" | "error";

function getPreferredMimeType(): string {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function useVideoRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [startTime, setStartTime] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>("");

  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    if (!stream) {
      setError("No media stream available");
      setStatus("error");
      return;
    }

    chunksRef.current = [];
    setBlob(null);
    setDuration(0);
    setError(null);

    const mimeType = getPreferredMimeType();
    mimeTypeRef.current = mimeType;
    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 1_500_000, // 1.5 Mbps — 3 min ≈ 34 MB
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        const finalBlob = new Blob(chunksRef.current, {
          type: mimeType || "video/webm",
        });
        setBlob(finalBlob);
        setStatus("done");
      };

      recorder.onerror = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Still try to assemble what we have
        if (chunksRef.current.length > 0) {
          const partialBlob = new Blob(chunksRef.current, {
            type: mimeType || "video/webm",
          });
          setBlob(partialBlob);
        }
        setError("Recording error occurred");
        setStatus("error");
      };

      recorder.start(1000); // 1-second chunks
      recorderRef.current = recorder;
      setStartTime(new Date().toISOString());
      setStatus("recording");

      // Duration timer
      const startMs = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startMs) / 1000));
      }, 1000);
    } catch {
      setError("Failed to start recording");
      setStatus("error");
    }
  }, [stream]);

  const stop = useCallback(() => {
    if (
      recorderRef.current &&
      recorderRef.current.state !== "inactive"
    ) {
      setStatus("stopping");
      recorderRef.current.stop();
    }
  }, []);

  /**
   * Clip: stops the current recording, assembles the blob, resets to idle
   * so `start()` can be called again for a second recording.
   * Returns the blob via a Promise (resolves when onstop fires).
   */
  const clip = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      // Override onstop for this clip operation
      const mimeType = mimeTypeRef.current;
      recorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        const clippedBlob = new Blob(chunksRef.current, {
          type: mimeType || "video/webm",
        });

        // Reset state for reuse (don't set blob/done — that's for final stop)
        chunksRef.current = [];
        recorderRef.current = null;
        setStatus("idle");
        setDuration(0);

        resolve(clippedBlob);
      };

      recorder.stop();
    });
  }, []);

  return {
    start,
    stop,
    clip,
    blob,
    status,
    duration,
    error,
    startTime,
  };
}
