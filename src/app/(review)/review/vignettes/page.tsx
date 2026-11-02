import { notFound } from "next/navigation";
import { isReviewAuthenticated } from "@/lib/actions/review-auth";
import { getAllVignettesForReview } from "@/lib/queries/vignettes";
import { ReviewPasswordGate } from "@/components/review/ReviewPasswordGate";
import { VignetteReviewFilters } from "@/components/review/VignetteReviewFilters";

export const metadata = {
  title: "Vignette Review — BQ",
  robots: { index: false, follow: false },
};

export default async function VignetteReviewPage() {
  if (!process.env.REVIEW_PASSWORD) {
    notFound();
  }

  const authenticated = await isReviewAuthenticated();

  if (!authenticated) {
    return <ReviewPasswordGate />;
  }

  const { pi, ci } = await getAllVignettesForReview();

  return (
    <main className="mx-auto max-w-[1240px] px-[clamp(20px,4vw,48px)] pt-[clamp(40px,6vw,80px)] pb-[clamp(64px,9vw,112px)]">
      <header className="mb-[clamp(32px,5vw,56px)] border-t border-ink pt-6">
        <h1 className="max-w-[14ch] font-display text-[clamp(36px,6vw,80px)] font-semibold leading-[0.92] tracking-[-0.05em] text-ink">
          Vignette Review
        </h1>
        <p className="mt-4 text-sm tabular-nums text-text-secondary">
          {pi.length} practical and {ci.length} creative vignettes
        </p>
      </header>

      <VignetteReviewFilters pi={pi} ci={ci} />
    </main>
  );
}
