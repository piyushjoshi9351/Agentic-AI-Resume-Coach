import logging
import json
import sys
import time
import uuid
from typing import Any


class JSONLogger:
    def __init__(self, level=logging.INFO):
        self.logger = logging.getLogger()
        self.logger.setLevel(level)
        handler = logging.StreamHandler(stream=sys.stdout)
        handler.setLevel(level)
        formatter = logging.Formatter("%(message)s")
        handler.setFormatter(formatter)
        # Replace existing handlers
        if self.logger.handlers:
            self.logger.handlers = []
        self.logger.addHandler(handler)

    def log(self, level: int, payload: dict[str, Any]):
        payload = {k: (v if not isinstance(v, bytes) else v.decode('utf-8', 'ignore')) for k, v in payload.items()}
        payload.setdefault("timestamp", time.strftime('%Y-%m-%dT%H:%M:%S%z'))
        payload.setdefault("level", logging.getLevelName(level))
        try:
            self.logger.log(level, json.dumps(payload, default=str))
        except Exception:
            # fallback to non-JSON message
            self.logger.log(level, str(payload))


# singleton instance
_json_logger: JSONLogger | None = None


def configure_logging(level=logging.INFO):
    global _json_logger
    if _json_logger is None:
        _json_logger = JSONLogger(level=level)


def log_json(level: int, **payload: Any) -> None:
    if _json_logger is None:
        configure_logging()
    _json_logger.log(level, payload)


def generate_request_id() -> str:
    return uuid.uuid4().hex
