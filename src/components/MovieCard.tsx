import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import type { Recommendation } from "@/lib/types";
import { useFavorites } from "@/lib/library";
import { Poster } from "./Poster";
import { cn } from "@/lib/utils";

export function MovieCard({
  rec,
  rank,
  className,
}: {
  rec: Recommendation;
  rank?: number | undefined;
  className?: string;
}) {
  const { movie, predictedRating, score } = rec;
  const { has, toggle } = useFavorites();
  const fav = has(movie.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: (rank ?? 0) * 0.04 }}
      className={cn("group relative flex flex-col", className)}
    >
      <Link
        to="/movie/$id"
        params={{ id: String(movie.id) }}
        className="block flex-1 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-glow">
          <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105">
            <Poster movie={movie} />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

          {/* Rank Badge */}
          {rank !== undefined && (
            <span className="absolute left-2.5 top-2.5 rounded-full border border-border/60 bg-black/60 px-2.5 py-0.5 text-[11px] font-bold text-foreground backdrop-blur-md shadow-sm">
              #{rank + 1}
            </span>
          )}

          {/* Rating Badge */}
          {(predictedRating != null || movie.avgRating != null) && (
            <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/70 border border-border/60 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur-md shadow-md">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {predictedRating != null ? predictedRating.toFixed(2) : movie.avgRating?.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-2.5 px-0.5">
          <p className="truncate text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {movie.title}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
            {movie.year ?? "—"} · {movie.genres.slice(0, 2).join(", ")}
          </p>
        </div>
      </Link>

      {/* Favorite Button: Mobile-visible (opacity-80), desktop hover (opacity-0 md:group-hover:opacity-100) */}
      <button
        aria-label={fav ? `Remove ${movie.title} from favorites` : `Add ${movie.title} to favorites`}
        onClick={(e) => {
          e.preventDefault();
          const added = toggle(movie.id);
          toast(added ? `Saved “${movie.title}” to favorites` : `Removed from favorites`);
        }}
        className={cn(
          "absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
          fav
            ? "border-primary/50 bg-background/90 text-primary shadow-sm opacity-100"
            : "border-border/60 bg-black/50 text-foreground/80 backdrop-blur-md hover:bg-black/75 hover:text-primary hover:border-primary/40 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100",
        )}
      >
        <Heart className={cn("h-4 w-4 transition-transform", fav && "fill-current scale-110")} />
      </button>
    </motion.div>
  );
}
