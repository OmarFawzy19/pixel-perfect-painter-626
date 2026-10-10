import { createFileRoute } from "@tanstack/react-router";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { DemoNotice } from "@/components/DemoNotice";
import { DEMO_CATALOG } from "@/lib/mock-data";
import type { Algorithm } from "@/lib/types";

export const Route = createFileRoute("/recommend")({
  validateSearch: (s: Record<string, unknown>): { mode?: Algorithm; movie?: number } => ({
    mode: s.mode === "svd" || s.mode === "als" || s.mode === "content" ? s.mode : undefined,
    movie: s.movie != null && !Number.isNaN(Number(s.movie)) ? Number(s.movie) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Recommendations — CineMatch AI" },
      { name: "description", content: "Get personalized (SVD), behavioral (ALS) or similar-movie (content-based) recommendations." },
      { property: "og:title", content: "AI Recommendations — CineMatch AI" },
      { property: "og:description", content: "Three recommendation algorithms, one place." },
    ],
  }),
  component: RecommendPage,
});

function RecommendPage() {
  const { mode, movie } = Route.useSearch();
  const initialMovie = movie ? DEMO_CATALOG.find((m) => m.id === movie) ?? null : null;
  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 md:px-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">AI Recommendations</p>
      <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">Choose your algorithm</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Three models, three ways to find your next movie.</p>
      <div className="mt-6"><DemoNotice /></div>
      <div className="mt-8">
        <RecommendationPanel key={`${mode}-${movie}`} initialMode={mode ?? (movie ? "content" : "svd")} initialMovie={initialMovie} />
      </div>
    </div>
  );
}
