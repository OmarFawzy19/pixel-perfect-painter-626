
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

print("ENV file exists:", ENV_PATH.is_file())

load_dotenv(dotenv_path=ENV_PATH)

api_key = os.getenv("TMDB_API_KEY")

print("API key loaded:", bool(api_key))

if not api_key:
    raise RuntimeError("TMDB_API_KEY is missing")

url = "https://api.themoviedb.org/3/movie/862"

response = requests.get(
    url,
    params={"api_key": api_key},
    timeout=15
)

response.raise_for_status()

movie = response.json()

print("Title:", movie["title"])

poster_path = movie.get("poster_path")

if poster_path:
    poster_url = (
        f"https://image.tmdb.org/t/p/w500{poster_path}"
    )
    print("Poster URL:", poster_url)
