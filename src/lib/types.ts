export interface Movie {
  id: number; // MovieLens movieId
  title: string;
  year: number | null;
  genres: string[];
  overview?: string;
  director?: string;
  cast?: string[];
  posterUrl?: string | null;
  backdropUrl?: string | null;
  /** Average rating on a 0–5 scale when the data source provides it. */
  avgRating?: number | null;
}

export type Algorithm = "svd" | "als" | "content";

export interface Recommendation {
  movie: Movie;
  /** SVD predicted rating (0–5). Only present for real API responses. */
  predictedRating?: number | null;
  /** ALS score or content similarity (0–1). */
  score?: number | null;
  explanation?: string | null;
}

export interface UserRecommendationRequest {
  user_id: number;
  algorithm: Exclude<Algorithm, "content">;
  limit?: number;
}

export interface SimilarMovieRequest {
  movie_id?: number;
  title?: string;
  limit?: number;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  source: "api" | "demo";
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}
