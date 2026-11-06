# CineMatch AI on Railway

Deploy branch: `deploy/railway-prep`; review: PR #2.
Project: `b16e86e8-9501-4e2c-a4ed-fdfab71d36dd`.
Environment: production (`e4c8256e-75f0-4565-af1c-ed827cc37367`).

| Setting | cinematch-web | cinematch-api |
| --- | --- | --- |
| Repository | OmarFawzy19/pixel-perfect-painter-626 | Same |
| Branch | deploy/railway-prep | Same |
| Root | / | /backend |
| Dockerfile | Dockerfile.web | Dockerfile |
| Start | node .output/server/index.mjs | sh start.sh |
| Port | 3000 | 8000 |
| Liveness | /healthz | /api/health |
| Persistent volume | None | cinematch-assets at /assets, 500 MB |

The web build uses `npm ci` and `npm run build`, with a standalone Nitro
`node-server` output. There is no Bun lockfile or Bun install step. It copies
only `.output` into the runtime image. `PORT` and `HOST=0.0.0.0` configure the
listener. The existing Lovable integration is retained.

Set both `VITE_MOVIES_API_BASE_URL` and `VITE_API_BASE_URL` to the API HTTPS
origin **before building**. Set the API's `CORS_ORIGINS` to the exact web HTTPS
origin. VITE variables are public: never put a key or password in them.
Set `TMDB_API_KEY` privately on the API service only. Without it, movie posters
and descriptions rely on what is already cached in the original database.

## Original model provisioning

`CINEMATCH_ASSET_DIR=/assets/current`. The original inference adapters and
algorithms are unchanged: TF-IDF/cosine similarity, Surprise SVD and implicit
ALS. No training runs during build or startup. Assets are excluded from Git
and Docker contexts. Use only trusted pickle files from the original notebooks.

Prepare a ZIP with `movies.db`, `models/`, and `data/` at its root (one enclosing
folder is also accepted). Include these exact original files:

- `models/tfidf_matrix.npz`, `models/tmdb_profiles.parquet`
- `models/tfidf_vectorizer.pkl`, `models/title_to_idx.pkl`
- `models/svd_model.pkl`, `models/als_model.pkl`
- `models/user_encoder.pkl`, `models/movie_encoder.pkl`, `models/user_item_matrix.npz`
- `data/tmdb_5000_movies.csv`, `data/tmdb_5000_credits.csv`
- `movies.db`

Provide a short-lived private HTTPS download URL and its SHA-256 through
`ASSET_ARCHIVE_URL` and `ASSET_ARCHIVE_SHA256` on the API service, then deploy.
The importer verifies the archive hash, rejects path traversal/symlinks and
unexpected file types, limits extraction to 400 MB, and atomically activates
the complete tree. It refuses to overwrite an existing asset directory. The
ZIP is held on temporary container storage, not the persistent volume.
After a successful import, remove the two import variables. Do not commit them.

`/api/health` is a process liveness check. `/api/ready` must return HTTP 200
and `ready: true` before claiming the catalog and all three models are ready.
It checks the DB and loads the original artifacts. Missing assets produce HTTP
503, and catalog requests never create a replacement empty SQLite database.
The API can be running while readiness is 503; that is an incomplete deployment.

After readiness succeeds, exercise:

- `/api/movies`, `/api/movies/search?query=Toy`, `/api/movies/1`
- `/api/movies/1/similar?limit=5` (choose a covered title if ID 1 is not covered)
- `POST /api/recommend/user` with `{"user_id":1,"algorithm":"svd","limit":5}`
- `POST /api/recommend/user` with `{"user_id":3,"algorithm":"als","limit":5}`

Use IDs present in each original training set. Verify nonempty results, stable
ranking, catalog ID mapping and exclusion of seen/seed films. SVD and ALS refer
to MovieLens training users, not website accounts. The content model covers
the original TMDB 5000 subset. No substitutes should be used for absent assets.
Python 3.11 and NumPy 1.26.4 are used for deployment; Surprise is compiled with
the same NumPy ABI. Actual original-pickle compatibility requires testing the
real files, including their original dependency versions if loading fails.

## Account security

The existing login implementation is a local browser prototype. Its localStorage
users and client-trusted sessions are not server authentication. Public builds
disable login, signup, profile forms, session restoration and demo-user seeding.
Favorites remain explicitly local to the browser. Local development retains the
prototype. Do not enable public accounts until server-verified sessions, slow
password hashing, request throttling and appropriate recovery are implemented.

## Validation

`npm test`, `npx tsc --noEmit`, and `npm run build` validate the frontend.
`python -m unittest discover -s tests -v` from `backend/` checks API contracts,
missing-asset behavior, error privacy and ZIP extraction. Install `httpx` for
these tests. These tests use synthetic fixtures and do **not** verify the real
original model predictions. Confirm Railway reports `SUCCESS`, then verify
public routes, CORS and `/api/ready` separately.
