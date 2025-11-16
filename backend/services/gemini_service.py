"""
Gemini API Service for generating AI explanations from YOLOv8 detection results.
Handles API client initialization, prompt formatting, and explanation generation.
"""

import os
import time
from typing import Dict, Optional
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# Global model instance (loaded on startup)
_gemini_model = None
_gemini_available = False

# Configuration
GEMINI_MODEL = "gemini-2.0-flash-001"  # Fast model optimized for speed
TIMEOUT_SECONDS = 30  # API request timeout

# Generation config for faster responses
GENERATION_CONFIG = {
    "temperature": 0.7,  # Lower = more focused, faster
    "top_p": 0.8,  # Lower = faster generation
    "top_k": 40,  # Lower = faster generation
    "max_output_tokens": 600,  # Increased for multiple conditions analysis
}


def get_gemini_api_key() -> Optional[str]:
    """
    Get Gemini API key from environment variables.
    Tries multiple variable names for flexibility.

    Returns:
        str: API key if found, None otherwise
    """
    return (
        os.getenv("GOOGLE_API_KEY")
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("GEMINI_API_KEY_GOOGLE")
    )


def load_gemini_client() -> bool:
    """
    Initialize Gemini API client with API key from environment.

    Returns:
        bool: True if client initialized successfully, False otherwise
    """
    global _gemini_model, _gemini_available

    api_key = get_gemini_api_key()

    if not api_key:
        print("⚠️  Gemini API key not found in environment variables")
        print("   Please set GOOGLE_API_KEY or GEMINI_API_KEY in .env file")
        print("   AI explanations will be unavailable")
        _gemini_available = False
        return False

    try:
        # Configure Gemini API
        genai.configure(api_key=api_key)

        # Initialize model
        print(f"🔄 Initializing Gemini API client (model: {GEMINI_MODEL})")
        _gemini_model = genai.GenerativeModel(GEMINI_MODEL)
        _gemini_available = True

        print("✅ Gemini API client initialized successfully!")
        return True

    except Exception as e:
        print(f"❌ Error initializing Gemini API: {str(e)}")
        print("   AI explanations will be unavailable")
        _gemini_available = False
        return False


def is_gemini_available() -> bool:
    """
    Check if Gemini API is available and ready to use.

    Returns:
        bool: True if Gemini is available, False otherwise
    """
    return _gemini_available and _gemini_model is not None


def format_prompt_for_gemini(detections: list, user_context: str = "") -> str:
    """
    Format YOLOv8 detection results into a prompt for Gemini API.
    Handles multiple detections (top 3) and user-provided context.
    Optimized for faster response times.

    Args:
        detections: List of detection dictionaries, each containing:
            - 'rash_label': str - Condition name
            - 'confidence': float - Confidence score (0-100)
            - 'bounding_box': dict - Bounding box coordinates
        user_context: Optional user-provided text description/context about their condition

    Returns:
        str: Formatted prompt string for Gemini API
    """
    if not detections or len(detections) == 0:
        return "No detections found."

    # Build detection summary
    detection_summary = []
    for i, detection in enumerate(detections, 1):
        label = detection.get("rash_label", "unknown")
        confidence = detection.get("confidence", 0)
        detection_summary.append(f"{i}. {label} ({confidence}% confidence)")

    detections_text = "\n".join(detection_summary)

    # Primary detection (highest confidence)
    primary = detections[0]
    primary_label = primary.get("rash_label", "unknown")
    primary_confidence = primary.get("confidence", 0)

    # Build prompt with user context prominently featured
    if user_context and user_context.strip():
        context_section = f"""

**IMPORTANT - User's Description:**
"{user_context.strip()}"

The user has provided this information about their condition. Your analysis MUST directly address and incorporate this context. Consider:
- How the user's description aligns with each detected condition
- Whether the symptoms/timeline match the model's predictions
- What the user's description tells us that the image alone cannot
- Personalized recommendations based on the user's specific situation"""
    else:
        context_section = ""

    # Shorter, more focused prompt for faster responses
    prompt = f"""You are a medical AI assistant. A skin condition detection model analyzed an image and identified the following potential conditions (ranked by confidence):

{detections_text}

The model's primary prediction is {primary_label} ({primary_confidence}% confidence), but other conditions are also possible.{context_section}

Provide a concise explanation that:
1. **Directly addresses the user's description** (if provided) - explain how it relates to each detected condition
2. Brief overview of each detected condition (top 3)
3. Why multiple conditions might be detected (similar appearance, overlapping symptoms)
4. Key differences between the top conditions
5. **Personalized care recommendations** based on the user's specific situation and description
6. When to seek professional medical care for proper diagnosis

Keep response under 400 words. Emphasize this is informational only, not medical advice. Professional diagnosis is needed to distinguish between similar conditions."""

    return prompt


