"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RadarChart } from "@/components/results/RadarChart";
import { getShortLabel } from "@/components/results/short-labels";

interface EntrepreneurCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entrepreneur: {
    entrepreneurName: string;
    bioSnippet: string | null;
    companies: string[];
    industries: string[];
    categoryScores: { category: string; score: number }[];
  };
  studentCategoryScores: { category: string; score: number }[];
  accentColor: string;
  categories: string[];
}

export function EntrepreneurCardModal({
  isOpen,
  onClose,
  entrepreneur,
  studentCategoryScores,
  accentColor,
  categories,
}: EntrepreneurCardModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Move focus into dialog when it opens
  useEffect(() => {
    if (isOpen) {
      // Defer so AnimatePresence has time to mount the element
      const id = requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  // Build aligned score arrays in category order
  const radarCategories = categories.map(getShortLabel);

  const studentScores = categories.map((cat) => {
    const match = studentCategoryScores.find((s) => s.category === cat);
    return match?.score ?? 0;
  });

  const entrepreneurScores = categories.map((cat) => {
    const match = entrepreneur.categoryScores.find((s) => s.category === cat);
    return match?.score ?? 0;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        // Backdrop
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overscroll-contain"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={(e) => {
            // Close when clicking the backdrop, not the card
            if (e.target === e.currentTarget) onClose();
          }}
          aria-hidden="false"
        >
          {/* Dialog card */}
          <motion.div
            ref={dialogRef}
            key="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${entrepreneur.entrepreneurName}`}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl"
            style={{
              background: "rgba(17,17,19,0.92)",
              borderColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(24px)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Inner accent glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at top left, ${accentColor}18 0%, transparent 60%)`,
              }}
            />

            {/* Close button */}
            <button
              ref={closeBtnRef}
              onClick={onClose}
              aria-label="Close entrepreneur details"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "#9aa0ac",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(255,255,255,0.06)";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Card content */}
            <div className="relative z-10 p-6 pb-8">
              {/* Name */}
              <h2
                className="mb-1 pr-10 text-xl font-bold leading-snug"
                style={{
                  color: "#f5f6fa",
                  fontFamily: "'Inter Tight', Inter, sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                {entrepreneur.entrepreneurName}
              </h2>

              {/* Bio */}
              {entrepreneur.bioSnippet && (
                <p
                  className="mb-4 text-sm leading-relaxed"
                  style={{ color: "rgba(245,246,250,0.65)" }}
                >
                  {entrepreneur.bioSnippet}
                </p>
              )}

              {/* Company pills */}
              {entrepreneur.companies.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {entrepreneur.companies.slice(0, 5).map((company) => (
                    <span
                      key={company}
                      className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        borderColor: `${accentColor}40`,
                        backgroundColor: `${accentColor}12`,
                        color: accentColor,
                      }}
                    >
                      {company}
                    </span>
                  ))}
                </div>
              )}

              {/* Industry pills */}
              {entrepreneur.industries.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {entrepreneur.industries.slice(0, 4).map((industry) => (
                    <span
                      key={industry}
                      className="rounded-full border px-2.5 py-0.5 text-xs"
                      style={{
                        borderColor: "rgba(255,255,255,0.1)",
                        backgroundColor: "rgba(255,255,255,0.04)",
                        color: "#9aa0ac",
                      }}
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              )}

              {/* Radar chart — dual overlay */}
              <div className="mb-4">
                <RadarChart
                  categories={radarCategories}
                  studentScores={studentScores}
                  corpusScores={entrepreneurScores}
                  accentColor={accentColor}
                />
              </div>

              {/* Chart legend */}
              <div
                className="flex items-center justify-center gap-5"
                aria-label="Chart legend"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: accentColor }}
                    aria-hidden="true"
                  />
                  <span className="text-xs" style={{ color: "#9aa0ac" }}>
                    Your Profile
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full border"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.3)",
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-xs" style={{ color: "#9aa0ac" }}>
                    {entrepreneur.entrepreneurName}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
