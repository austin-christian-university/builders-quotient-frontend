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
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="font-display text-[length:var(--text-fluid-xl)] font-semibold tracking-tight text-text-primary">
          Vignette Review
        </h1>
        <p className="text-[length:var(--text-fluid-sm)] text-text-secondary">
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
          <p id="review-error" className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
