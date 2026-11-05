import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clapperboard, Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { pushRecent, useFavorites } from "@/lib/library";
import type { Movie, Recommendation } from "@/lib/types";
import { Poster } from "@/components/Poster";
import { MovieGrid, LoadingSkeleton } from "@/components/MovieGrid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MOVIES_API_BASE = (
  (import.meta.env.VITE_MOVIES_API_BASE_URL as string | undefined) ?? ""
).replace(/\/$/, "");

// MovieLens titles already include their release year, e.g. "Toy Story (1995)".
function displayTitle(movie: Movie) {
  return movie.title.replace(/\s*\(\d{4}\)$/, "");
}

async function fetchRealMovie(id: number): Promise<Movie | null> {
  if (!MOVIES_API_BASE) {
    throw new Error("Movies API is not configured. Check VITE_MOVIES_API_BASE_URL in .env.local.");
  }

  const response = await fetch(`${MOVIES_API_BASE}/api/movies/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Could not load movie details (${response.status}).`);
  }
  return (await response.json()) as Movie;
}

export const Route = createFileRoute("/movie/$id")({
  loader: async ({ params }) => {
    const id = Number(params.id);
    if (!Number.isSafeInteger(id) || id <= 0) throw notFound();
    const movie = await fetchRealMovie(id);
    if (!movie) throw notFound();
    return { movie };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Movie not found — CineMatch AI" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const m = loaderData.movie;
    const title = `${displayTitle(m)}${m.year ? ` (${m.year})` : ""} — CineMatch`;
    const description = m.overview ?? `${displayTitle(m)} details and similar movies.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: MovieNotFound,
  component: MovieDetails,
});

function MovieNotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 pt-28 text-center">
      <div className="rounded-3xl border border-dashed border-border/80 bg-card/30 p-12">
        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">Movie Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The requested movie could not be located in the catalog.</p>
        <Button asChild variant="hero" className="mt-6">
          <Link to="/discover">
            <ArrowLeft className="h-4 w-4" /> Back to Discover
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MovieDetails() {
  const { movie } = Route.useLoaderData();
  const { has, toggle } = useFavorites();
  const fav = has(movie.id);
  const [similar, setSimilar] = useState<Recommendation[] | null>(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const title = displayTitle(movie);

  useEffect(() => {
    pushRecent(movie.id);
  }, [movie.id]);

  useEffect(() => {
    let cancelled = false;
    setSimilar(null);
    setErr(null);
    setLoadingSimilar(true);

    async function loadSimilar() {
      try {
        if (!MOVIES_API_BASE) {
          throw new Error("Movies API is not configured.");
        }
        const response = await fetch(
          `${MOVIES_API_BASE}/api/movies/${movie.id}/similar?limit=10`
        );
        if (!response.ok) {
          throw new Error(`Could not load similar movies (${response.status}).`);
        }
        const data = (await response.json()) as { recommendations?: Recommendation[]; source?: string };
        if (!Array.isArray(data.recommendations)) {
          throw new Error("Invalid recommendations response from the server.");
        }
        if (!cancelled) setSimilar(data.recommendations);
      } catch (error) {
        if (!cancelled) {
          setErr(error instanceof Error ? error.message : "Could not load similar movies.");
        }
      } finally {
        if (!cancelled) setLoadingSimilar(false);
      }
    }

    void loadSimilar();
    return () => { cancelled = true; };
  }, [movie.id]);

  return (
    <>
      <section className="relative overflow-hidden pt-20 pb-16">
        {/* Cinematic Backdrop Glow */}
        <div className="pointer-events-none absolute inset-0 scale-105 opacity-30 blur-[100px]">
          <Poster movie={movie} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] md:px-8 md:py-16">
          {/* Main Poster Showcase */}
          <div className="mx-auto w-56 sm:w-64 md:w-full">
            <div className="aspect-[2/3] overflow-hidden rounded-3xl border border-border/70 bg-card shadow-glow">
              <Poster movie={movie} />
            </div>
          </div>

          {/* Details Content */}
          <div className="flex flex-col justify-end">
            <Link
              to="/discover"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring self-start"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
            </Link>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
              {title}
            </h1>

            {/* Badges: Year, Rating, Genres */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
              {movie.year && (
                <span className="rounded-full border border-border/70 bg-card/60 px-3 py-1 text-foreground font-semibold">
                  {movie.year}
                </span>
              )}
              {movie.avgRating != null && (
                <span
                  aria-label={`Average rating: ${movie.avgRating.toFixed(1)} out of 5 stars`}
                  className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-bold text-gold"
                >
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {movie.avgRating.toFixed(1)} / 5.0
                </span>
              )}
              {movie.genres.map((genre) => (
                <Link
                  key={genre}
                  to="/discover"
                  search={{ genre }}
                  className="rounded-full border border-border/60 bg-card/40 px-3 py-1 text-muted-foreground backdrop-blur-sm transition-all hover:border-primary hover:text-primary active:scale-95"
                >
                  {genre}
                </Link>
              ))}
            </div>

            {movie.overview && (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {movie.overview}
              </p>
            )}

            {/* Metadata: displayed only if returned by the API */}
            <div className="mt-6 flex flex-col gap-3 border-t border-border/50 pt-5 text-sm sm:flex-row sm:gap-8">
              {movie.director && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Director</span>
                  <p className="mt-0.5 font-semibold text-foreground">{movie.director}</p>
                </div>
              )}
              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Cast</span>
                  <p className="mt-0.5 font-medium text-foreground">{movie.cast.join(", ")}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Button
                variant={fav ? "glass" : "hero"}
                size="xl"
                onClick={() => toast(toggle(movie.id) ? `Saved “${title}” to favorites` : "Removed from favorites")}
                className="gap-2"
              >
                <Heart className={cn("h-4 w-4 transition-transform", fav && "fill-current text-primary scale-110")} />
                {fav ? "Saved to Favorites" : "Save to Favorites"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Similar movies from the Content-Based TF-IDF model via FastAPI. */}
      <section className="mx-auto max-w-7xl space-y-6 px-4 pb-20 sm:px-6 md:px-8">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
          <Clapperboard className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            More Titles Like <span className="text-foreground">{title}</span>
          </h2>
        </div>

        {err ? (
          <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {err}
          </div>
        ) : loadingSimilar ? (
          <LoadingSkeleton />
        ) : similar && similar.length > 0 ? (
          <MovieGrid items={similar} />
        ) : (
          <p className="text-sm text-muted-foreground">No similar movies available yet.</p>
        )}
      </section>
    </>
  );
}
