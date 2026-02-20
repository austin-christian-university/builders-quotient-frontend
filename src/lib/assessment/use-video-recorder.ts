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
    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
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

  return {
    start,
    stop,
    blob,
    status,
    duration,
    error,
    startTime,
  };
}
