import { useState } from "react";
import { Film } from "lucide-react";
import type { Movie } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Real poster when available, with automatic fallback to a generated typographic placeholder. */
export function Poster({ movie, className }: { movie: Movie; className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (movie.posterUrl && !imgError) {
    return (
      <img
        src={movie.posterUrl}
        alt={`${movie.title} poster`}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        className={cn("h-full w-full object-cover transition-opacity duration-300", className)}
      />
    );
  }

  const hue = (movie.id * 47) % 360;
  return (
    <div
      role="img"
      aria-label={`${movie.title} poster placeholder`}
      className={cn(
        "relative flex h-full w-full flex-col justify-between overflow-hidden p-4 select-none",
        className,
      )}
      style={{
        background: `radial-gradient(130% 90% at 15% 10%, oklch(0.48 0.18 ${hue} / 85%) 0%, transparent 65%), radial-gradient(110% 90% at 90% 90%, oklch(0.38 0.16 ${(hue + 55) % 360} / 90%) 0%, transparent 60%), oklch(0.16 0.015 275)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-black/25 backdrop-blur-sm">
          <Film className="h-4 w-4 text-white/80" />
        </span>
        {movie.year && (
          <span className="rounded-md bg-black/30 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white/90 backdrop-blur-sm">
            {movie.year}
          </span>
        )}
      </div>

      <div className="z-10">
        <p className="font-display text-base font-bold leading-snug tracking-tight text-white drop-shadow-sm line-clamp-3 md:text-lg">
          {movie.title}
        </p>
        {movie.genres?.length > 0 && (
          <p className="mt-1 text-[11px] font-medium text-white/70 line-clamp-1">
            {movie.genres.slice(0, 2).join(" · ")}
          </p>
        )}
      </div>

      {/* Subtle textured overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
    </div>
  );
}
