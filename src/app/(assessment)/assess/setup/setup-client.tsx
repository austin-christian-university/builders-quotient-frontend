"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MobileWarningDialog } from "@/components/assessment/MobileWarningDialog";
import { isMobileDevice } from "@/lib/assessment/detect-mobile";
import { useConnectionProbe, type SpeedTier } from "@/lib/assessment/use-connection-probe";
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
  const router = useRouter();

  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<DeviceStatus>("pending");
  const [micStatus, setMicStatus] = useState<DeviceStatus>("pending");
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  // null = check hasn't run yet, true/false = result of mobile detection
  const [showMobileWarning, setShowMobileWarning] = useState<boolean | null>(
    null
  );
  const { result: probeResult, runProbe } = useConnectionProbe();

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

        // Run connection probe once camera+mic are granted
        if (hasVideo && hasAudio) {
          runProbe();
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function handleStart() {
    if (!biometricConsent) {
      setBiometricError("Please accept to continue");
      document.getElementById("biometric-consent")?.focus();
      return;
    }
    router.push("/assess/warmup");
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
                aria-label="Camera preview"
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

          {/* Connection speed warning */}
          {probeResult && (probeResult.tier === "slow" || probeResult.tier === "very-slow") && (
            <ConnectionWarning tier={probeResult.tier} />
          )}

          {/* Biometric consent */}
          <div className="rounded-xl border border-accent-gold/20 bg-accent-gold/5 px-4 py-4">
            <label
              htmlFor="biometric-consent"
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id="biometric-consent"
                type="checkbox"
                checked={biometricConsent}
                onChange={(e) => {
                  setBiometricConsent(e.target.checked);
                  setBiometricError(null);
                }}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded border border-text-secondary/40 bg-transparent transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none"
                style={{
                  backgroundImage: biometricConsent
                    ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='%230a0a0c' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E")`
                    : "none",
                  backgroundSize: "100% 100%",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />
              <span className="text-[length:var(--text-fluid-sm)] text-text-secondary leading-snug">
                I consent to video and audio recording, including biometric data collection, during this assessment.{" "}
                <a
                  href="/biometric-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  Learn more
                </a>
              </span>
            </label>
            {biometricError && (
              <p role="alert" className="mt-2 text-[length:var(--text-fluid-sm)] text-red-300">
                {biometricError}
              </p>
            )}
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
            <p className="text-[length:var(--text-fluid-sm)] text-text-secondary">
              Please allow camera and microphone access in your browser settings,
              then{" "}
              <button
                type="button"
                onClick={retryPermissions}
                className="underline underline-offset-2 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base rounded"
              >
                try again
              </button>
              .
            </p>
          )}

          {/* Start button */}
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!isReady}
            onClick={handleStart}
          >
            I&rsquo;m Ready
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

function ConnectionWarning({ tier }: { tier: SpeedTier }) {
  const isVerySlow = tier === "very-slow";

  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-[length:var(--text-fluid-sm)] ${
        isVerySlow
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
      }`}
    >
      {isVerySlow
        ? "Slow connection detected. Consider switching to a faster network for the best experience."
        : "Your connection is a bit slow. Videos will upload in the background \u2014 just don\u2019t close your browser."}
    </div>
  );
}

