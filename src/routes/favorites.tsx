import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Compass, Heart } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { Button } from "@/components/ui/button";
import { DEMO_CATALOG } from "@/lib/mock-data";
import { useFavorites, useRecent } from "@/lib/library";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "My Favorites — CineMatch" },
      { name: "description", content: "Your saved movies and recently viewed titles." },
      { property: "og:title", content: "My Favorites — CineMatch" },
      { property: "og:description", content: "Your saved movies and recently viewed titles." },
    ],
  }),
  component: Favorites,
});

const toRecs = (ids: number[]) =>
  ids
    .map((id) => DEMO_CATALOG.find((m) => m.id === id))
    .filter(Boolean)
    .map((m) => ({ movie: m! }));

function Favorites() {
  const { favorites } = useFavorites();
  const recent = useRecent();

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 pt-28 pb-20 sm:px-6 md:px-8">
      {/* Saved Favorites Section */}
      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Heart className="h-4 w-4 fill-current" />
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                My Favorites
              </h1>
              {favorites.length > 0 && (
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                  {favorites.length} {favorites.length === 1 ? "movie" : "movies"}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Movies saved to your local browser watchlist.
            </p>
          </div>

          {favorites.length > 0 && (
            <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
              <Link to="/discover">
                <Compass className="h-3.5 w-3.5 text-primary" /> Browse More Movies
              </Link>
            </Button>
          )}
        </div>

        <div className="mt-8">
          {favorites.length > 0 ? (
            <MovieGrid items={toRecs(favorites)} />
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-dashed border-border/80 bg-card/30 py-20 px-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-glow">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-foreground">No favorites saved yet</h3>
              <p className="mt-1.5 mx-auto max-w-sm text-sm text-muted-foreground">
                Tap the heart button on any movie card or detail page to add it to your personal collection.
              </p>
              <Button asChild variant="hero" size="xl" className="mt-6">
                <Link to="/discover">
                  <Compass /> Discover Movies
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recently Viewed Section */}
      {recent.length > 0 && (
        <div className="border-t border-border/60 pt-10">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Recently Viewed</h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              {recent.length}
            </span>
          </div>
          <div className="mt-6">
            <MovieGrid items={toRecs(recent)} />
          </div>
        </div>
      )}
    </div>
  );
}
