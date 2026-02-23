"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type VideoRecorderProps = {
  stream: MediaStream | null;
  isRecording: boolean;
  duration: number;
  onStop: () => void;
  minRecordingSeconds: number;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoRecorder({
  stream,
  isRecording,
  duration,
  onStop,
  minRecordingSeconds,
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const callbackRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream) {
        el.srcObject = stream;
      }
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    },
    [stream]
  );

  const canStop = isRecording && duration >= minRecordingSeconds;

  return (
    <motion.div layoutId="camera" className="w-full">
      {/* Camera preview */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-bg-base transition-shadow duration-300",
          isRecording
            ? "border-red-500/30 ring-2 ring-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            : "border-border-glass"
        )}
      >
        <video
          ref={callbackRef}
          autoPlay
          playsInline
          muted
          className="aspect-video w-full object-cover [-webkit-transform:scaleX(-1)] [transform:scaleX(-1)]"
        />

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-sm font-medium tabular-nums text-white">
              {formatTime(duration)}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      {isRecording && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={onStop}
            disabled={!canStop}
            className="min-w-[140px]"
          >
            {canStop ? (
              "I\u2019m Done"
            ) : (
              <>
                <span className="tabular-nums">
                  {minRecordingSeconds - duration}s
                </span>{" "}
                min
              </>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
