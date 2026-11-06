import os
import re
import sqlite3
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from svd_service import recommend_svd
from als_service import recommend_als
from fastapi.middleware.cors import CORSMiddleware
from model_service import recommend_similar

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

ASSET_DIR = Path(os.getenv("CINEMATCH_ASSET_DIR", str(BASE_DIR)))
DB_PATH = ASSET_DIR / "movies.db"
TMDB_KEY = os.getenv("TMDB_API_KEY")
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

app = FastAPI(title="CineMatch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        *[origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()],
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def enrich_movie(row):
    """Convert a MovieLens row to the Movie shape expected by the React UI."""
    movie = dict(row)

    # MovieLens has no posters. TMDB provides them using the tmdb_id in links.csv.
    # Successful poster requests are cached in SQLite for subsequent visits.
    if TMDB_KEY and movie["tmdb_id"] and movie["poster_path"] is None:
        try:
            response = requests.get(
                f"https://api.themoviedb.org/3/movie/{int(movie['tmdb_id'])}",
                params={"api_key": TMDB_KEY},
                timeout=5,
            )
            response.raise_for_status()
            data = response.json()
            movie["poster_path"] = data.get("poster_path") or ""
            movie["overview"] = data.get("overview") or movie["overview"]
            with get_db() as conn:
                conn.execute(
                    "UPDATE movies SET poster_path = ?, overview = ? WHERE id = ?",
                    (movie["poster_path"], movie["overview"], movie["id"]),
                )
        except (requests.RequestException, ValueError):
            # Keep the page usable if TMDB is temporarily unavailable.
            pass

    match = re.search(r"\((\d{4})\)$", movie["title"])
    genres = [] if movie["genres"] == "(no genres listed)" else movie["genres"].split("|")

    return {
        "id": movie["id"],
        "title": movie["title"],
        "year": int(match.group(1)) if match else None,
        "genres": genres,
        "overview": movie["overview"],
        "posterUrl": (
            TMDB_IMAGE_BASE + movie["poster_path"]
            if movie["poster_path"]
            else None
        ),
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/movies/search")
def search_movies(query: str):
    if not query.strip():
        return []

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM movies
            WHERE title LIKE ? COLLATE NOCASE
            LIMIT 8
            """,
            (f"%{query.strip()}%",),
        ).fetchall()

    return [enrich_movie(row) for row in rows]


@app.get("/api/movies")
def list_movies(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=20),
    genre: str | None = None,
):
    offset = (page - 1) * limit
    conditions = []
    params = []

    if genre:
        conditions.append("('|' || genres || '|') LIKE ?")
        params.append(f"%|{genre}|%")

    where = "WHERE " + " AND ".join(conditions) if conditions else ""

    with get_db() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM movies {where}", params
        ).fetchone()[0]
        rows = conn.execute(
            f"""
            SELECT * FROM movies
            {where}
            ORDER BY id ASC
            LIMIT ? OFFSET ?
            """,
            [*params, limit, offset],
        ).fetchall()

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "hasNext": offset + len(rows) < total,
        "movies": [enrich_movie(row) for row in rows],
    }


@app.get("/api/movies/{movie_id}/similar")
def similar_movies(movie_id: int, limit: int = Query(default=10, ge=1, le=20)):
    """Real Content-Based TF-IDF recommendations from the original model."""
    with get_db() as conn:
        movie = conn.execute("SELECT id FROM movies WHERE id = ?", (movie_id,)).fetchone()
    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")

    try:
        ranked = recommend_similar(movie_id, limit)
    except (FileNotFoundError, ValueError, ImportError) as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Content-based model could not be loaded: {exc}",
        ) from exc

    if ranked is None:
        # Original model was trained only on TMDB 5000 movies, not all MovieLens.
        return {
            "source": "content_model",
            "recommendations": [],
            "message": "This film is not in the original content model's training catalog.",
        }

    ids = [movie_id for movie_id, _ in ranked]
    with get_db() as conn:
        placeholders = ",".join("?" for _ in ids)
        rows = conn.execute(
            f"SELECT * FROM movies WHERE id IN ({placeholders})", ids
        ).fetchall()
    rows_by_id = {row["id"]: row for row in rows}

    return {
        "source": "content_model",
        "recommendations": [
            {
                "movie": enrich_movie(rows_by_id[candidate_id]),
                "score": round(score, 4),
                "explanation": "Original Content-Based TF-IDF + cosine similarity model",
            }
            for candidate_id, score in ranked
            if candidate_id in rows_by_id
        ],
    }


@app.get("/api/movies/{movie_id}")
def get_movie(movie_id: int):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM movies WHERE id = ?", (movie_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    return enrich_movie(row)


class UserRecommendationRequest(BaseModel):
    user_id: int
    algorithm: str = "svd"
    limit: int = 10


@app.post("/api/recommend/user")
def user_recommendations(request: UserRecommendationRequest):
    """Existing React API contract for SVD recommendations."""
    if request.algorithm not in ("svd", "als"):
        raise HTTPException(status_code=422, detail="algorithm must be svd or als")
    if request.user_id < 1 or not 1 <= request.limit <= 20:
        raise HTTPException(status_code=422, detail="user_id must be positive and limit must be between 1 and 20")
    try:
        if request.algorithm == "als":
            ranked = recommend_als(request.user_id, request.limit)
        else:
            ranked = recommend_svd(request.user_id, request.limit)
    except (FileNotFoundError, ValueError, ImportError, ModuleNotFoundError) as exc:
        raise HTTPException(
            status_code=503,
            detail=f"{request.algorithm.upper()} model unavailable: {exc}",
        ) from exc

    if ranked is None:
        raise HTTPException(
            status_code=404,
            detail=f"MovieLens user ID not found in {request.algorithm.upper()} model. Try another user ID.",
        )

    ids = [movie_id for movie_id, _ in ranked]
    if not ids:
        return {"source": "api", "recommendations": []}

    with get_db() as conn:
        marks = ",".join("?" for _ in ids)
        rows = conn.execute(f"SELECT * FROM movies WHERE id IN ({marks})", ids).fetchall()
    by_id = {row["id"]: row for row in rows}
    return {
        "source": "api",
        "recommendations": [
            {
                "movie": enrich_movie(by_id[movie_id]),
                **(
                    {"score": round(score, 5)}
                    if request.algorithm == "als"
                    else {"predictedRating": round(score, 3)}
                ),
            }
            for movie_id, score in ranked if movie_id in by_id
        ],
    }
