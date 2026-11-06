FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    OPENBLAS_NUM_THREADS=1 \
    OMP_NUM_THREADS=1

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential g++ libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install numpy==1.26.4 Cython==3.0.12 setuptools wheel \
    && pip install --no-build-isolation -r requirements.txt
COPY . .

EXPOSE 8000
CMD ["sh", "start.sh"]
