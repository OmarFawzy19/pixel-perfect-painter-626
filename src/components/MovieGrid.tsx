import type { Recommendation } from "@/lib/types";
import { MovieCard } from "./MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MovieGrid({ items, ranked }: { items: Recommendation[]; ranked?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((r, i) => (
        <MovieCard key={r.movie.id} rec={r} rank={ranked ? i : undefined} />
      ))}
    </div>
  );
}

export function MovieRow({ title, subtitle, items }: { title: string; subtitle?: string; items: Recommendation[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4 scrollbar-none">
        {items.map((r) => (
          <MovieCard key={r.movie.id} rec={r} className="w-40 shrink-0 snap-start md:w-48" />
        ))}
      </div>
    </section>
  );
}

export function LoadingSkeleton({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] rounded-xl bg-muted" />
          <Skeleton className="mt-3 h-4 w-3/4 bg-muted" />
          <Skeleton className="mt-2 h-3 w-1/2 bg-muted" />
        </div>
      ))}
    </div>
  );
}
