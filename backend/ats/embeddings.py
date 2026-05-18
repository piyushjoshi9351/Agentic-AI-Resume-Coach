from sentence_transformers import SentenceTransformer
import numpy as np

MODEL_NAME = "all-MiniLM-L6-v2"


def get_model(model_name: str = MODEL_NAME) -> SentenceTransformer:
    """Load and return a SentenceTransformer model."""
    return SentenceTransformer(model_name)


def embed_texts(model: SentenceTransformer, texts: list) -> np.ndarray:
    """Return embeddings for a list of texts as a numpy array."""
    if not texts:
        return np.array([])
    emb = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return emb
