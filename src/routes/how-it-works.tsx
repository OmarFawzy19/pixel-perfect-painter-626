import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, BarChart3, CheckCircle2, Clapperboard, Database, Layers, Sparkles, Users } from "lucide-react";
import { ModelInfoCard } from "@/components/ModelInfoCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — CineMatch AI" },
      { name: "description", content: "How SVD, ALS and content-based filtering power CineMatch AI, trained on MovieLens 25M." },
      { property: "og:title", content: "How It Works — CineMatch AI" },
      { property: "og:description", content: "SVD, ALS and TF-IDF content similarity, explained." },
    ],
  }),
  component: HowItWorks,
});

const PIPELINE = [
  { step: 1, title: "Data Ingestion", desc: "User ratings, watch history, and movie metadata vectors" },
  { step: 2, title: "Latent Learning", desc: "SVD & ALS matrix factorizations extract hidden taste factors" },
  { step: 3, title: "Scoring Engine", desc: "Predicts missing star ratings and computes cosine similarities" },
  { step: 4, title: "Hybrid Ensemble", desc: "Combines candidate sets and ranks the top 10 recommendations" },
];

function HowItWorks() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 md:px-8">
      {/* Hero Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">System Architecture</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Three Models. <span className="text-gradient">One Taste Profile.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
          CineMatch combines collaborative filtering with content similarity into a high-precision hybrid recommender, trained on 25 million ratings from the MovieLens benchmark.
        </p>
      </div>

      {/* Connected 4-Step Pipeline */}
      <div className="mt-12">
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">End-to-End Recommendation Pipeline</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((p, i) => (
            <div
              key={p.step}
              className="relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-xl shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-xs font-bold text-primary-foreground shadow-glow">
                    0{p.step}
                  </span>
                  {i < PIPELINE.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 text-muted-foreground/60 lg:block" />
                  )}
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-foreground">{p.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Cards Deep Dive */}
      <div className="mt-16">
        <div className="flex items-end justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Core Model Implementations</h2>
            <p className="mt-1 text-sm text-muted-foreground">Detailed breakdown of the three complementary algorithms</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <ModelInfoCard
            index={0}
            icon={Users}
            tag="Collaborative Filtering"
            title="SVD Factorization"
            description="Singular Value Decomposition factorizes the user × movie rating matrix into hidden taste factors, predicting the stars you'd give movies you haven't seen."
            steps={["Construct sparse rating matrix", "Factorize into latent user & item vectors", "Compute dot products to predict stars"]}
            metric={{ label: "SVD · Test RMSE", value: "0.857" }}
          />
          <ModelInfoCard
            index={1}
            icon={Activity}
            tag="Implicit Feedback"
            title="ALS Behavioral"
            description="Alternating Least Squares treats viewing habits and completions as confidence signals rather than exact ratings, learning patterns across millions of users."
            steps={["Convert interactions into confidence scores", "Alternate between user and item vector solves", "Rank unobserved items by preference score"]}
            metric={{ label: "ALS · Precision@10", value: "0.17" }}
          />
          <ModelInfoCard
            index={2}
            icon={Clapperboard}
            tag="TF-IDF Similarity"
            title="Content-Based"
            description="Each movie becomes a multidimensional TF-IDF vector of its genres, actors, directors, and plot keywords. Cosine similarity finds closest neighbors."
            steps={["Extract metadata keywords & genres", "Vectorize corpus with TF-IDF weights", "Compute pairwise cosine similarity"]}
            metric={{ label: "Catalog Overlap", value: "62K Titles" }}
          />
        </div>
      </div>

      {/* Dataset & Call to Action Banner */}
      <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl border border-border/80 bg-card/60 p-6 backdrop-blur-2xl shadow-card sm:p-8 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-glow">
            <Database className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Benchmark Dataset</p>
            <p className="font-display text-2xl font-bold text-foreground">MovieLens 25M</p>
            <p className="text-xs text-muted-foreground">25,000,095 ratings across 62,423 movies by 162,541 users</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="glass" size="xl">
            <Link to="/discover">
              Browse Movies
            </Link>
          </Button>
          <Button asChild variant="hero" size="xl">
            <Link to="/recommend">
              <Sparkles /> Launch Recommender
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
