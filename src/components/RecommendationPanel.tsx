import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Clapperboard, Loader2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { movieApi } from "@/lib/api";
import type { Algorithm, Movie, RecommendationResponse } from "@/lib/types";
import { SearchBar } from "./SearchBar";
import { MovieGrid, LoadingSkeleton } from "./MovieGrid";
import { Poster } from "./Poster";
import { DemoNotice } from "./DemoNotice";
import { cn } from "@/lib/utils";

const ALGOS: { id: Algorithm; label: string; sub: string; icon: typeof Users }[] = [
  { id: "svd", label: "Personalized", sub: "SVD · ratings", icon: Users },
  { id: "als", label: "Behavioral", sub: "ALS · implicit", icon: Activity },
  { id: "content", label: "Similar Movies", sub: "Content-based", icon: Clapperboard },
];

export function AlgorithmSelector({ value, onChange }: { value: Algorithm; onChange: (a: Algorithm) => void }) {
  return (
    <div role="tablist" className="grid grid-cols-3 gap-2 rounded-2xl glass p-1.5">
      {ALGOS.map((a) => (
        <button
          key={a.id}
          role="tab"
          aria-selected={value === a.id}
          onClick={() => onChange(a.id)}
          className="relative rounded-xl px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {value === a.id && (
            <motion.span layoutId="algo-pill" className="absolute inset-0 rounded-xl bg-gradient-primary shadow-glow" />
          )}
          <span className="relative flex items-center gap-2 text-sm font-semibold">
            <a.icon className="h-4 w-4" /> <span className="truncate">{a.label}</span>
          </span>
          <span className={cn("relative mt-0.5 block text-xs", value === a.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {a.sub}
          </span>
        </button>
      ))}
    </div>
  );
}

const COPY: Record<Algorithm, string> = {
  svd: "Matrix factorization on explicit star ratings. Enter a MovieLens user ID to get the top movies this user is predicted to rate highest.",
  als: "Alternating Least Squares on implicit feedback — it learns from interaction patterns (what users watched) rather than the exact stars they gave.",
  content: "TF-IDF similarity over genres, cast, directors and keywords. Pick a movie and find titles with the most similar profile.",
};

export function RecommendationPanel({ initialMode = "svd", initialMovie }: { initialMode?: Algorithm; initialMovie?: Movie | null }) {
  const [mode, setMode] = useState<Algorithm>(initialMode);
  const [userId, setUserId] = useState("");
  const [movie, setMovie] = useState<Movie | null>(initialMovie ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);

  useEffect(() => { setResult(null); setError(null); }, [mode]);

  const run = async () => {
    setError(null);
    setResult(null);
    if (mode !== "content") {
      const id = Number(userId);
      if (!Number.isInteger(id) || id < 1) {
        setError("Enter a valid MovieLens user ID (a positive whole number).");
        return;
      }
    } else if (!movie) {
      setError("Pick a movie first.");
      return;
    }
    setLoading(true);
    try {
      const r =
        mode === "content"
          ? await movieApi.similar({ movie_id: movie!.id, limit: 10 })
          : await movieApi.recommendForUser({ user_id: Number(userId), algorithm: mode, limit: 10 });
      setResult(r);
      if (r.recommendations.length === 0) toast("No recommendations returned.");
    } catch (e) {
      // Never fall back to demo predictions when a live request fails.
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <AlgorithmSelector value={mode} onChange={setMode} />

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-2xl glass p-6 md:p-8"
        >
          <p className="max-w-2xl text-sm text-muted-foreground">{COPY[mode]}</p>
          <form
            onSubmit={(e) => { e.preventDefault(); run(); }}
            className="mt-6 flex flex-col gap-3 md:flex-row"
          >
            {mode === "content" ? (
              <SearchBar className="flex-1" onSelect={setMovie} />
            ) : (
              <input
                inputMode="numeric"
                aria-label="MovieLens user ID"
                placeholder="MovieLens user ID, e.g. 42"
                value={userId}
                onChange={(e) => setUserId(e.target.value.replace(/\D/g, ""))}
                className="h-12 flex-1 rounded-full glass px-5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            )}
            <Button type="submit" variant="hero" size="xl" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {mode === "content" ? "Find Similar Movies" : "Get Recommendations"}
            </Button>
          </form>

          {mode === "content" && movie && (
            <div className="mt-6 flex gap-5 rounded-xl bg-background/50 p-4">
              <div className="w-24 shrink-0 overflow-hidden rounded-lg md:w-32"><div className="aspect-[2/3]"><Poster movie={movie} /></div></div>
              <div>
                <p className="text-xs uppercase tracking-widest text-primary">Selected</p>
                <h3 className="mt-1 text-xl font-bold md:text-2xl">{movie.title} <span className="text-muted-foreground">({movie.year})</span></h3>
                <p className="mt-1 text-xs text-muted-foreground">{movie.genres.join(" · ")}</p>
                {movie.overview && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{movie.overview}</p>}
              </div>
            </div>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </motion.div>
      </AnimatePresence>

      {loading && <LoadingSkeleton />}
      {!loading && result && (
        <div className="space-y-5">
          {result.source === "demo" && (
            <DemoNotice>
              {mode === "content"
                ? "These are sample titles ranked by simple genre overlap — not TF-IDF similarity scores from the trained model."
                : "These are sample titles shuffled from a demo catalog — not real SVD/ALS predictions. Connect the API to see genuine model output."}
            </DemoNotice>
          )}
          <h2 className="text-2xl font-bold">Top {result.recommendations.length} {mode === "content" ? "similar movies" : "picks"}</h2>
          <MovieGrid items={result.recommendations} ranked />
          {result.recommendations.some((r) => r.explanation) && (
            <div className="rounded-2xl glass p-6">
              <h3 className="font-bold">Why these movies?</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {result.recommendations.filter((r) => r.explanation).map((r) => (
                  <li key={r.movie.id}><span className="text-foreground">{r.movie.title}:</span> {r.explanation}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!loading && !result && !error && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Sparkles className="h-8 w-8 text-primary" />
          <p className="mt-3 font-semibold">Your recommendations will appear here</p>
          <p className="text-sm text-muted-foreground">
            {mode === "content" ? "Search for a movie to get started." : "Enter a user ID to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
