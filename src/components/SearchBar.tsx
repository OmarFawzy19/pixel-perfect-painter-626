import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { movieApi } from "@/lib/api";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Autocomplete search with keyboard navigation and accessible combobox semantics. */
export function SearchBar({
  onSelect,
  placeholder = "Search a movie title…",
  className,
}: {
  onSelect: (m: Movie) => void;
  placeholder?: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      movieApi
        .search(q)
        .then((r) => {
          setResults(r);
          setError(null);
          setActive(0);
        })
        .catch((e) => setError(e.message));
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (m: Movie) => {
    onSelect(m);
    setQ(m.title);
    setOpen(false);
  };

  return (
    <div ref={box} className={cn("relative", className)}>
      <div className="flex h-12 items-center gap-3 rounded-full border border-border/60 bg-card/60 px-5 backdrop-blur-md transition-all duration-200 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `search-item-${results[active].id}` : undefined}
          aria-label="Search movie by title"
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            }
            if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              pick(results[active]);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search input"
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            className="grid h-7 w-7 min-w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && q.trim().length > 0 && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-border/80 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-2xl"
        >
          {error && <li className="px-4 py-3 text-sm text-destructive">{error}</li>}
          {!error && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">No movies match “{q}”.</li>
          )}
          {results.map((m, i) => (
            <li
              key={m.id}
              id={`search-item-${m.id}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(m);
              }}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-colors",
                i === active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="flex flex-col truncate pr-2">
                <span className="truncate text-foreground font-semibold">{m.title}</span>
                {m.genres?.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">{m.genres.slice(0, 3).join(", ")}</span>
                )}
              </div>
              {m.year && (
                <span className="shrink-0 rounded-md bg-secondary/80 px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                  {m.year}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
