import { createFileRoute } from "@tanstack/react-router";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { DemoNotice } from "@/components/DemoNotice";
import { DEMO_CATALOG } from "@/lib/mock-data";
import type { Algorithm } from "@/lib/types";

export const Route = createFileRoute("/recommend")({
  validateSearch: (s: Record<string, unknown>): { mode?: Algorithm | undefined; movie?: number | undefined } => ({
    mode: s["mode"] === "svd" || s["mode"] === "als" || s["mode"] === "content" ? s["mode"] : undefined,
    movie: s["movie"] != null && !Number.isNaN(Number(s["movie"])) ? Number(s["movie"]) : undefined,
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
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 md:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Algorithmic Discovery</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">AI Recommendations</h1>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          Select an algorithm tailored to your discovery intent: explicit rating prediction (SVD), implicit behavioral confidence (ALS), or content similarity (TF-IDF).
        </p>
      </div>

      <div className="mt-6">
        <DemoNotice />
      </div>

      <div className="mt-8">
        <RecommendationPanel
          key={`${mode}-${movie}`}
          initialMode={mode ?? (movie ? "content" : "svd")}
          initialMovie={initialMovie}
        />
      </div>
    </div>
  );
}
