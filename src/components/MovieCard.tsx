import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import type { Recommendation } from "@/lib/types";
import { useFavorites } from "@/lib/library";
import { Poster } from "./Poster";
import { cn } from "@/lib/utils";

export function MovieCard({ rec, rank, className }: { rec: Recommendation; rank?: number | undefined; className?: string }) {
  const { movie, predictedRating, score } = rec;
  const { has, toggle } = useFavorites();
  const fav = has(movie.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: (rank ?? 0) * 0.04 }}
      className={cn("group relative", className)}
    >
      <Link
        to="/movie/$id"
        params={{ id: String(movie.id) }}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow">
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
            <Poster movie={movie} />
          </div>
          <div className="absolute inset-0 bg-fade opacity-80" />
          {rank !== undefined && (
            <span className="absolute left-2 top-2 rounded-full glass px-2 py-0.5 text-xs font-semibold">#{rank + 1}</span>
          )}
          {(predictedRating != null || score != null) && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {predictedRating != null ? (
                <><Star className="h-3 w-3 fill-current" /> {predictedRating.toFixed(2)}</>
              ) : (
                <>{(score! * 100).toFixed(0)}% match</>
              )}
            </span>
          )}
        </div>
        <div className="mt-3 px-0.5">
          <p className="truncate text-sm font-semibold">{movie.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {movie.year ?? "—"} · {movie.genres.slice(0, 2).join(", ")}
          </p>
        </div>
      </Link>
      <button
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        onClick={() => {
          const added = toggle(movie.id);
          toast(added ? `Added “${movie.title}” to favorites` : `Removed from favorites`);
        }}
        className={cn(
          "absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full glass transition-all hover:scale-110",
          fav ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        <Heart className={cn("h-4 w-4", fav && "fill-current")} />
      </button>
    </motion.div>
  );
}
