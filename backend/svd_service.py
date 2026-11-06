"""Inference adapter for the original Surprise SVD artifact (no retraining)."""
import os
from functools import lru_cache
from pathlib import Path
import joblib

ASSET_DIR = Path(os.getenv('CINEMATCH_ASSET_DIR', str(Path(__file__).resolve().parent)))
MODEL_PATH = ASSET_DIR / 'models' / 'svd_model.pkl'


@lru_cache(maxsize=1)
def get_svd_model():
    # Only load a trusted model file generated from your own notebook.
    model = joblib.load(MODEL_PATH)
    if not hasattr(model, 'trainset') or model.trainset is None:
        raise ValueError('SVD model has no fitted trainset')
    return model


def recommend_svd(user_id: int, limit: int = 10):
    """Return descending (MovieLens movie_id, predicted_rating) pairs.

    Recommendations are restricted to movie IDs in the fitted trainset.
    Movies rated by this user in that SAME trainset are excluded.
    User must occur in the sampled training data.
    """
    model = get_svd_model()
    trainset = model.trainset
    try:
        inner_uid = trainset.to_inner_uid(user_id)
    except ValueError:
        return None  # New/cold user: original model has no learned factors.

    seen = {inner_iid for inner_iid, _ in trainset.ur[inner_uid]}
    scored = []
    for inner_iid in trainset.all_items():
        if inner_iid in seen:
            continue
        movie_id = int(trainset.to_raw_iid(inner_iid))
        score = float(model.predict(user_id, movie_id).est)
        scored.append((movie_id, score))

    scored.sort(key=lambda item: (-item[1], item[0]))
    return scored[:limit]


if __name__ == '__main__':
    model = get_svd_model()
    print('Trained SVD users:', model.trainset.n_users)
    print('Trained SVD movies:', model.trainset.n_items)
    print('User 1 result:', recommend_svd(1, 5))
