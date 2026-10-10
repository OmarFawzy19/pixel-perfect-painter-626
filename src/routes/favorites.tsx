import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { Button } from "@/components/ui/button";
import { DEMO_CATALOG } from "@/lib/mock-data";
import { useFavorites, useRecent } from "@/lib/library";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "My Favorites — CineMatch AI" },
      { name: "description", content: "Your saved movies and recently viewed titles." },
      { property: "og:title", content: "My Favorites — CineMatch AI" },
      { property: "og:description", content: "Your saved movies and recently viewed titles." },
    ],
  }),
  component: Favorites,
});

const toRecs = (ids: number[]) =>
  ids.map((id) => DEMO_CATALOG.find((m) => m.id === id)).filter(Boolean).map((m) => ({ movie: m! }));

function Favorites() {
  const { favorites } = useFavorites();
  const recent = useRecent();
  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 pt-28 md:px-8">
      <div>
        <h1 className="text-4xl font-extrabold md:text-5xl">My Favorites</h1>
        <p className="mt-2 text-muted-foreground">Saved on this device.</p>
        <div className="mt-8">
          {favorites.length ? (
            <MovieGrid items={toRecs(favorites)} />
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
              <Heart className="h-8 w-8 text-primary" />
              <p className="mt-3 font-semibold">No favorites yet</p>
              <p className="text-sm text-muted-foreground">Tap the heart on any movie to save it here.</p>
              <Button asChild variant="hero" className="mt-5"><Link to="/discover">Discover movies</Link></Button>
            </div>
          )}
        </div>
      </div>
      {recent.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold">Recently viewed</h2>
          <div className="mt-6"><MovieGrid items={toRecs(recent)} /></div>
        </div>
      )}
    </div>
  );
}
