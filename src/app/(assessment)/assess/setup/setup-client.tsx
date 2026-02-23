"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MobileWarningDialog } from "@/components/assessment/MobileWarningDialog";
import { isMobileDevice } from "@/lib/assessment/detect-mobile";
import { createAssessmentSession } from "@/lib/actions/session";
import dynamic from "next/dynamic";

const DevSkipButton =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@/components/assessment/DevSkipButton").then((m) => ({
            default: m.DevSkipButton,
          })),
        { ssr: false }
      )
    : null;

type DeviceStatus = "pending" | "granted" | "denied" | "error";

function resolveDeviceError(err: unknown): DeviceStatus {
  const name = err instanceof DOMException ? err.name : "";
  return name === "NotAllowedError" ? "denied" : "error";
}

export function SetupClient() {
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<DeviceStatus>("pending");
  const [micStatus, setMicStatus] = useState<DeviceStatus>("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // null = check hasn't run yet, true/false = result of mobile detection
  const [showMobileWarning, setShowMobileWarning] = useState<boolean | null>(
    null
  );

  // Callback ref: attaches stream to <video> when it mounts into the DOM
  const videoCallbackRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && streamRef.current) {
        el.srcObject = streamRef.current;
      }
    },
    // Re-run when cameraStatus flips to "granted" (video element appears)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cameraStatus]
  );

  // Detect mobile devices after mount to avoid hydration mismatch
  useEffect(() => {
    const dismissed = sessionStorage.getItem("bq:mobile-warning-dismissed");
    setShowMobileWarning(!dismissed && isMobileDevice());
  }, []);

  // Request camera/mic only after mobile check completes and warning is dismissed
  useEffect(() => {
    // Wait for mobile check to finish; stay gated while warning is showing
    if (showMobileWarning !== false) return;

    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setMicStatus("error");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;

        setCameraStatus(hasVideo ? "granted" : "denied");
        setMicStatus(hasAudio ? "granted" : "denied");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = resolveDeviceError(err);
        setCameraStatus(status);
        setMicStatus(status);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [showMobileWarning]);

  async function retryPermissions() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setMicStatus("error");
      return;
    }

    setCameraStatus("pending");
    setMicStatus("pending");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;

      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;

      setCameraStatus(hasVideo ? "granted" : "denied");
      setMicStatus(hasAudio ? "granted" : "denied");
    } catch (err) {
      const status = resolveDeviceError(err);
      setCameraStatus(status);
      setMicStatus(status);
    }
  }

  function dismissMobileWarning() {
    sessionStorage.setItem("bq:mobile-warning-dismissed", "1");
    setShowMobileWarning(false);
  }

  const isReady = cameraStatus === "granted" && micStatus === "granted";

  async function handleStart() {
    setIsSubmitting(true);
    await createAssessmentSession();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <MobileWarningDialog
        open={showMobileWarning === true}
        onDismiss={dismissMobileWarning}
      />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
            Before We Begin
          </p>
          <h1 className="mt-2 font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em]">
            Equipment Check
          </h1>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Camera preview */}
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border-glass bg-bg-base">
            {cameraStatus === "granted" ? (
              <video
                ref={videoCallbackRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover [-webkit-transform:scaleX(-1)] [transform:scaleX(-1)]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-text-secondary">
                {cameraStatus === "pending" && "Requesting camera access\u2026"}
                {cameraStatus === "denied" && "Camera access was denied"}
                {cameraStatus === "error" && "Camera not available"}
              </div>
            )}
          </div>

          {/* Device status indicators */}
          <div className="flex gap-4">
            <StatusIndicator label="Camera" status={cameraStatus} />
            <StatusIndicator label="Microphone" status={micStatus} />
          </div>

          {/* Requirements */}
          <ul className="space-y-2 text-[length:var(--text-fluid-sm)] text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              Find a quiet space with good lighting
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              The assessment takes about 20&nbsp;minutes
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              Your responses are recorded via webcam
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary" aria-hidden="true">
                &bull;
              </span>
              You cannot retake individual sections
            </li>
          </ul>

          {/* Denied state — retry button */}
          {(cameraStatus === "denied" || micStatus === "denied") && (
            <p className="text-[length:var(--text-fluid-sm)] text-secondary">
              Please allow camera and microphone access in your browser settings,
              then{" "}
              <button
                type="button"
                onClick={retryPermissions}
                className="underline underline-offset-2 hover:text-secondary-hover"
              >
                try again
              </button>
              .
            </p>
          )}

          {/* Start button */}
          <Button
            size="lg"
            className="w-full"
            disabled={!isReady || isSubmitting}
            onClick={handleStart}
          >
            {isSubmitting ? (
              <>
                <Spinner />
                I&rsquo;m Ready
              </>
            ) : (
              "I\u2019m Ready"
            )}
          </Button>

          {DevSkipButton && (
            <div className="mt-3 flex justify-center">
              <DevSkipButton />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusIndicator({
  label,
  status,
}: {
  label: string;
  status: DeviceStatus;
}) {
  const colors: Record<DeviceStatus, string> = {
    pending: "bg-text-secondary/40",
    granted: "bg-emerald-400",
    denied: "bg-red-400",
    error: "bg-red-400",
  };

  const labels: Record<DeviceStatus, string> = {
    pending: "Checking\u2026",
    granted: "Ready",
    denied: "Denied",
    error: "Unavailable",
  };

  return (
    <div className="flex items-center gap-2 text-[length:var(--text-fluid-sm)]">
      <span
        className={`inline-block h-2 w-2 rounded-full ${colors[status]}`}
        aria-hidden="true"
      />
      <span className="text-text-secondary">
        {label}: <span className="text-text-primary">{labels[status]}</span>
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
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
