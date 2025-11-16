# Services package for backend business logic

from .yolo_service import (
    load_yolo_model,
    detect_rash,
    is_model_loaded,
    get_model_info,
    CLASS_NAMES,
    CONFIDENCE_THRESHOLD,
)

from .gemini_service import (
    load_gemini_client,
    is_gemini_available,
    generate_explanation,
    get_gemini_info,
    format_prompt_for_gemini,
)

__all__ = [
    "load_yolo_model",
    "detect_rash",
    "is_model_loaded",
    "get_model_info",
    "CLASS_NAMES",
    "CONFIDENCE_THRESHOLD",
    "load_gemini_client",
    "is_gemini_available",
    "generate_explanation",
    "get_gemini_info",
    "format_prompt_for_gemini",
]
