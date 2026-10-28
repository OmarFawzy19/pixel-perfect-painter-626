import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clapperboard, Heart, Sparkles, Star, User } from "lucide-react";
import { toast } from "sonner";
import { movieApi } from "@/lib/api";
import { pushRecent, useFavorites } from "@/lib/library";
import type { Recommendation } from "@/lib/types";
import { Poster } from "@/components/Poster";
import { MovieGrid, LoadingSkeleton } from "@/components/MovieGrid";
import { DemoNotice } from "@/components/DemoNotice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/movie/$id")({
  loader: async ({ params }) => {
    const movie = await movieApi.getMovie(Number(params.id));
    if (!movie) throw notFound();
    return { movie };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Movie not found — CineMatch AI" }, { name: "robots", content: "noindex" }] };
    const m = loaderData.movie;
    const t = `${m.title}${m.year ? ` (${m.year})` : ""} — CineMatch`;
    const d = m.overview ?? `${m.title} details and similar movies.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
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
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    pushRecent(movie.id);
    setSimilar(null);
    setErr(null);
    movieApi
      .similar({ movie_id: movie.id, limit: 10 })
      .then((r) => setSimilar(r.recommendations))
      .catch((e) => setErr(e.message));
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
              {movie.title}
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
              {movie.genres.map((g) => (
                <Link
                  key={g}
                  to="/discover"
                  search={{ genre: g }}
                  className="rounded-full border border-border/60 bg-card/40 px-3 py-1 text-muted-foreground backdrop-blur-sm transition-all hover:border-primary hover:text-primary active:scale-95"
                >
                  {g}
                </Link>
              ))}
            </div>

            {movie.overview && (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {movie.overview}
              </p>
            )}

            {/* Metadata (Director & Cast) */}
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

            {/* Action CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Button
                variant={fav ? "glass" : "hero"}
                size="xl"
                onClick={() => toast(toggle(movie.id) ? `Saved “${movie.title}” to favorites` : "Removed from favorites")}
                className="gap-2"
              >
                <Heart className={cn("h-4 w-4 transition-transform", fav && "fill-current text-primary scale-110")} />
                {fav ? "Saved to Favorites" : "Save to Favorites"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Movies Section */}
      <section className="mx-auto max-w-7xl space-y-6 px-4 pb-20 sm:px-6 md:px-8">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
          <Clapperboard className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            More Titles Like <span className="text-foreground">{movie.title}</span>
          </h2>
        </div>

        {err ? (
          <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {err}
          </div>
        ) : similar ? (
          <MovieGrid items={similar} />
        ) : (
          <LoadingSkeleton />
        )}
      </section>
    </>
  );
}
