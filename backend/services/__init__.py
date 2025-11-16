# Services package for backend business logic

from .gemini_service import (
    load_gemini_client,
    is_gemini_available,
    generate_explanation,
    get_gemini_info,
    format_prompt_for_gemini,
)

__all__ = [
    "load_gemini_client",
    "is_gemini_available",
    "generate_explanation",
    "get_gemini_info",
    "format_prompt_for_gemini",
]
