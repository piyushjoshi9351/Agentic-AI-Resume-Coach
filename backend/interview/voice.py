import logging
import os
from pathlib import Path


logger = logging.getLogger(__name__)
_WHISPER_MODEL = None


def load_whisper_model():
    global _WHISPER_MODEL
    if _WHISPER_MODEL is not None:
        return _WHISPER_MODEL

    try:
        import whisper
    except Exception as exc:
        logger.warning("Whisper is not available: %s", exc)
        return None

    model_name = os.getenv("WHISPER_MODEL", "base")
    try:
        _WHISPER_MODEL = whisper.load_model(model_name)
        return _WHISPER_MODEL
    except Exception as exc:
        logger.warning("Failed to load Whisper model %s: %s", model_name, exc)
        return None


def transcribe_audio_file(audio_path: str) -> str:
    model = load_whisper_model()
    if model is None:
        return ""

    path = Path(audio_path)
    if not path.exists():
        logger.warning("Audio file not found: %s", audio_path)
        return ""

    try:
        result = model.transcribe(str(path))
        return (result.get("text") or "").strip()
    except Exception as exc:
        logger.warning("Whisper transcription failed for %s: %s", audio_path, exc)
        return ""
