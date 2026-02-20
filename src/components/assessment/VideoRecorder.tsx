"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type VideoRecorderProps = {
  stream: MediaStream | null;
  isRecording: boolean;
  isUploading: boolean;
  duration: number;
  uploadProgress: number;
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
  isUploading,
  duration,
  uploadProgress,
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
    <div className="mx-auto w-full max-w-md">
      {/* Camera preview */}
      <div className="relative overflow-hidden rounded-2xl border border-border-glass bg-bg-base">
        <video
          ref={callbackRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "aspect-video w-full object-cover [-webkit-transform:scaleX(-1)] [transform:scaleX(-1)]",
            isUploading && "brightness-50"
          )}
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

        {/* Upload overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <UploadSpinner />
            <span className="text-sm font-medium text-white">
              Uploading{" "}
              <span className="tabular-nums">{Math.round(uploadProgress)}%</span>
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
    </div>
  );
}

function UploadSpinner() {
  return (
    <svg
      className="h-8 w-8 animate-spin text-white"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
