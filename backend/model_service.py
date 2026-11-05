"""Read-only adapter for the ORIGINAL day4_content_based.ipynb artifacts.

No retraining or changes to the TF-IDF model.
Requires backend/data/tmdb_5000_movies.csv and backend/data/tmdb_5000_credits.csv
(the same exact source files used to train the notebook).
"""
from functools import lru_cache
from pathlib import Path
import sqlite3

import joblib
import numpy as np
import pandas as pd
from scipy.sparse import load_npz
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
DB_PATH = BASE_DIR / "movies.db"


@lru_cache(maxsize=1)
def load_content_model():
    # Both come directly from the original notebook, unchanged.
    matrix = load_npz(MODEL_DIR / "tfidf_matrix.npz")
    profiles = pd.read_parquet(MODEL_DIR / "tmdb_profiles.parquet")
    # Load the other original artifacts too, to check that the export is complete.
    vectorizer = joblib.load(MODEL_DIR / "tfidf_vectorizer.pkl")
    title_to_idx = pd.read_pickle(MODEL_DIR / "title_to_idx.pkl")

    # Reconstruct the precise TMDB row order from the notebook's original
    # merge, then join TMDB ID -> MovieLens ID using the existing SQLite DB.
    movies = pd.read_csv(DATA_DIR / "tmdb_5000_movies.csv")
    credits = pd.read_csv(DATA_DIR / "tmdb_5000_credits.csv")
    credits = credits.rename(columns={"movie_id": "id"})
    tmdb_rows = movies.merge(credits[["id", "cast", "crew"]], on="id")

    if len(tmdb_rows) != matrix.shape[0] or len(profiles) != matrix.shape[0]:
        raise ValueError(
            "TMDB data and saved model have different row counts. "
            "Use the SAME TMDB CSV files that were used to train the notebook."
        )

    # Verify alignment: the notebook saved profiles in original TMDB row order.
    actual_titles = tmdb_rows["title"].astype(str).str.strip().reset_index(drop=True)
    saved_titles = profiles["title_clean"].astype(str).str.strip().reset_index(drop=True)
    if not actual_titles.equals(saved_titles):
        raise ValueError(
            "TMDB rows do not match the saved model row order. "
            "Use the original training CSVs, do not rearrange them."
        )

    # Original model metadata is loaded but not modified.
    if len(title_to_idx) == 0 or not hasattr(vectorizer, "transform"):
        raise ValueError("Original TF-IDF artifacts appear incomplete.")

    with sqlite3.connect(DB_PATH) as conn:
        pairs = conn.execute(
            "SELECT id, tmdb_id FROM movies WHERE tmdb_id IS NOT NULL ORDER BY id"
        ).fetchall()

    tmdb_to_movie_id = {}
    for movie_id, tmdb_id in pairs:
        # Keep the first MovieLens ID for any duplicate TMDB link.
        tmdb_to_movie_id.setdefault(int(tmdb_id), int(movie_id))

    row_to_movie_id = {
        index: tmdb_to_movie_id[int(tmdb_id)]
        for index, tmdb_id in enumerate(tmdb_rows["id"])
        if pd.notna(tmdb_id) and int(tmdb_id) in tmdb_to_movie_id
    }
    movie_id_to_row = {movie_id: idx for idx, movie_id in row_to_movie_id.items()}
    return matrix, row_to_movie_id, movie_id_to_row


def recommend_similar(movie_id: int, limit: int = 10):
    """Return [(MovieLens movie_id, cosine_similarity)] for covered movies."""
    matrix, row_to_movie_id, movie_id_to_row = load_content_model()
    source_idx = movie_id_to_row.get(movie_id)
    if source_idx is None:
        # Movie is not in the TMDB ~5K training dataset.
        return None

    # Same cosine similarity as the original notebook's recommend_content().
    scores = cosine_similarity(matrix[source_idx], matrix).ravel()

    results = []
    for idx in np.argsort(scores)[::-1]:
        idx = int(idx)
        candidate_id = row_to_movie_id.get(idx)
        if candidate_id is None or candidate_id == movie_id:
            continue
        results.append((candidate_id, float(scores[idx])))
        if len(results) >= limit:
            break
    return results


if __name__ == "__main__":
    from pprint import pprint

    model = load_content_model()
    print(f"Loaded TF-IDF: {model[0].shape[0]} movies, {model[0].shape[1]} features")
    print("Toy Story (MovieLens ID 1) recommendations:")
    pprint(recommend_similar(1, 10))
