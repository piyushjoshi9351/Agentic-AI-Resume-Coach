import numpy as np

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

MODEL_NAME = "all-MiniLM-L6-v2"


def get_model(model_name: str = MODEL_NAME) -> SentenceTransformer:
    """Load and return a SentenceTransformer model."""
    if SentenceTransformer is None:
        class _FallbackEmbeddingModel:
            def encode(self, texts, convert_to_numpy=True, normalize_embeddings=True):
                vectors = []
                for text in texts:
                    tokens = [token for token in str(text).lower().split() if token]
                    vector = np.zeros(64, dtype=float)
                    for token in tokens:
                        vector[hash(token) % vector.size] += 1.0
                    if normalize_embeddings and np.linalg.norm(vector) > 0:
                        vector = vector / np.linalg.norm(vector)
                    vectors.append(vector)
                return np.vstack(vectors) if vectors else np.array([])

        return _FallbackEmbeddingModel()

    return SentenceTransformer(model_name)


def embed_texts(model: SentenceTransformer, texts: list) -> np.ndarray:
    """Return embeddings for a list of texts as a numpy array."""
    if not texts:
        return np.array([])
    emb = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return emb
