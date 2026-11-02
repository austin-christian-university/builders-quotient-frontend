"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifyReviewPassword } from "@/lib/actions/review-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ReviewPasswordGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await verifyReviewPassword(password);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Authentication failed.");
      }
    });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-base px-[clamp(20px,4vw,48px)]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 border-t border-ink pt-6"
      >
        <h1 className="font-display text-[clamp(32px,5vw,44px)] font-semibold leading-[0.95] tracking-[-0.045em] text-ink">
          Vignette Review
        </h1>
        <p className="text-sm text-text-secondary">
          Enter the review password to continue.
        </p>

        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password…"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "review-error" : undefined}
          disabled={isPending}
        />

        {error && (
          <p id="review-error" className="text-sm font-medium text-vermilion" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin border-2 border-current border-t-transparent" />
              Verifying
            </>
          ) : (
            "Enter"
          )}
        </Button>
      </form>
    </div>
  );
}
