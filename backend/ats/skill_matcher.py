import numpy as np
from .embeddings import get_model, embed_texts
from typing import List, Tuple


def cosine_similarity_matrix(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    if a.size == 0 or b.size == 0:
        return np.zeros((a.shape[0] if a.size else 0, b.shape[0] if b.size else 0))
    a_norm = a / np.clip(np.linalg.norm(a, axis=1, keepdims=True), 1e-12, None)
    b_norm = b / np.clip(np.linalg.norm(b, axis=1, keepdims=True), 1e-12, None)
    return np.dot(a_norm, b_norm.T)


def match_skills(resume_skills: List[str], jd_skills: List[str], model=None, threshold: float = 0.68) -> List[Tuple[str, str, float]]:
    """Return list of matched pairs with similarity score (resume_skill, jd_skill, score)."""
    if model is None:
        model = get_model()
    r_emb = embed_texts(model, resume_skills)
    j_emb = embed_texts(model, jd_skills)
    sim = cosine_similarity_matrix(r_emb, j_emb)
    matches = []
    for j, jd_skill in enumerate(jd_skills):
        if sim.size == 0:
            continue
        r_idx = int(np.argmax(sim[:, j]))
        score = float(sim[r_idx, j])
        if score >= threshold:
            matches.append((resume_skills[r_idx], jd_skill, score))
    return matches
