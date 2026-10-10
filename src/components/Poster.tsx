import { Film } from "lucide-react";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Real poster when available, otherwise a generated typographic placeholder. */
export function Poster({ movie, className }: { movie: Movie; className?: string }) {
  if (movie.posterUrl) {
    return (
      <img
        src={movie.posterUrl}
        alt={`${movie.title} poster`}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  const hue = (movie.id * 47) % 360;
  return (
    <div
      role="img"
      aria-label={`${movie.title} poster placeholder`}
      className={cn("relative flex h-full w-full flex-col justify-between overflow-hidden p-4", className)}
      style={{
        background: `radial-gradient(120% 80% at 20% 0%, oklch(0.45 0.16 ${hue}) 0%, transparent 60%), radial-gradient(100% 80% at 100% 100%, oklch(0.35 0.14 ${(hue + 60) % 360}) 0%, transparent 60%), var(--card)`,
      }}
    >
      <Film className="h-5 w-5 text-foreground/50" />
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/60">{movie.year ?? "—"}</p>
        <p className="font-display text-lg font-bold leading-tight text-foreground line-clamp-4">{movie.title}</p>
      </div>
    </div>
  );
}
