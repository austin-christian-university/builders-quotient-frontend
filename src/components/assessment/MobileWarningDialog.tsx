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
      className="m-auto w-[calc(100%-32px)] max-w-md border border-ink bg-bg-elevated p-0 text-ink backdrop:bg-ink/60"
    >
      <div className="relative px-6 py-8 text-left">
        {/* Close — navigates home */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-text-secondary transition-colors hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
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
        <div className="mb-5 flex h-12 w-12 items-center justify-center border border-ink">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        </div>

        <h2 className="pr-10 font-display text-[28px] font-semibold leading-[1] tracking-[-0.04em] text-ink">
          Desktop Recommended
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#3d3c39]">
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

        <p className="mt-4 text-sm text-text-secondary">
          For the best experience, visit{" "}
          <span className="font-medium text-ink">bq.austinchristianu.org</span> on a
          desktop
        </p>
      </div>
    </dialog>
  );
}
