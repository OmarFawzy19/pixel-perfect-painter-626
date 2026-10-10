import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Sparkles, Star } from "lucide-react";
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
    if (!loaderData) return { meta: [{ title: "Movie not found — CineMatch AI" }, { name: "robots", content: "noindex" }] };
    const m = loaderData.movie;
    const t = `${m.title}${m.year ? ` (${m.year})` : ""} — CineMatch AI`;
    const d = m.overview ?? `${m.title} details and similar movies.`;
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }] };
  },
  notFoundComponent: MovieNotFound,
  component: MovieDetails,
});

function MovieNotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 pt-28 text-center">
      <div>
        <h1 className="text-3xl font-bold">Movie not found</h1>
        <Link to="/discover" className="mt-4 inline-block text-primary hover:underline">Back to Discover</Link>
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
    movieApi.similar({ movie_id: movie.id, limit: 10 }).then((r) => setSimilar(r.recommendations)).catch((e) => setErr(e.message));
  }, [movie.id]);

  return (
    <>
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 scale-110 opacity-60 blur-3xl"><Poster movie={movie} /></div>
        <div className="absolute inset-0 bg-fade" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[280px_1fr] md:px-8 md:py-20">
          <div className="mx-auto w-56 overflow-hidden rounded-2xl shadow-glow md:w-full">
            <div className="aspect-[2/3]"><Poster movie={movie} /></div>
          </div>
          <div className="self-end">
            <Link to="/discover" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Discover
            </Link>
            <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">{movie.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {movie.year && <span>{movie.year}</span>}
              {movie.avgRating != null && (
                <span className="flex items-center gap-1 text-gold"><Star className="h-4 w-4 fill-current" /> {movie.avgRating.toFixed(1)}</span>
              )}
              {movie.genres.map((g) => (
                <Link key={g} to="/discover" search={{ genre: g }} className="rounded-full glass px-3 py-1 text-xs hover:text-primary">{g}</Link>
              ))}
            </div>
            {movie.overview && <p className="mt-5 max-w-2xl text-lg leading-relaxed">{movie.overview}</p>}
            <dl className="mt-5 grid max-w-2xl gap-2 text-sm">
              {movie.director && <div className="flex gap-2"><dt className="text-muted-foreground">Director</dt><dd>{movie.director}</dd></div>}
              {movie.cast?.length ? <div className="flex gap-2"><dt className="text-muted-foreground">Cast</dt><dd>{movie.cast.join(", ")}</dd></div> : null}
            </dl>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/recommend" search={{ mode: "content", movie: movie.id }}><Sparkles /> Find Similar Movies</Link>
              </Button>
              <Button
                variant="glass"
                size="xl"
                onClick={() => toast(toggle(movie.id) ? "Added to favorites" : "Removed from favorites")}
              >
                <Heart className={cn(fav && "fill-current text-primary")} /> {fav ? "Saved" : "Add to Favorites"}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl space-y-5 px-4 md:px-8">
        <h2 className="text-2xl font-bold">Because you're viewing {movie.title}</h2>
        <DemoNotice>Similar titles below are ranked by simple genre overlap in the sample catalog, not by the trained content model.</DemoNotice>
        {err ? <p className="text-sm text-destructive">{err}</p> : similar ? <MovieGrid items={similar} /> : <LoadingSkeleton />}
      </section>
    </>
  );
}
