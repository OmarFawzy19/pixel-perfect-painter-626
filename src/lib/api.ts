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

const BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined)?.replace(/\/$/, "");
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
  const q = query.trim();
  if (!q) return [];

  const base = (
    import.meta.env.VITE_MOVIES_API_BASE_URL as string | undefined
  )?.replace(/\/$/, "");

  if (!base) {
    throw new ApiError("Movie API URL is not configured.");
  }

  const response = await fetch(
    `${base}/api/movies/search?query=${encodeURIComponent(q)}`
  );

  if (!response.ok) {
    throw new ApiError(
      `Movie search failed (${response.status})`,
      response.status
    );
  }

  return response.json() as Promise<Movie[]>;
},


  async getMovie(id: number): Promise<Movie | null> {
    if (IS_DEMO) return DEMO_CATALOG.find((m) => m.id === id) ?? null;
    return request(`/api/movies/${id}`);
  },

  async recommendForUser(req: UserRecommendationRequest): Promise<RecommendationResponse> {
    const base = (import.meta.env.VITE_MOVIES_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
    if (!base) throw new ApiError("Set VITE_MOVIES_API_BASE_URL in .env.local to use the real SVD model.");
    const response = await fetch(`${base}/api/recommend/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...req, limit: req.limit ?? 10 }),
    }).catch(() => { throw new ApiError("Cannot reach FastAPI. Check port 8000."); });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new ApiError(typeof body?.detail === "string" ? body.detail : `Request failed (${response.status})`, response.status);
    }
    const data = await response.json() as RecommendationResponse;
    return { ...data, source: "api" };
  },

  async similar(req: SimilarMovieRequest): Promise<RecommendationResponse> {
    const base = (import.meta.env.VITE_MOVIES_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
    if (!base) throw new ApiError("Set VITE_MOVIES_API_BASE_URL in .env.local to use the real Content-Based model.");
    if (!req.movie_id) throw new ApiError("Please select a movie before requesting recommendations.");
    const url = `${base}/api/movies/${req.movie_id}/similar?limit=${req.limit ?? 10}`;
    const response = await fetch(url).catch(() => { throw new ApiError("Cannot reach FastAPI. Check port 8000."); });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new ApiError(typeof body?.detail === "string" ? body.detail : `Request failed (${response.status})`, response.status);
    }
    const data = await response.json() as RecommendationResponse;
    return { ...data, source: "api" };
  },
};

const MOVIES_BASE_URL = (
  import.meta.env.VITE_MOVIES_API_BASE_URL || ""
).replace(/\/$/, "");

export interface MoviesPage {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  movies: Movie[];
}

export async function fetchMovies(
  page = 1,
  limit = 12,
  genre?: string
): Promise<MoviesPage> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (genre) {
    params.set("genre", genre);
  }

  if (!MOVIES_BASE_URL) {
    throw new Error("Movies API URL is not configured");
  }

  const response = await fetch(
    `${MOVIES_BASE_URL}/api/movies?${params}`
  );

  if (!response.ok) {
    throw new Error("Failed to load movies");
  }

  return response.json();
}
