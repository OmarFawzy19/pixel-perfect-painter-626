"""One-time private ZIP import into a persistent volume; never trains models.

Set CINEMATCH_ASSET_DIR=/assets/current. Provide a short-lived HTTPS download
URL and its SHA-256 through Railway variables, then remove both after import.
The URL is never printed and the original archive bytes are verified first.
"""
import hashlib
import os
import shutil
import stat
import tempfile
import zipfile
from pathlib import Path, PurePosixPath
from urllib.parse import urlparse

import requests
from readiness import REQUIRED_FILES

MAX_BYTES = 400_000_000


def extract_bundle(archive, destination):
    with zipfile.ZipFile(archive) as bundle:
        files = [info for info in bundle.infolist() if not info.is_dir()]
        names = [info.filename for info in files]
        # Accept either the required tree at ZIP root or one enclosing folder.
        roots = [""] + [str(PurePosixPath(name).parent) + "/" for name in names if PurePosixPath(name).name == "movies.db"]
        prefix = next((root for root in roots if all(root + name in names for name in REQUIRED_FILES)), None)
        if prefix is None:
            raise ValueError("Archive does not contain the complete original asset bundle")
        selected = [info for info in files if info.filename.startswith(prefix)]
        if sum(info.file_size for info in selected) > MAX_BYTES:
            raise ValueError("Assets exceed the volume safety limit")
        seen = set()
        total = 0
        for info in selected:
            name = info.filename[len(prefix):]
            relative = PurePosixPath(name)
            # Only known asset directories and the catalog, never code/secrets.
            if name != "movies.db" and (not relative.parts or relative.parts[0] not in {"models", "data"}):
                continue
            if relative.is_absolute() or ".." in relative.parts or "\\" in name:
                raise ValueError("Unsafe archive path")
            if stat.S_ISLNK(info.external_attr >> 16) or name in seen:
                raise ValueError("Duplicate or symbolic-link archive member")
            if relative.suffix not in {".db", ".pkl", ".npz", ".parquet", ".csv", ".json", ".txt"}:
                raise ValueError("Unexpected asset file type")
            seen.add(name)
            target = destination.joinpath(*relative.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundle.open(info) as source, target.open("xb") as output:
                while chunk := source.read(1024 * 1024):
                    total += len(chunk)
                    if total > MAX_BYTES:
                        raise ValueError("Assets exceed the volume safety limit")
                    output.write(chunk)
        if not all((destination / name).is_file() for name in REQUIRED_FILES):
            raise ValueError("Incomplete asset bundle")


def bootstrap():
    url = os.getenv("ASSET_ARCHIVE_URL")
    if not url:
        return
    digest = os.getenv("ASSET_ARCHIVE_SHA256", "").lower()
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("A valid asset SHA-256 is required")
    destination = Path(os.environ["CINEMATCH_ASSET_DIR"])
    marker = destination / ".asset-import.sha256"
    if marker.is_file() and marker.read_text().strip() == digest:
        print("Original assets already provisioned")
        return
    if destination.exists():
        raise ValueError("Refusing to overwrite existing assets")
    if urlparse(url).scheme != "https":
        raise ValueError("Asset source must use HTTPS")
    destination.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".asset-import-", dir=destination.parent))
    try:
        with tempfile.TemporaryFile() as archive:
            hashed = hashlib.sha256()
            total = 0
            # Do not log request exceptions: they may contain a signed URL.
            with requests.get(url, stream=True, timeout=(15, 120), allow_redirects=False) as response:
                if response.status_code != 200:
                    raise ValueError("Asset download did not return HTTP 200")
                for chunk in response.iter_content(1024 * 1024):
                    total += len(chunk)
                    if total > MAX_BYTES:
                        raise ValueError("Asset archive is too large")
                    archive.write(chunk)
                    hashed.update(chunk)
            if hashed.hexdigest() != digest:
                raise ValueError("Asset checksum mismatch")
            archive.seek(0)
            extract_bundle(archive, staging)
        (staging / ".asset-import.sha256").write_text(digest + "\n")
        staging.rename(destination)
        print("Original assets provisioned; no model training performed")
    finally:
        if staging.exists():
            shutil.rmtree(staging)


if __name__ == "__main__":
    try:
        bootstrap()
    except Exception as exc:
        print(f"Asset provisioning failed ({type(exc).__name__}); source URL omitted")
        raise SystemExit(1) from None
