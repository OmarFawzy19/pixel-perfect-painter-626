#!/bin/sh
set -eu
python bootstrap_assets.py
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
