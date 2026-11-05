import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpDown, Film, Search, X } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { Button } from "@/components/ui/button";
import { DEMO_GENRES } from "@/lib/mock-data";
import { fetchMovies } from "@/lib/api";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

type SortMode = "title" | "new" | "old";

export const Route = createFileRoute("/discover")({
  validateSearch: (s: Record<string, unknown>): { genre?: string } => ({
    genre: typeof s["genre"] === "string" ? s["genre"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Discover Movies — CineMatch" },
      { name: "description", content: "Browse and filter the movie catalog by genre and title." },
      { property: "og:title", content: "Discover Movies — CineMatch" },
      { property: "og:description", content: "Browse and filter the movie catalog by genre and title." },
    ],
  }),
  component: Discover,
});

function Discover() {
  const { genre } = Route.useSearch();
  const navigate = useNavigate({ from: "/discover" });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("title");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMovies() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMovies(page, PAGE_SIZE, genre);
        if (!cancelled) {
          setMovies(data.movies);
          setTotal(data.total);
          setHasNext(data.hasNext);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load movies");
          setMovies([]);
          setTotal(0);
          setHasNext(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMovies();
    return () => { cancelled = true; };
  }, [page, genre, retry]);

  // Temporary client-side search and sorting for the loaded page only.
  // We'll move both to FastAPI once the basic integration is confirmed.
  const items = [...movies]
    .filter((movie) => movie.title.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : sort === "new"
          ? (b.year ?? 0) - (a.year ?? 0)
          : (a.year ?? 0) - (b.year ?? 0)
    )
    .map((movie) => ({ movie }));

  function changeGenre(nextGenre?: string) {
    setPage(1);
    setQ("");
    void navigate({ search: nextGenre ? { genre: nextGenre } : {} });
  }

  function resetFilters() {
    setPage(1);
    setQ("");
    void navigate({ search: {} });
  }  
  const chip = (active: boolean) => cn(
    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95",
    active
      ? "bg-primary text-primary-foreground shadow-glow"
      : "border border-border/70 bg-card/60 text-muted-foreground hover:bg-card/90 hover:text-foreground hover:border-foreground/20",
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 md:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Catalog Directory</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">Discover Movies</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Explore the curated movie catalog, filter by genre or title, and build your watchlist.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex h-12 flex-1 items-center gap-3 rounded-full border border-border/70 bg-card/60 px-5 backdrop-blur-md transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-visible:ring-offset-background">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search within this page…"
            aria-label="Filter movies on current page"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear filter query"
              onClick={() => setQ("")}
              className="grid h-7 w-7 min-w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative shrink-0">
          <select
            aria-label="Sort loaded movies"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="h-12 w-full appearance-none rounded-full border border-border/70 bg-card/60 pl-5 pr-11 text-sm font-semibold text-foreground backdrop-blur-md outline-none transition-all hover:border-foreground/20 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
          >
            <option value="title" className="bg-popover text-foreground">Sort: A–Z Alphabetical</option>
            <option value="new" className="bg-popover text-foreground">Sort: Newest Release</option>
            <option value="old" className="bg-popover text-foreground">Sort: Oldest Release</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button type="button" className={chip(!genre)} onClick={() => changeGenre()}>
          All Genres
        </button>
        {DEMO_GENRES.map((g) => (
          <button key={g} type="button" className={chip(genre === g)} onClick={() => changeGenre(g)}>
            {g}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-b border-border/60 pb-3 text-xs font-semibold text-muted-foreground">
        <span>
          Showing <span className="text-foreground font-bold">{loading ? "…" : items.length}</span> movies on this page
          {genre ? <span> in <span className="text-primary">{genre}</span></span> : null}
          {q ? <span> matching “<span className="text-foreground">{q}</span>”</span> : null}
          {!loading && !error ? <span> · {total.toLocaleString()} in selected catalog</span> : null}
        </span>
        {(genre || q) && (
          <button type="button" onClick={resetFilters} className="text-primary hover:underline">
            Reset filters
          </button>
        )}
      </div>

      <div className="mt-8" aria-live="polite">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Loading movies...</p>
        ) : error ? (
          <div className="py-12 text-center">
            <p role="alert" className="text-destructive">{error}</p>
            <Button className="mt-4" variant="outline" onClick={() => setRetry((n) => n + 1)}>Try again</Button>
          </div>
        ) : items.length > 0 ? (
          <MovieGrid items={items} />
        ) : (
          <div className="rounded-3xl border border-dashed border-border/80 bg-card/30 py-20 px-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Film className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-foreground">No movies match these filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing your search term or selecting a different genre.</p>
            <Button variant="hero" size="default" className="mt-6" onClick={resetFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {!error && total > 0 && (
        <div className="mt-10 flex items-center justify-center gap-5">
          <Button
            variant="outline"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button
            variant="outline"
            disabled={!hasNext || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

