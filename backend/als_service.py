"""Read-only inference adapter for the ORIGINAL day3_als.ipynb artifacts.

Uses the original implicit ALS model, fitted LabelEncoders, and sparse
user-item matrix without changing the training algorithm.
Only load model files created by someone you trust.
"""
import os
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
from scipy.sparse import load_npz

ASSET_DIR = Path(os.getenv("CINEMATCH_ASSET_DIR", str(Path(__file__).resolve().parent)))
MODEL_DIR = ASSET_DIR / "models"


@lru_cache(maxsize=1)
def get_als_artifacts():
    model = joblib.load(MODEL_DIR / "als_model.pkl")
    user_encoder = joblib.load(MODEL_DIR / "user_encoder.pkl")
    movie_encoder = joblib.load(MODEL_DIR / "movie_encoder.pkl")
    user_item = load_npz(MODEL_DIR / "user_item_matrix.npz").tocsr()

    if (
        model.user_factors.shape[0] != user_item.shape[0]
        or model.item_factors.shape[0] != user_item.shape[1]
        or len(user_encoder.classes_) != user_item.shape[0]
        or len(movie_encoder.classes_) != user_item.shape[1]
    ):
        raise ValueError(
            "ALS artifacts have incompatible dimensions. "
            "Copy all four artifacts from the SAME notebook run."
        )
    return model, user_encoder, movie_encoder, user_item


def recommend_als(user_id: int, limit: int = 10):
    """Return [(MovieLens movie ID, ALS score)] or None for unknown user.

    Scores are raw implicit ALS preference scores, NOT star ratings.
    Already-interacted movies are filtered by implicit's recommend method.
    """
    if limit < 1:
        raise ValueError("limit must be positive")

    model, user_encoder, movie_encoder, user_item = get_als_artifacts()

    # numpy/searchsorted is faster than transforming then catching ValueError.
    classes = user_encoder.classes_
    location = int(np.searchsorted(classes, user_id))
    if location >= len(classes) or classes[location] != user_id:
        return None

    user_idx = int(user_encoder.transform([user_id])[0])
    movie_indices, scores = model.recommend(
        userid=user_idx,
        user_items=user_item[user_idx],
        N=limit,
        filter_already_liked_items=True,
    )
    movie_ids = movie_encoder.inverse_transform(
        np.asarray(movie_indices, dtype=np.int64)
    )
    return [
        (int(movie_id), float(score))
        for movie_id, score in zip(movie_ids, scores)
    ]


if __name__ == "__main__":
    model, users, movies, matrix = get_als_artifacts()
    print(f"ALS users: {len(users.classes_)}")
    print(f"ALS movies: {len(movies.classes_)}")
    print(f"User-item matrix: {matrix.shape}")
    # Notebook itself uses user ID 3 as its test case.
    print("User 3 recommendations:", recommend_als(3, 10))
