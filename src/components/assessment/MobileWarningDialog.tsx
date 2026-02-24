"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MobileWarningDialog({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      className="m-auto max-w-md rounded-2xl border border-border-glass bg-bg-elevated/60 p-0 backdrop-blur-xl shadow-[0_8px_32px_rgb(0_0_0/0.3),0_2px_8px_rgb(0_0_0/0.2)] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative px-6 py-8 text-center">
        {/* Close — navigates home */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
          aria-label="Go back to home"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 4L4 12M4 4l8 8" />
          </svg>
        </button>

        {/* Monitor icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-secondary"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        </div>

        <h2 className="font-display text-[length:var(--text-fluid-xl)] font-bold tracking-[-0.01em] text-text-primary">
          Desktop Recommended
        </h2>

        <p className="mt-3 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
          This assessment requires webcam recording and works best on a larger
          screen. Sections cannot be retaken, so we recommend using a desktop or
          laptop for the best experience.
        </p>

        <Button
          variant="outline"
          size="lg"
          className="mt-6 w-full"
          onClick={onDismiss}
        >
          Continue Anyway
        </Button>

        <p className="mt-4 text-[length:var(--text-fluid-xs)] text-text-secondary">
          For the best experience, visit{" "}
          <span className="text-primary">bq.austinchristianu.org</span> on a
          desktop
        </p>
      </div>
    </dialog>
  );
}
