import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Recommendation } from "@/lib/types";
import { MovieCard } from "./MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MovieGrid({
  items,
  ranked,
  className,
}: {
  items: Recommendation[];
  ranked?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 md:gap-5", className)}>
      {items.map((r, i) => (
        <MovieCard key={r.movie.id} rec={r} rank={ranked ? i : undefined} />
      ))}
    </div>
  );
}

export function MovieRow({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: Recommendation[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
        </div>

        {/* Desktop scroll navigation buttons */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <button
            onClick={() => scroll("left")}
            aria-label={`Scroll ${title} left`}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-card/60 text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label={`Scroll ${title} right`}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-card/60 text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="-mx-4 flex snap-x scroll-pl-4 gap-3.5 overflow-x-auto px-4 pb-4 scrollbar-none sm:gap-4 md:-mx-8 md:scroll-pl-8 md:px-8 md:gap-5"
      >
        {items.map((r) => (
          <MovieCard key={r.movie.id} rec={r} className="w-36 shrink-0 snap-start sm:w-44 md:w-48" />
        ))}
      </div>
    </section>
  );
}

export function LoadingSkeleton({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 md:gap-5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <Skeleton className="aspect-[2/3] w-full rounded-2xl border border-border/40 bg-card/70" />
          <Skeleton className="mt-2.5 h-4 w-3/4 rounded-md bg-muted/60" />
          <Skeleton className="mt-1.5 h-3 w-1/2 rounded-md bg-muted/40" />
        </div>
      ))}
    </div>
  );
}
