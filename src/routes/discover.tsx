import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MovieGrid } from "@/components/MovieGrid";
import { DemoNotice } from "@/components/DemoNotice";
import { DEMO_CATALOG, DEMO_GENRES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({
  validateSearch: (s: Record<string, unknown>): { genre?: string } => ({
    genre: typeof s.genre === "string" ? s.genre : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Discover Movies — CineMatch AI" },
      { name: "description", content: "Browse and filter the movie catalog by genre and title." },
      { property: "og:title", content: "Discover Movies — CineMatch AI" },
      { property: "og:description", content: "Browse and filter the movie catalog by genre and title." },
    ],
  }),
  component: Discover,
});

function Discover() {
  const { genre } = Route.useSearch();
  const navigate = useNavigate({ from: "/discover" });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"title" | "new" | "old">("title");

  const items = useMemo(() => {
    let list = DEMO_CATALOG.filter((m) => (!genre || m.genres.includes(genre)) && m.title.toLowerCase().includes(q.toLowerCase()));
    list = [...list].sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title) : sort === "new" ? (b.year ?? 0) - (a.year ?? 0) : (a.year ?? 0) - (b.year ?? 0),
    );
    return list.map((movie) => ({ movie }));
  }, [genre, q, sort]);

  const chip = (active: boolean) =>
    cn("shrink-0 rounded-full px-4 py-2 text-sm transition-colors", active ? "bg-primary text-primary-foreground" : "glass hover:bg-accent");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 md:px-8">
      <h1 className="text-4xl font-extrabold md:text-5xl">Discover</h1>
      <p className="mt-2 text-muted-foreground">Explore the catalog, filter by genre, and save favorites.</p>
      <div className="mt-6"><DemoNotice>The catalog shown is a small sample of MovieLens titles.</DemoNotice></div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <label className="flex h-12 flex-1 items-center gap-3 rounded-full glass px-5 focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </label>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-12 rounded-full glass bg-card px-5 text-sm outline-none"
        >
          <option value="title">A–Z</option>
          <option value="new">Newest first</option>
          <option value="old">Oldest first</option>
        </select>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button className={chip(!genre)} onClick={() => navigate({ search: {} })}>All</button>
        {DEMO_GENRES.map((g) => (
          <button key={g} className={chip(genre === g)} onClick={() => navigate({ search: { genre: g } })}>{g}</button>
        ))}
      </div>

      <div className="mt-8">
        {items.length ? (
          <MovieGrid items={items} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="font-semibold">No movies match these filters.</p>
            <button className="mt-2 text-sm text-primary hover:underline" onClick={() => { setQ(""); navigate({ search: {} }); }}>Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
