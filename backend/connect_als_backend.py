"""Safely connect ALS to your EXISTING CineMatch backend/main.py.

Usage:
    cd ~/Documents/HMI/pixel-perfect-painter-626/backend
    python /path/to/connect_als_backend.py

This script does NOT touch your model or frontend. It creates main.py.before-als.bak.
"""
from pathlib import Path
import shutil

backend = Path(__file__).resolve().parent
main_path = backend / "main.py"
service_path = backend / "als_service.py"

if not main_path.is_file():
    raise SystemExit("main.py not found. Put this script in your backend folder.")
if not service_path.is_file():
    raise SystemExit("als_service.py not found. Put it in your backend folder first.")

source = main_path.read_text(encoding="utf-8")
if "from als_service import recommend_als" in source:
    raise SystemExit("ALS already appears connected to main.py; no changes made.")

import_anchor = "from svd_service import recommend_svd"
if import_anchor not in source:
    raise SystemExit("Cannot find SVD import; main.py differs from expected version. No changes made.")

branch_anchor = '    if request.algorithm != "svd":'
if branch_anchor not in source:
    raise SystemExit("Cannot find SVD-only branch; main.py differs from expected version. No changes made.")

start = source.index(branch_anchor)
end_anchor = "    ids = [movie_id for movie_id, _ in ranked]"
end = source.find(end_anchor, start)
if end == -1:
    raise SystemExit("Cannot find existing recommendation response block. No changes made.")

new_logic = '''    if request.algorithm not in ("svd", "als"):
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

'''
new_source = source.replace(
    import_anchor,
    import_anchor + "\nfrom als_service import recommend_als",
    1,
)
new_source = new_source[:new_source.index(branch_anchor)] + new_logic + new_source[new_source.index(end_anchor, new_source.index(branch_anchor)):]

# Keep the existing SVD response shape while returning raw ALS scores.
old_result = '''            {"movie": enrich_movie(by_id[movie_id]), "predictedRating": round(score, 3)}
'''
new_result = '''            {
                "movie": enrich_movie(by_id[movie_id]),
                **(
                    {"score": round(score, 5)}
                    if request.algorithm == "als"
                    else {"predictedRating": round(score, 3)}
                ),
            }
'''
if new_source.count(old_result) != 1:
    raise SystemExit("Cannot locate exact SVD response mapping. No changes made.")
new_source = new_source.replace(old_result, new_result, 1)

import ast
ast.parse(new_source)

backup = backend / "main.py.before-als.bak"
if backup.exists():
    raise SystemExit(f"Backup already exists: {backup}. No changes made.")
shutil.copy2(main_path, backup)
main_path.write_text(new_source, encoding="utf-8")
print("ALS connected successfully.")
print("Backup:", backup)
print("Updated:", main_path)
