// API service layer. Talks to a future FastAPI backend at VITE_API_BASE_URL.
// When no URL is configured the app runs in clearly-labeled Demo Mode.
import { DEMO_CATALOG } from "./mock-data";
import {
  ApiError,
  type Movie,
  type RecommendationResponse,
  type SimilarMovieRequest,
  type UserRecommendationRequest,
} from "./types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
export const IS_DEMO = !BASE;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Couldn't reach the recommendation server. Check that it's running.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.detail ?? `Request failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Demo helpers (explicitly NOT model predictions) ----------
function hash(n: number) {
  let x = n * 2654435761;
  x = (x ^ (x >>> 16)) >>> 0;
  return x;
}
function genreOverlap(a: Movie, b: Movie) {
  const A = new Set(a.genres);
  const inter = b.genres.filter((g) => A.has(g)).length;
  return inter / new Set([...a.genres, ...b.genres]).size;
}

export const movieApi = {
  async health(): Promise<{ status: string }> {
    if (IS_DEMO) return { status: "demo" };
    return request("/api/health");
  },

  async search(query: string): Promise<Movie[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    if (IS_DEMO) return DEMO_CATALOG.filter((m) => m.title.toLowerCase().includes(q)).slice(0, 8);
    return request(`/api/movies/search?query=${encodeURIComponent(query)}`);
  },

  async getMovie(id: number): Promise<Movie | null> {
    if (IS_DEMO) return DEMO_CATALOG.find((m) => m.id === id) ?? null;
    return request(`/api/movies/${id}`);
  },

  async recommendForUser(req: UserRecommendationRequest): Promise<RecommendationResponse> {
    const limit = req.limit ?? 10;
    if (IS_DEMO) {
      await wait(900);
      const seed = req.user_id + (req.algorithm === "als" ? 7919 : 0);
      const picks = [...DEMO_CATALOG]
        .sort((a, b) => hash(a.id + seed) - hash(b.id + seed))
        .slice(0, limit);
      // Demo mode: no fabricated ratings/scores.
      return { source: "demo", recommendations: picks.map((movie) => ({ movie })) };
    }
    const data = await request<RecommendationResponse>("/api/recommend/user", {
      method: "POST",
      body: JSON.stringify({ ...req, limit }),
    });
    return { ...data, source: "api" };
  },

  async similar(req: SimilarMovieRequest): Promise<RecommendationResponse> {
    const limit = req.limit ?? 10;
    if (IS_DEMO) {
      await wait(700);
      const base = DEMO_CATALOG.find((m) => m.id === req.movie_id);
      if (!base) throw new ApiError("Movie not found in the demo catalog.", 404);
      const recs = DEMO_CATALOG.filter((m) => m.id !== base.id)
        .map((m) => ({ movie: m, overlap: genreOverlap(base, m) }))
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, limit)
        .map(({ movie }) => ({ movie }));
      return { source: "demo", recommendations: recs };
    }
    const data = await request<RecommendationResponse>("/api/recommend/similar", {
      method: "POST",
      body: JSON.stringify({ ...req, limit }),
    });
    return { ...data, source: "api" };
  },
};
