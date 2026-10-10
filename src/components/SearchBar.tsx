import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { movieApi } from "@/lib/api";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Autocomplete search with keyboard navigation. */
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
        .then((r) => { setResults(r); setError(null); setActive(0); })
        .catch((e) => setError(e.message));
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (m: Movie) => { onSelect(m); setQ(m.title); setOpen(false); };

  return (
    <div ref={box} className={cn("relative", className)}>
      <div className="flex h-12 items-center gap-3 rounded-full glass px-5 focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
          value={q}
          placeholder={placeholder}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && results[active]) pick(results[active]);
            if (e.key === "Escape") setOpen(false);
          }}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button aria-label="Clear" onClick={() => { setQ(""); setResults([]); }}>
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      {open && q.trim() && (
        <ul id="search-results" role="listbox" className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-card">
          {error && <li className="px-4 py-3 text-sm text-destructive">{error}</li>}
          {!error && results.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No movies match “{q}”.</li>}
          {results.map((m, i) => (
            <li
              key={m.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(m); }}
              className={cn("flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-sm", i === active && "bg-accent")}
            >
              <span>{m.title}</span>
              <span className="text-xs text-muted-foreground">{m.year}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
