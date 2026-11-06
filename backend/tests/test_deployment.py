import io
import sqlite3
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
import main
import readiness
from bootstrap_assets import extract_bundle


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.client = TestClient(main.app)

    def tearDown(self):
        self.client.close()
        self.tmp.cleanup()

    def test_missing_assets_are_not_reported_ready_or_created(self):
        with patch.object(main, "DB_PATH", self.root / "movies.db"), patch.object(readiness, "ASSET_DIR", self.root):
            self.assertEqual(self.client.get("/api/health").status_code, 200)
            self.assertEqual(self.client.get("/api/ready").status_code, 503)
            self.assertFalse(self.client.get("/api/ready").json()["ready"])
            self.assertEqual(self.client.get("/api/movies").status_code, 503)
            self.assertFalse((self.root / "movies.db").exists())

    def test_catalog_and_all_recommendation_response_contracts(self):
        # Synthetic SQL/adapter outputs test HTTP contracts, not original models.
        db = self.root / "movies.db"
        with sqlite3.connect(db) as conn:
            conn.execute("CREATE TABLE movies (id INTEGER PRIMARY KEY, title TEXT, genres TEXT, tmdb_id INTEGER, poster_path TEXT, overview TEXT)")
            conn.executemany("INSERT INTO movies VALUES (?, ?, ?, NULL, '', '')", [(1, "One (2000)", "Drama"), (2, "Two (2001)", "Comedy")])
        with patch.object(main, "DB_PATH", db):
            self.assertEqual(self.client.get("/api/movies").json()["total"], 2)
            self.assertEqual(self.client.get("/api/movies/search?query=One").json()[0]["id"], 1)
            self.assertEqual(self.client.get("/api/movies/999").status_code, 404)
            for algorithm in ("svd", "als"):
                with patch.object(main, "recommend_" + algorithm, return_value=[(2, 0.75)]):
                    response = self.client.post("/api/recommend/user", json={"algorithm": algorithm, "user_id": 1, "limit": 1})
                    self.assertEqual(response.status_code, 200)
                    result = response.json()["recommendations"][0]
                    self.assertEqual(result["movie"]["id"], 2)
                    self.assertIn("score" if algorithm == "als" else "predictedRating", result)
            with patch.object(main, "recommend_similar", return_value=[(2, 0.5)]):
                response = self.client.get("/api/movies/1/similar")
                self.assertEqual(response.json()["source"], "content_model")
                self.assertEqual(response.json()["recommendations"][0]["movie"]["id"], 2)
            for payload in ({"user_id": 0}, {"user_id": 1, "limit": 21}, {"user_id": 1, "algorithm": "other"}):
                self.assertEqual(self.client.post("/api/recommend/user", json=payload).status_code, 422)

    def test_private_paths_are_not_exposed_on_model_failure(self):
        with patch.object(main, "recommend_svd", side_effect=FileNotFoundError("/private/secret/model.pkl")):
            response = self.client.post("/api/recommend/user", json={"user_id": 1})
            self.assertEqual(response.status_code, 503)
            self.assertNotIn("/private/secret", response.text)

    def make_bundle(self, extra=None):
        archive = io.BytesIO()
        with zipfile.ZipFile(archive, "w") as bundle:
            for name in readiness.REQUIRED_FILES:
                bundle.writestr("assets/" + name, b"test fixture only")
            if extra:
                bundle.writestr(extra, b"unsafe")
        archive.seek(0)
        return archive

    def test_asset_import_preserves_bytes_and_rejects_traversal(self):
        safe = self.root / "safe"
        safe.mkdir()
        extract_bundle(self.make_bundle(), safe)
        self.assertTrue(all((safe / name).read_bytes() == b"test fixture only" for name in readiness.REQUIRED_FILES))
        unsafe = self.root / "unsafe"
        unsafe.mkdir()
        with self.assertRaises(ValueError):
            extract_bundle(self.make_bundle("assets/models/../../escape.txt"), unsafe)
        self.assertFalse((self.root / "escape.txt").exists())


if __name__ == "__main__":
    unittest.main()
