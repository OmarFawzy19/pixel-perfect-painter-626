import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Compass, Film, Play, Star } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { MovieRow } from "@/components/MovieGrid";
import { MovieCard } from "@/components/MovieCard";
import { DEMO_GENRES, FOR_YOU_IDS, TOP_RATED_IDS, TRENDING_IDS } from "@/lib/mock-data";
import { useRecent } from "@/lib/library";
import type { Movie } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineMatch — Explore and Discover Movies" },
      { name: "description", content: "Explore curated movie collections, classics, and trending films." },
      { property: "og:title", content: "CineMatch — Explore and Discover Movies" },
      { property: "og:description", content: "Curated movie discovery built for cinema lovers." },
    ],
  }),
  component: Home,
});

// Use the separate movies API URL so the AI recommendation endpoints can stay in demo mode.
const MOVIES_BASE_URL = (import.meta.env.VITE_MOVIES_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

async function getMovieById(movieId: number, signal: AbortSignal): Promise<Movie> {
  if (!MOVIES_BASE_URL) {
    throw new Error("VITE_MOVIES_API_BASE_URL is not configured in .env.local");
  }
  const response = await fetch(`${MOVIES_BASE_URL}/api/movies/${movieId}`, { signal });
  if (!response.ok) throw new Error(`Movie ${movieId}: HTTP ${response.status}`);
  return (await response.json()) as Movie;
}

const HOME_IDS = [...new Set([...TRENDING_IDS, ...TOP_RATED_IDS, ...FOR_YOU_IDS])];

function HeroSection({ featured }: { featured: { movie: Movie }[] }) {
  return (
    <section className="relative flex min-h-[85vh] items-end overflow-hidden pb-16 pt-28 sm:min-h-[90vh]">
      <img
        src={hero}
        alt="Cinema background"
        width={1920}
        height={1088}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-40 mix-blend-luminosity filter contrast-125"
      />
      <div className="absolute inset-0 bg-side" />
      <div className="absolute inset-0 bg-fade" />
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-gradient-primary opacity-20 blur-[120px]" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 md:px-8 lg:grid-cols-[1.3fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-foreground backdrop-blur-xl">
            <Film className="h-3.5 w-3.5 text-primary" />
            Curated Cinema Catalog
          </span>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Your Next Favorite Movie <span className="text-gradient">Starts Here.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Explore timeless classics, award-winning cinema, and curated collections tailored for film lovers.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Button asChild variant="hero" size="xl">
              <Link to="/discover"><Play className="fill-current" /> Browse All Movies</Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link to="/favorites"><Star className="h-4 w-4" /> My Watchlist</Link>
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-6 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:gap-8">
            <div>
              <p className="font-display text-xl font-bold text-foreground">Curated</p>
              <p className="mt-0.5">Top-Tier Cinema</p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div>
              <p className="font-display text-xl font-bold text-foreground">18+ Genres</p>
              <p className="mt-0.5">Diverse Selection</p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div>
              <p className="font-display text-xl font-bold text-foreground">Instant</p>
              <p className="mt-0.5">Local Watchlist</p>
            </div>
          </div>
        </motion.div>

        {/* Featured Showcase: identical layout, real movie details from FastAPI. */}
        <div className="hidden grid-cols-2 gap-5 lg:grid">
          {featured.map((r, i) => (
            <motion.div
              key={r.movie.id}
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: i === 1 ? 28 : 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              className="w-full"
            >
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5 text-primary">
                  <Compass className="h-3.5 w-3.5" /> Featured Pick
                </span>
                <span>#{i + 1} Featured</span>
              </div>
              <MovieCard rec={r} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const recent = useRecent();
  const recentKey = recent.join(",");
  const [movieMap, setMovieMap] = useState<Record<number, Movie>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const requestedIds = [...new Set([...HOME_IDS, ...recentKey.split(",").filter(Boolean).map(Number)])];

    async function load() {
      setLoading(true);
      setError(null);
      const fetched: Record<number, Movie> = {};
      let failures = 0;
      try {
        // Cap concurrent external requests. FastAPI may need to fetch/cache TMDB metadata.
        for (let i = 0; i < requestedIds.length; i += 4) {
          const batch = requestedIds.slice(i, i + 4);
          const results = await Promise.allSettled(
            batch.map((id) => getMovieById(id, controller.signal))
          );
          if (cancelled) return;
          results.forEach((result) => {
            if (result.status === "fulfilled") fetched[result.value.id] = result.value;
            else failures++;
          });
          setMovieMap({ ...fetched });
        }
        if (!cancelled && failures > 0) {
          setError(`${failures} movie${failures === 1 ? "" : "s"} could not be loaded.`);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load movies");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [recentKey, retry]);

  const byIds = (ids: number[]) => ids
    .map((id) => movieMap[id])
    .filter((movie): movie is Movie => Boolean(movie))
    .map((movie) => ({ movie }));

  const featured = byIds(TRENDING_IDS.slice(0, 2));
  const recentItems = useMemo(() => {
    return recent.map((id) => movieMap[id])
      .filter((movie): movie is Movie => Boolean(movie))
      .map((movie) => ({ movie }));
  }, [recentKey, movieMap]);

  return (
    <>
      <HeroSection featured={featured} />

      <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 md:px-8 pb-20">
        {loading && (
          <p role="status" className="text-center text-sm text-muted-foreground">Loading movie posters...</p>
        )}
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-center gap-3 text-sm text-destructive">
            <span>{error}</span>
            <Button type="button" variant="outline" onClick={() => setRetry((n) => n + 1)}>Try again</Button>
          </div>
        )}

        {recentItems.length > 0 && (
          <MovieRow title="Continue Exploring" subtitle="Titles recently viewed on your device" items={recentItems} />
        )}

        {byIds(TRENDING_IDS).length > 0 && (
          <MovieRow
            title="Trending Now"
            subtitle="Featured films from our curated catalog"
            items={byIds(TRENDING_IDS)}
          />
        )}

        {byIds(TOP_RATED_IDS).length > 0 && (
          <MovieRow
            title="All-Time Classics"
            subtitle="A collection of acclaimed films"
            items={byIds(TOP_RATED_IDS)}
          />
        )}

        {byIds(FOR_YOU_IDS).length > 0 && (
          <MovieRow
            title="Curated For You"
            subtitle="Hand-picked titles across popular categories"
            items={byIds(FOR_YOU_IDS)}
          />
        )}

        {/* Browse by Genre: keep current navigation and styling. */}
        <section className="space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Browse by Genre</h2>
              <p className="mt-1 text-sm text-muted-foreground">Filter the catalog across diverse thematic categories</p>
            </div>
            <Link
              to="/discover"
              className="hidden items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:underline sm:inline-flex"
            >
              Explore all genres <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {DEMO_GENRES.map((g) => (
              <Link
                key={g}
                to="/discover"
                search={{ genre: g }}
                className="rounded-full border border-border/70 bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-card/90 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
              >
                {g}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
