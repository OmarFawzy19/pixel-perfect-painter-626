import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Clapperboard, Database, Users } from "lucide-react";
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

const FLOW = ["Your ratings & views", "Model learns patterns", "Scores every movie", "Top 10 picks"];

function HowItWorks() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 md:px-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">How It Works</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-extrabold md:text-6xl">Three models. <span className="text-gradient">One taste profile.</span></h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        CineMatch combines collaborative filtering and content similarity into a hybrid recommender, trained on the MovieLens 25M dataset.
      </p>

      <div className="mt-10 grid gap-3 rounded-2xl glass p-4 md:grid-cols-4">
        {FLOW.map((s, i) => (
          <div key={s} className="flex items-center gap-3 rounded-xl bg-background/50 p-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
            <span className="text-sm font-medium">{s}</span>
            {i < FLOW.length - 1 && <ArrowRight className="ml-auto hidden h-4 w-4 text-muted-foreground md:block" />}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <ModelInfoCard
          index={0}
          icon={Users}
          tag="Collaborative Filtering"
          title="SVD"
          description="Singular Value Decomposition factorizes the user × movie rating matrix into hidden taste factors, then predicts the stars you'd give movies you haven't seen."
          steps={["Build the ratings matrix", "Factorize into latent vectors", "Predict missing ratings"]}
          metric={{ label: "SVD · RMSE", value: "0.857" }}
        />
        <ModelInfoCard
          index={1}
          icon={Activity}
          tag="Implicit Feedback"
          title="ALS"
          description="Alternating Least Squares treats interactions as confidence signals instead of exact ratings, learning from behavior patterns across users."
          steps={["Convert interactions to confidence", "Alternate user / item solves", "Rank by preference score"]}
          metric={{ label: "ALS · Precision@10", value: "0.17" }}
        />
        <ModelInfoCard
          index={2}
          icon={Clapperboard}
          tag="TF-IDF Similarity"
          title="Content-Based"
          description="Each movie becomes a TF-IDF vector of its genres, actors, directors and keywords. Cosine similarity finds titles with the closest profile."
          steps={["Extract movie metadata", "Vectorize with TF-IDF", "Rank by cosine similarity"]}
        />
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-2xl glass p-6 md:flex-row md:items-center md:p-8">
        <div className="flex items-center gap-4">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Dataset</p>
            <p className="font-display text-2xl font-bold">MovieLens 25M</p>
          </div>
        </div>
        <Button asChild variant="hero" size="xl">
          <Link to="/recommend">Try the models <ArrowRight /></Link>
        </Button>
      </div>
    </div>
  );
}
