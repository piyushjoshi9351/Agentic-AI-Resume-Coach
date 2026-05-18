import numpy as np
from .embeddings import get_model, embed_texts
from typing import List, Tuple


def cosine_similarity_matrix(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    if a.size == 0 or b.size == 0:
        return np.zeros((a.shape[0] if a.size else 0, b.shape[0] if b.size else 0))
    return np.dot(a, b.T)


def match_skills(resume_skills: List[str], jd_skills: List[str], model=None, threshold: float = 0.68) -> List[Tuple[str, str, float]]:
    """Return list of matched pairs with similarity score (resume_skill, jd_skill, score)."""
    if model is None:
        model = get_model()
    r_emb = embed_texts(model, resume_skills)
    j_emb = embed_texts(model, jd_skills)
    sim = cosine_similarity_matrix(r_emb, j_emb)
    matches = []
    for i, r in enumerate(resume_skills):
        if sim.size == 0:
            continue
        j_idx = np.argmax(sim[i])
        score = float(sim[i, j_idx])
        if score >= threshold:
            matches.append((r, jd_skills[j_idx], score))
    return matches
