import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import type { Algorithm, Movie } from "@/lib/types";

export const Route = createFileRoute("/recommend")({
  validateSearch: (s: Record<string, unknown>): { mode?: Algorithm; movie?: number } => ({
    mode: s["mode"] === "svd" || s["mode"] === "als" || s["mode"] === "content" ? s["mode"] : undefined,
    movie: s["movie"] != null && Number.isInteger(Number(s["movie"])) && Number(s["movie"]) > 0
      ? Number(s["movie"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Recommendations — CineMatch AI" },
      { name: "description", content: "Get real SVD or content-based movie recommendations." },
      { property: "og:title", content: "AI Recommendations — CineMatch AI" },
      { property: "og:description", content: "Discover movies with trained recommendation models." },
    ],
  }),
  component: RecommendPage,
});

function RecommendPage() {
  const { mode, movie: movieId } = Route.useSearch();
  const [initialMovie, setInitialMovie] = useState<Movie | null>(null);
  const [movieLoading, setMovieLoading] = useState(false);

  useEffect(() => {
    setInitialMovie(null);
    setMovieLoading(Boolean(movieId));
    if (!movieId) return;
    const base = (import.meta.env.VITE_MOVIES_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
    if (!base) { setMovieLoading(false); return; }
    const controller = new AbortController();
    fetch(`${base}/api/movies/${movieId}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("Movie not found"); return r.json() as Promise<Movie>; })
      .then((movie) => { setInitialMovie(movie); setMovieLoading(false); })
      .catch((err) => { if (err.name !== "AbortError") { console.error("Could not load initial movie", err); setMovieLoading(false); } });
    return () => controller.abort();
  }, [movieId]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 md:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Algorithmic Discovery</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">AI Recommendations</h1>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          Select an algorithm tailored to your discovery intent: explicit rating prediction (SVD), implicit behavioral confidence (ALS), or content similarity (TF-IDF).
        </p>
      </div>
      <div className="mt-8">
        {movieLoading ? (
          <p className="text-sm text-muted-foreground">Loading selected movie…</p>
        ) : (
          <RecommendationPanel
            key={`${mode ?? ""}-${movieId ?? ""}-${initialMovie?.id ?? ""}`}
            initialMode={mode ?? (movieId ? "content" : "svd")}
            initialMovie={initialMovie}
          />
        )}
      </div>
    </div>
  );
}
