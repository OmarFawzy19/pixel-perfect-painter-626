import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Clapperboard, HelpCircle, Loader2, RefreshCw, Sparkles, Users } from "lucide-react";
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
  { id: "svd", label: "Personalized", sub: "SVD · Matrix Factorization", icon: Users },
  { id: "als", label: "Behavioral", sub: "ALS · Implicit Feedback", icon: Activity },
  { id: "content", label: "Similar Movies", sub: "TF-IDF · Metadata Profile", icon: Clapperboard },
];

const SAMPLE_USERS = [1, 42, 100, 314];

export function AlgorithmSelector({ value, onChange }: { value: Algorithm; onChange: (a: Algorithm) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Recommendation algorithms"
      className="grid grid-cols-1 gap-2 rounded-2xl border border-border/70 bg-card/60 p-2 backdrop-blur-xl sm:grid-cols-3 sm:gap-2.5"
    >
      {ALGOS.map((a) => (
        <button
          key={a.id}
          id={`tab-${a.id}`}
          role="tab"
          aria-selected={value === a.id}
          aria-controls={`panel-${a.id}`}
          onClick={() => onChange(a.id)}
          className={cn(
            "relative flex flex-col justify-center rounded-xl px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            value === a.id ? "text-primary-foreground font-semibold shadow-md" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
          )}
        >
          {value === a.id && (
            <motion.span
              layoutId="algo-pill"
              className="absolute inset-0 rounded-xl bg-gradient-primary shadow-glow"
              transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
            />
          )}
          <span className="relative flex items-center gap-2 text-sm font-bold">
            <a.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{a.label}</span>
          </span>
          <span
            className={cn(
              "relative mt-0.5 block truncate text-[11px]",
              value === a.id ? "text-primary-foreground/90 font-medium" : "text-muted-foreground",
            )}
          >
            {a.sub}
          </span>
        </button>
      ))}
    </div>
  );
}

const COPY: Record<Algorithm, { title: string; desc: string }> = {
  svd: {
    title: "Explicit Rating Collaborative Filtering",
    desc: "Singular Value Decomposition factorizes the user-item star rating matrix into latent taste factors, predicting the stars you'd give titles you haven't seen.",
  },
  als: {
    title: "Implicit Behavioral Feedback",
    desc: "Alternating Least Squares learns from implicit interaction signals (what users actually watched and replayed) rather than static star ratings.",
  },
  content: {
    title: "Content-Based Similarity Matching",
    desc: "Vectorizes movie genres, cast, directors, and plot keywords with TF-IDF. Cosine distance identifies titles that share the exact stylistic DNA.",
  },
};

export function RecommendationPanel({
  initialMode = "svd",
  initialMovie,
}: {
  initialMode?: Algorithm;
  initialMovie?: Movie | null;
}) {
  const [mode, setMode] = useState<Algorithm>(initialMode);
  const [userId, setUserId] = useState("");
  const [movie, setMovie] = useState<Movie | null>(initialMovie ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [mode]);

  const run = async () => {
    setError(null);
    setResult(null);
    if (mode !== "content") {
      const id = Number(userId);
      if (!Number.isInteger(id) || id < 1) {
        setError("Please enter a valid MovieLens user ID (a positive integer, e.g. 42).");
        return;
      }
    } else if (!movie) {
      setError("Please search and select a movie first.");
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
          id={`panel-${mode}`}
          role="tabpanel"
          aria-labelledby={`tab-${mode}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl shadow-card md:p-8"
        >
          <div>
            <h3 className="text-base font-bold text-foreground sm:text-lg">{COPY[mode].title}</h3>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{COPY[mode].desc}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
            className="mt-6 flex flex-col gap-3 md:flex-row md:items-center"
          >
            {mode === "content" ? (
              <SearchBar className="flex-1" onSelect={setMovie} />
            ) : (
              <div className="flex-1">
                <input
                  inputMode="numeric"
                  aria-label="MovieLens user ID"
                  placeholder="Enter MovieLens user ID, e.g. 42"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.replace(/\D/g, ""))}
                  className="h-12 w-full rounded-full border border-border/70 bg-background/60 px-5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
            )}

            <Button type="submit" variant="hero" size="xl" disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {mode === "content" ? "Find Similar Movies" : "Get Recommendations"}
            </Button>
          </form>

          {/* Sample User ID Quick-Pills for SVD / ALS */}
          {mode !== "content" && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">Try sample user:</span>
              {SAMPLE_USERS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setUserId(String(id))}
                  className={cn(
                    "rounded-full border px-3 py-1 font-semibold transition-all hover:border-primary hover:text-primary active:scale-95",
                    userId === String(id)
                      ? "border-primary bg-primary/20 text-primary font-bold"
                      : "border-border/60 bg-secondary/50 text-muted-foreground",
                  )}
                >
                  User #{id}
                </button>
              ))}
            </div>
          )}

          {/* Selected Movie Preview Card in Content Mode */}
          {mode === "content" && movie && (
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 shrink-0 overflow-hidden rounded-xl border border-border/50 shadow-sm sm:w-20">
                  <div className="aspect-[2/3]">
                    <Poster movie={movie} />
                  </div>
                </div>
                <div>
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Selected Seed Movie
                  </span>
                  <h4 className="mt-1 font-display text-lg font-bold text-foreground sm:text-xl">
                    {movie.title} {movie.year ? <span className="text-muted-foreground font-normal">({movie.year})</span> : null}
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground font-medium">{movie.genres.join(" · ")}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMovie(null)}
                className="self-start sm:self-center"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Change Movie
              </Button>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-sm text-destructive">
              {error}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Loading Skeleton */}
      {loading && <LoadingSkeleton />}

      {/* Results View */}
      {!loading && result && (
        <div className="space-y-6">
          {result.source === "demo" && (
            <DemoNotice>
              {mode === "content"
                ? "These are sample titles ranked by simple genre overlap — not TF-IDF similarity scores from the trained model."
                : "These are sample titles shuffled from a demo catalog — not real SVD/ALS predictions. Connect the API to see genuine model output."}
            </DemoNotice>
          )}

          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Top {result.recommendations.length} {mode === "content" ? "Similar Movies" : "Picks"}
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Generated using {mode === "svd" ? "SVD Collaborative Filtering" : mode === "als" ? "ALS Implicit Factorization" : "TF-IDF Cosine Similarity"}
              </p>
            </div>
          </div>

          <MovieGrid items={result.recommendations} ranked />

          {/* Explanation Cards */}
          {result.recommendations.some((r) => r.explanation) && (
            <div className="rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur-xl md:p-8">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h3 className="font-display text-lg font-bold text-foreground">Why These Recommendations?</h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {result.recommendations
                  .filter((r) => r.explanation)
                  .map((r) => (
                    <div key={r.movie.id} className="rounded-2xl border border-border/50 bg-background/40 p-4">
                      <p className="text-sm font-bold text-foreground">{r.movie.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.explanation}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && !error && (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-border/80 bg-card/30 py-20 px-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary/10 border border-primary/20 text-primary shadow-glow">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-foreground">Your recommendations will appear here</h3>
          <p className="mt-1.5 mx-auto max-w-md text-sm text-muted-foreground">
            {mode === "content"
              ? "Search and select a movie above to find titles with matching plot keywords, cast, and genres."
              : "Enter a MovieLens user ID above or tap one of our sample user badges to generate recommendations."}
          </p>
        </div>
      )}
    </div>
  );
}