def generate_explanation(detections: list, user_context: str = "") -> Dict:
    """
    Generate AI explanation from YOLOv8 detection results using Gemini API.
    Handles multiple detections (top 3) and user-provided context.
    Provides comprehensive analysis incorporating both model detections and user description.

    Args:
        detections: List of detection dictionaries, each containing:
            - 'rash_label': str - Condition name
            - 'confidence': float - Confidence score (0-100)
            - 'bounding_box': dict - Bounding box coordinates
            Can also accept a single detection dict for backward compatibility.
        user_context: Optional user-provided text description/context about their condition

    Returns:
        dict: Result dictionary with format:
            {
                "success": bool,
                "explanation": str (if success) or None,
                "error": str (if failed) or None
            }
    """
    # Check if Gemini is available
    if not is_gemini_available():
        return {
            "success": False,
            "explanation": None,
            "error": "Gemini API not available - API key not configured",
        }

    try:
        # Handle both list and single dict (for backward compatibility)
        if isinstance(detections, dict):
            # Single detection - convert to list
            detections = [detections]
        elif not isinstance(detections, list) or len(detections) == 0:
            return {
                "success": False,
                "explanation": None,
                "error": "Invalid detection results: detections must be a list",
            }

        # Validate detections have required fields
        for detection in detections:
            if (
                not detection.get("rash_label")
                or detection.get("rash_label") == "unknown"
            ):
                return {
                    "success": False,
                    "explanation": None,
                    "error": "Invalid detection results: missing rash_label in one or more detections",
                }

        # Format prompt with all detections and user context
        prompt = format_prompt_for_gemini(detections, user_context=user_context)

        # Call Gemini API with optimized generation config for speed
        start_time = time.time()
        response = _gemini_model.generate_content(
            prompt, generation_config=genai.types.GenerationConfig(**GENERATION_CONFIG)
        )
        api_time = time.time() - start_time
        print(f"   ⏱️  Gemini API call took: {api_time:.2f}s")

        # Extract explanation text
        if hasattr(response, "text") and response.text:
            explanation = response.text.strip()
        else:
            # Fallback if response format is unexpected
            explanation = str(response).strip()

        if not explanation:
            return {
                "success": False,
                "explanation": None,
                "error": "Gemini API returned empty response",
            }

        return {
            "success": True,
            "explanation": explanation,
            "error": None,
        }

    except Exception as e:
        error_message = str(e)

        # Handle specific error types
        if (
            "API key" in error_message.lower()
            or "authentication" in error_message.lower()
        ):
            error_msg = "Invalid API key or authentication error"
        elif "quota" in error_message.lower() or "rate limit" in error_message.lower():
            error_msg = "API quota exceeded or rate limit reached"
        elif "timeout" in error_message.lower():
            error_msg = "Request timeout - API took too long to respond"
        else:
            error_msg = f"Gemini API error: {error_message}"

        return {
            "success": False,
            "explanation": None,
            "error": error_msg,
        }


def get_gemini_info() -> Dict:
    """
    Get information about the Gemini API client status.

    Returns:
        dict: Information about Gemini API availability
    """
    return {
        "available": is_gemini_available(),
        "model": GEMINI_MODEL if _gemini_available else None,
        "api_key_configured": get_gemini_api_key() is not None,
    }
