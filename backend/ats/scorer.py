from typing import Dict, List


DEFAULT_SCORE_WEIGHTS = {
    "skills": 0.50,
    "experience": 0.25,
    "projects": 0.15,
    "education": 0.10,
}


def _clamp_percent(value: float, default: float = 0.0) -> float:
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        numeric_value = default
    return max(0.0, min(100.0, numeric_value))


def compute_ats_score(
    matches: List[tuple],
    total_jd_skills: int,
    experience_years: float = None,
    experience_target_years: float = None,
    project_score: float = None,
    education_score: float = None,
    weights: Dict[str, float] | None = None,
) -> Dict[str, float]:
    """Compute a simple ATS score based on semantic matches and optional experience signal.

    Returns weighted score data for the dashboard and match engine.
    """
    matched = len(matches)
    similarity_values = [float(match[2]) for match in matches if len(match) >= 3]
    coverage_percent = (matched / total_jd_skills) * 100 if total_jd_skills else 0.0
    semantic_percent = (sum(similarity_values) / len(similarity_values)) * 100 if similarity_values else 0.0
    skill_match_percent = min(100.0, (coverage_percent * 0.6) + (semantic_percent * 0.4))

    if experience_target_years and experience_target_years > 0:
        experience_score = _clamp_percent((float(experience_years or 0.0) / float(experience_target_years)) * 100.0, default=45.0)
    elif experience_years is not None:
        experience_score = _clamp_percent(35.0 + (float(experience_years) * 12.0), default=45.0)
    else:
        experience_score = 45.0

    project_score = _clamp_percent(project_score, default=50.0) if project_score is not None else 50.0
    education_score = _clamp_percent(education_score, default=50.0) if education_score is not None else 50.0

    active_weights = {**DEFAULT_SCORE_WEIGHTS, **(weights or {})}
    total_weight = sum(active_weights.values()) or 1.0
    normalized_weights = {key: value / total_weight for key, value in active_weights.items()}

    weighted_contributions = {
        "skills": skill_match_percent * normalized_weights["skills"],
        "experience": experience_score * normalized_weights["experience"],
        "projects": project_score * normalized_weights["projects"],
        "education": education_score * normalized_weights["education"],
    }

    score = sum(weighted_contributions.values())
    score = max(0.0, min(100.0, score))

    return {
        "coverage_percent": coverage_percent,
        "semantic_match_percent": semantic_percent,
        "skill_match_percent": skill_match_percent,
        "experience_bonus": weighted_contributions["experience"],
        "project_score": project_score,
        "education_score": education_score,
        "score_breakdown": {
            "skill_score": skill_match_percent,
            "experience_score": experience_score,
            "project_score": project_score,
            "education_score": education_score,
            "semantic_similarity_percent": semantic_percent,
            "coverage_percent": coverage_percent,
            "weights": normalized_weights,
            "weighted_contributions": weighted_contributions,
            "final_score": score,
        },
        "score": score,
    }
