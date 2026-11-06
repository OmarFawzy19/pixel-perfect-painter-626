"""Validate the original assets without fitting or changing any model."""
import os
import sqlite3
from contextlib import closing
from pathlib import Path

ASSET_DIR = Path(os.getenv("CINEMATCH_ASSET_DIR", str(Path(__file__).resolve().parent)))
REQUIRED_FILES = (
    "movies.db",
    "data/tmdb_5000_movies.csv",
    "data/tmdb_5000_credits.csv",
    "models/tfidf_matrix.npz",
    "models/tmdb_profiles.parquet",
    "models/tfidf_vectorizer.pkl",
    "models/title_to_idx.pkl",
    "models/svd_model.pkl",
    "models/als_model.pkl",
    "models/user_encoder.pkl",
    "models/movie_encoder.pkl",
    "models/user_item_matrix.npz",
)


def check_readiness():
    missing = [name for name in REQUIRED_FILES if not (ASSET_DIR / name).is_file()]
    if missing:
        return {"ready": False, "status": "assets_missing", "missing": missing}
    checks = {}
    try:
        uri = (ASSET_DIR / "movies.db").resolve().as_uri() + "?mode=ro"
        with closing(sqlite3.connect(uri, uri=True, timeout=10)) as conn:
            count = conn.execute("SELECT COUNT(*) FROM movies").fetchone()[0]
            conn.execute("SELECT id, title, genres, tmdb_id, poster_path, overview FROM movies LIMIT 1")
            checks["catalog"] = "ready" if count > 0 else "empty"
    except (sqlite3.Error, OSError):
        checks["catalog"] = "unavailable"
    # Lazy imports allow liveness and provisioning even before models are present.
    from model_service import load_content_model
    from svd_service import get_svd_model
    from als_service import get_als_artifacts
    for name, loader in (("content", load_content_model), ("svd", get_svd_model), ("als", get_als_artifacts)):
        try:
            loader()
            checks[name] = "ready"
        except Exception as exc:
            # Only the exception type: no paths, secrets, or pickle contents.
            checks[name] = f"unavailable ({type(exc).__name__})"
    ready = all(value == "ready" for value in checks.values())
    return {"ready": ready, "status": "ready" if ready else "assets_invalid", "checks": checks}
