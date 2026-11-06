
import sqlite3
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "ml-25m"
DB_PATH = BASE_DIR / "movies.db"

movies = pd.read_csv(DATA_DIR / "movies.csv")
links = pd.read_csv(DATA_DIR / "links.csv")

catalog = movies.merge(
    links,
    on="movieId",
    how="left",
)

catalog = catalog.rename(
    columns={
        "movieId": "id",
        "imdbId": "imdb_id",
        "tmdbId": "tmdb_id",
    }
)

with sqlite3.connect(DB_PATH) as conn:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            genres TEXT NOT NULL,
            imdb_id TEXT,
            tmdb_id INTEGER,
            poster_path TEXT,
            overview TEXT
        )
    """)

    records = [
        (
            int(row.id),
            row.title,
            row.genres,
            str(int(row.imdb_id))
                if pd.notna(row.imdb_id) else None,
            int(row.tmdb_id)
                if pd.notna(row.tmdb_id) else None,
        )
        for row in catalog.itertuples()
    ]

    conn.executemany("""
        INSERT INTO movies
            (id, title, genres, imdb_id, tmdb_id)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            genres = excluded.genres,
            imdb_id = excluded.imdb_id,
            tmdb_id = excluded.tmdb_id
    """, records)

print(f"Imported {len(records)} movies!")
