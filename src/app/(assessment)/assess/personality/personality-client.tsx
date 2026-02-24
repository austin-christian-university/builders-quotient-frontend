"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { PersonalityProgress } from "@/components/assessment/PersonalityProgress";
import { PersonalityQuizPage } from "@/components/assessment/PersonalityQuizPage";
import {
  PERSONALITY_ITEMS,
  QUESTIONS_PER_PAGE,
  TOTAL_PERSONALITY_ITEMS,
  type LikertValue,
} from "@/lib/assessment/personality-bank";
import {
  mulberry32,
  hashString,
  createMixedItemOrder,
  toPages,
} from "@/lib/assessment/personality-shuffle";
import {
  savePersonalityPage,
  submitPersonalityQuiz,
} from "@/lib/actions/personality";

const PersonalityDevToolbar =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@/components/assessment/PersonalityDevToolbar").then((m) => ({
            default: m.PersonalityDevToolbar,
          })),
        { ssr: false }
      )
    : null;

// --- Component ---

type PersonalityClientProps = {
  sessionId: string;
  existingResponses: Record<string, LikertValue>;
};

export function PersonalityClient({
  sessionId,
  existingResponses,
}: PersonalityClientProps) {
  const router = useRouter();
  const [responses, setResponses] =
    useState<Record<string, LikertValue>>(existingResponses);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasUnsavedChanges = useRef(false);

  // Deterministic item order seeded from sessionId
  const pages = useMemo(() => {
    const random = mulberry32(hashString(sessionId));
    const mixed = createMixedItemOrder(PERSONALITY_ITEMS, random);
    return toPages(mixed);
  }, [sessionId]);

  const totalPages = pages.length;
  const currentItems = pages[currentPage] ?? [];
  const answeredCount = Object.keys(responses).length;
  const isLastPage = currentPage === totalPages - 1;

  // Resume to furthest unanswered page
  useEffect(() => {
    if (Object.keys(existingResponses).length === 0) return;
    for (let p = 0; p < pages.length; p++) {
      const pageItems = pages[p];
      const allAnswered = pageItems.every((item) => existingResponses[item.id]);
      if (!allAnswered) {
        setCurrentPage(p);
        return;
      }
    }
    // All answered — go to last page for submission
    setCurrentPage(pages.length - 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn on unsaved changes before navigation
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleResponse = useCallback(
    (itemId: string, value: LikertValue) => {
      setResponses((prev) => ({ ...prev, [itemId]: value }));
      hasUnsavedChanges.current = true;
      setError(null);
    },
    []
  );

  const setResponsesBatch = useCallback(
    (batch: Record<string, LikertValue>) => {
      setResponses(batch);
      hasUnsavedChanges.current = true;
      setError(null);
    },
    []
  );

  const saveCurrentPage = useCallback(async () => {
    const items = pages[currentPage];
    const answeredItems = items.filter((item) => responses[item.id]);
    if (answeredItems.length === 0) return true;

    setIsSaving(true);
    setError(null);

    const result = await savePersonalityPage({
      sessionId,
      responses: answeredItems.map((item) => ({
        itemId: item.id,
        facet: item.facet,
        value: responses[item.id],
        reverse: item.reverse,
      })),
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error ?? "Failed to save responses");
      return false;
    }

    hasUnsavedChanges.current = false;
    return true;
  }, [currentPage, pages, responses, sessionId]);

  const handleNext = useCallback(async () => {
    // Validate all items on current page are answered
    const unanswered = currentItems.filter((item) => !responses[item.id]);
    if (unanswered.length > 0) {
      setError("Please answer all questions before continuing.");
      return;
    }

    const saved = await saveCurrentPage();
    if (!saved) return;

    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentItems, responses, saveCurrentPage, currentPage, totalPages]);

  const handlePrevious = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const handleSubmit = useCallback(async () => {
    // Validate all items answered
    if (answeredCount < TOTAL_PERSONALITY_ITEMS) {
      setError(
        `Please answer all questions. ${TOTAL_PERSONALITY_ITEMS - answeredCount} remaining.`
      );
      return;
    }

    // Save current page first
    const saved = await saveCurrentPage();
    if (!saved) return;

    setIsSubmitting(true);
    setError(null);

    const result = await submitPersonalityQuiz({ sessionId });

    if (!result.success) {
      setIsSubmitting(false);
      setError(result.error ?? "Failed to submit quiz");
      return;
    }

    hasUnsavedChanges.current = false;
    router.push("/assess/personality/complete");
  }, [answeredCount, saveCurrentPage, sessionId, router]);

  const pageAllAnswered = currentItems.every((item) => responses[item.id]);

  return (
    <div className="flex min-h-dvh flex-col">
      <PersonalityProgress
        answeredCount={answeredCount}
        totalItems={TOTAL_PERSONALITY_ITEMS}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      <div className="flex flex-1 items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Page heading */}
          <div className="mb-6 text-center">
            <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-secondary">
              Personality Profile
            </p>
            <h1 className="mt-1 font-display text-[length:var(--text-fluid-xl)] font-bold tracking-[-0.01em]">
              How well does each statement describe&nbsp;you?
            </h1>
            <p className="mt-2 text-[length:var(--text-fluid-sm)] text-text-secondary">
              Press 1&ndash;5 on your keyboard for quick answers
            </p>
          </div>

          {/* Questions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <PersonalityQuizPage
                items={currentItems}
                responses={responses}
                onResponse={handleResponse}
                pageOffset={currentPage * QUESTIONS_PER_PAGE}
              />
            </motion.div>
          </AnimatePresence>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center text-sm text-red-400"
              role="alert"
            >
              {error}
            </motion.p>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              size="md"
              onClick={handlePrevious}
              disabled={currentPage === 0 || isSaving || isSubmitting}
            >
              Back
            </Button>

            {isLastPage ? (
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  isSaving ||
                  answeredCount < TOTAL_PERSONALITY_ITEMS
                }
              >
                {isSubmitting ? (
                  <>
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
                    Submitting
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!pageAllAnswered || isSaving}
              >
                {isSaving ? (
                  <>
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
                    Saving
                  </>
                ) : (
                  "Next"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {PersonalityDevToolbar && (
        <PersonalityDevToolbar
          sessionId={sessionId}
          responses={responses}
          setResponses={setResponsesBatch}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          pages={pages}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
