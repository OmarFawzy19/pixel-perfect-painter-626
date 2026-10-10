import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Activity, ArrowRight, Clapperboard, Play, Sparkles, Users } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { MovieRow } from "@/components/MovieGrid";
import { MovieCard } from "@/components/MovieCard";
import { DEMO_CATALOG, DEMO_GENRES, FOR_YOU_IDS, TOP_RATED_IDS, TRENDING_IDS } from "@/lib/mock-data";
import { useRecent } from "@/lib/library";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineMatch AI — Your next favorite movie starts here" },
      { name: "description", content: "Discover movies you'll love, powered by SVD, ALS and content-based recommendation algorithms trained on MovieLens 25M." },
      { property: "og:title", content: "CineMatch AI — Your next favorite movie starts here" },
      { property: "og:description", content: "AI-powered movie discovery built on a hybrid recommender trained on MovieLens 25M." },
    ],
  }),
  component: Home,
});

const byIds = (ids: number[]) => ids.map((id) => ({ movie: DEMO_CATALOG.find((m) => m.id === id)! }));

function HeroSection() {
  const featured = byIds(TRENDING_IDS.slice(0, 4));
  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden pb-16 pt-28">
      <img src={hero} alt="" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-side" />
      <div className="absolute inset-0 bg-fade" />
      <div className="relative mx-auto grid w-full max-w-7xl items-end gap-12 px-4 md:px-8 lg:grid-cols-[1.2fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Hybrid ML recommender · MovieLens 25M
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-[0.95] md:text-7xl">
            Your Next Favorite Movie <span className="text-gradient">Starts Here.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Discover movies you'll love, powered by intelligent recommendation algorithms.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/discover"><Play className="fill-current" /> Discover Movies</Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link to="/recommend"><Sparkles /> Get AI Recommendations</Link>
            </Button>
          </div>
        </motion.div>
        <div className="hidden grid-cols-4 gap-3 lg:grid">
          {featured.map((r, i) => (
            <motion.div key={r.movie.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: i % 2 ? 24 : 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
              <MovieCard rec={r} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const recent = useRecent();
  const recentItems = recent.map((id) => DEMO_CATALOG.find((m) => m.id === id)).filter(Boolean).map((m) => ({ movie: m! }));
  return (
    <>
      <HeroSection />
      <div className="mx-auto max-w-7xl space-y-16 px-4 md:px-8">
        {recentItems.length > 0 && <MovieRow title="Continue exploring" subtitle="Recently viewed on this device" items={recentItems} />}
        <MovieRow title="Trending Now" subtitle="Editorial picks from the demo catalog" items={byIds(TRENDING_IDS)} />
        <MovieRow title="Top Rated" subtitle="All-time classics" items={byIds(TOP_RATED_IDS)} />
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Recommended For You</h2>
              <p className="text-sm text-muted-foreground">Sample shelf — get real picks from the models on the AI page.</p>
            </div>
            <Link to="/recommend" className="hidden items-center gap-1 text-sm text-primary hover:underline sm:flex">
              Personalize <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-4 scrollbar-none">
            {byIds(FOR_YOU_IDS).map((r) => <MovieCard key={r.movie.id} rec={r} className="w-40 shrink-0 md:w-48" />)}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold md:text-3xl">Browse by Genre</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {DEMO_GENRES.map((g) => (
              <Link key={g} to="/discover" search={{ genre: g }} className="rounded-full glass px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary">
                {g}
              </Link>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl glass p-8 md:p-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-primary opacity-25 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold md:text-4xl">How the engine works</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Three complementary models, one hybrid recommendation system.</p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                { icon: Users, t: "SVD", d: "Learns hidden taste factors from millions of star ratings." },
                { icon: Activity, t: "ALS", d: "Learns from implicit behavior — what people actually watch." },
                { icon: Clapperboard, t: "Content-Based", d: "Matches movies by genres, cast, directors and keywords." },
              ].map((x) => (
                <div key={x.t}>
                  <x.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 text-lg font-bold">{x.t}</h3>
                  <p className="text-sm text-muted-foreground">{x.d}</p>
                </div>
              ))}
            </div>
            <Button asChild variant="hero" size="lg" className="mt-8">
              <Link to="/how-it-works">Explore the models <ArrowRight /></Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
