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
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-tight text-text-primary">
          Vignette Review
        </h1>
        <p className="mt-2 text-[length:var(--text-fluid-sm)] text-text-secondary">
          {pi.length} practical and {ci.length} creative vignettes
        </p>
      </header>

      <VignetteReviewFilters pi={pi} ci={ci} />
    </main>
  );
}
