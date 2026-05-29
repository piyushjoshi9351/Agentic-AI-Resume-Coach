"""Primary/fallback LLM router with timeout and strict JSON validation."""

import json
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from typing import Any, Type

from pydantic import BaseModel, ValidationError

DEFAULT_TIMEOUT_SECONDS = int(os.getenv("LLM_TIMEOUT_SECONDS", "45"))
PRIMARY_MODEL = os.getenv("PRIMARY_GEMINI_MODEL", "gemini-2.0-flash")
FALLBACK_MODEL = os.getenv("FALLBACK_GEMINI_MODEL", "gemini-2.0-flash-lite")
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower()
DEBUG_LLM_ERRORS = os.getenv("DEBUG_LLM_ERRORS", "false").lower() in {"1", "true", "yes"}

# Module-level simple Gemini client + safe invoke (debug-friendly)
import os as _os

# Expose basic env-derived settings for quick debugging
AI_PROVIDER = _os.getenv("AI_PROVIDER", AI_PROVIDER)
GOOGLE_API_KEY = _os.getenv("GOOGLE_API_KEY")
PRIMARY_GEMINI_MODEL = _os.getenv("PRIMARY_GEMINI_MODEL", PRIMARY_MODEL)

print("AI PROVIDER:", AI_PROVIDER)
print("PRIMARY MODEL:", PRIMARY_GEMINI_MODEL)
print("GOOGLE_API_KEY EXISTS:", bool(GOOGLE_API_KEY))

llm = None
try:
    if AI_PROVIDER == "gemini" and GOOGLE_API_KEY:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI

            llm = ChatGoogleGenerativeAI(
                model=PRIMARY_GEMINI_MODEL,
                google_api_key=GOOGLE_API_KEY,
                temperature=0.3,
            )
            print("LLM INITIALIZED SUCCESSFULLY")
        except Exception as _e:
            print("LLM INIT ERROR:", type(_e).__name__, str(_e))
            llm = None
except Exception:
    llm = None


def _safe_invoke(prompt, fallback_text):
    try:
        print("\n========== GEMINI INVOKE START ==========")

        response = llm.invoke(prompt) if llm else None

        print("\n========== GEMINI RESPONSE ==========")
        print(response)
        print("\n=====================================\n")

        return response.content if response is not None else fallback_text

    except Exception as e:
        print("\n========== GEMINI ERROR ==========")
        print(type(e).__name__)
        print(str(e))
        print("\n==================================\n")

        return fallback_text


def _is_quota_error(exc: Exception) -> bool:
    message = f"{type(exc).__name__}: {exc}".lower()
    return "resourceexhausted" in message or "429" in message or "quota" in message


def _truncate_text(text: str, limit: int = 3000) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + "\n\n[TRUNCATED]"


def _extract_json(text: str) -> Any:
    cleaned = text.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in cleaned:
        cleaned = cleaned.split("```", 1)[1].split("```", 1)[0].strip()
    else:
        import re

        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(0)
    return json.loads(cleaned)


class LLMRouter:
    def __init__(self):
        self.provider = "local"
        self.primary = None
        self.fallback = None
        if AI_PROVIDER == "gemini":
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                import logging
                logging.getLogger(__name__).warning(
                    "GOOGLE_API_KEY is not set; Gemini router will run in local fallback mode"
                )
                return

            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_google_genai import ChatGoogleGenerativeAI

            self.provider = "gemini"
            self._human_message = HumanMessage
            self._system_message = SystemMessage
            self.primary = ChatGoogleGenerativeAI(
                model=PRIMARY_MODEL,
                google_api_key=api_key,
                temperature=0.3,
                top_p=0.9,
                top_k=40,
                max_output_tokens=512,
            )
            self.fallback = ChatGoogleGenerativeAI(
                model=FALLBACK_MODEL,
                google_api_key=api_key,
                temperature=0.2,
                top_p=0.9,
                top_k=40,
                max_output_tokens=512,
            )

    def _invoke_with_timeout(self, model, messages, timeout_seconds: int):
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(model.invoke, messages)
            try:
                return future.result(timeout=timeout_seconds)
            except TimeoutError as exc:
                raise TimeoutError(f"LLM call timed out after {timeout_seconds}s") from exc

    def generate_text(self, system_prompt: str, user_prompt: str, timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS) -> str:
        if self.provider != "gemini":
            raise RuntimeError("Gemini provider disabled; local fallback mode is active")

        messages = [
            self._system_message(content=system_prompt),
            self._human_message(content=_truncate_text(user_prompt)),
        ]

        try:
            return self._invoke_with_timeout(self.primary, messages, timeout_seconds).content.strip()
        except Exception as primary_error:
            import logging
            logging.getLogger(__name__).error("Gemini primary model failed: %s", primary_error, exc_info=True)
            if _is_quota_error(primary_error):
                if DEBUG_LLM_ERRORS:
                    print(f"AI ERROR: {primary_error}")
                return ""
            if DEBUG_LLM_ERRORS:
                print(f"AI ERROR: {primary_error}")
                raise primary_error
            try:
                return self._invoke_with_timeout(self.fallback, messages, timeout_seconds).content.strip()
            except Exception as fallback_error:
                import logging
                logging.getLogger(__name__).error("Gemini fallback model failed: %s", fallback_error, exc_info=True)
                if _is_quota_error(fallback_error):
                    if DEBUG_LLM_ERRORS:
                        print(f"AI ERROR: {fallback_error}")
                    return ""
                if DEBUG_LLM_ERRORS:
                    print(f"AI ERROR: {fallback_error}")
                    raise fallback_error
                return ""

    def generate_json(
        self,
        schema_model: Type[BaseModel],
        system_prompt: str,
        user_prompt: str,
        fallback_data: dict,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    ) -> dict:
        base_prompt = (
            f"{system_prompt}\n"
            f"Return ONLY valid JSON matching this schema: {schema_model.model_json_schema()}"
        )

        correction_prompt = (
            "Your previous output failed strict schema validation. "
            "Return corrected JSON only. No markdown, no commentary."
        )

        attempts = [
            (base_prompt, user_prompt),
            (f"{base_prompt}\n{correction_prompt}", user_prompt),
        ]

        for current_system, current_user in attempts:
            try:
                raw_output = self.generate_text(current_system, current_user, timeout_seconds)
                parsed_json = _extract_json(raw_output)
                validated = schema_model.model_validate(parsed_json)
                return validated.model_dump()
            except (ValidationError, ValueError, json.JSONDecodeError, TimeoutError):
                continue
            except Exception:
                continue

        error_message = (
            "LLM pipeline failed strict JSON/schema validation. "
            "Inspect the earlier Gemini error logs in the backend output."
        )
        import logging
        logging.getLogger(__name__).error(error_message)
        if DEBUG_LLM_ERRORS:
            print(f"AI ERROR: {error_message}")
        return fallback_data


llm_router = LLMRouter()
