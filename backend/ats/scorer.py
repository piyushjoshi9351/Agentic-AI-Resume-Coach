from typing import List, Dict
import numpy as np


def compute_ats_score(matches: List[tuple], total_jd_skills: int, experience_years: float = None) -> Dict[str, float]:
    """Compute a simple ATS score based on semantic matches and optional experience signal.

    Returns: { 'skill_match_percent': float, 'experience_bonus': float, 'score': float }
    """
    matched = len(matches)
    skill_match_percent = (matched / total_jd_skills) * 100 if total_jd_skills else 0.0

    experience_bonus = 0.0
    if experience_years is not None:
        # cap bonus at 10%
        experience_bonus = min(10.0, max(0.0, (experience_years - 1.0) * 1.5))

    # weighted score
    score = skill_match_percent * 0.85 + experience_bonus * 1.0
    # normalize into 0-100
    score = max(0.0, min(100.0, score))

    return {
        "skill_match_percent": skill_match_percent,
        "experience_bonus": experience_bonus,
        "score": score,
    }
