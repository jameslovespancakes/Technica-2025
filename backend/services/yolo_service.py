"""
YOLOv8 Service for skin rash detection.
Handles model loading, image detection, and result parsing.
"""

import os
from typing import Dict, List, Optional, Tuple
from ultralytics import YOLO
import cv2
import numpy as np


# Global model instance (loaded on startup)
_yolo_model = None
_model_loaded = False
_model_path = None

# Standard YOLOv8 class names (update when you know your model's classes)
# This is a placeholder - replace with actual class names from your model
CLASS_NAMES = [
    "eczema",
    "psoriasis",
    "dermatitis",
    "acne",
    "rash",
]  # Update with actual class names from your model

# Confidence threshold for detections
CONFIDENCE_THRESHOLD = 0.5  # Only return detections with >50% confidence


def load_yolo_model(model_path: str = "models/rash_model.pt") -> bool:
    """
    Load YOLOv8 model from file.

    Args:
        model_path: Path to the YOLOv8 model file (.pt format)

    Returns:
        bool: True if model loaded successfully, False otherwise
    """
    global _yolo_model, _model_loaded, _model_path

    # Always set model path (even if loading fails)
    _model_path = model_path

    try:
        # Check if model file exists
        if not os.path.exists(model_path):
            print(f"⚠️  Model file not found: {model_path}")
            print("   Using mock mode until model is available")
            _model_loaded = False
            return False

        # Load YOLOv8 model
        print(f"🔄 Loading YOLOv8 model from: {model_path}")
        _yolo_model = YOLO(model_path)
        _model_loaded = True

        # Get class names from model if available
        if hasattr(_yolo_model, "names"):
            global CLASS_NAMES
            CLASS_NAMES = list(_yolo_model.names.values())
            print(f"✅ Model loaded successfully!")
            print(f"   Classes: {CLASS_NAMES}")
        else:
            print(f"✅ Model loaded successfully!")
            print(f"   Using default class names: {CLASS_NAMES}")

        return True

    except Exception as e:
        print(f"❌ Error loading YOLOv8 model: {str(e)}")
        print("   Using mock mode")
        _model_loaded = False
        return False


def is_model_loaded() -> bool:
    """
    Check if YOLOv8 model is loaded.

    Returns:
        bool: True if model is loaded, False otherwise
    """
    return _model_loaded and _yolo_model is not None


def detect_rash(
    image_path: str, confidence_threshold: float = CONFIDENCE_THRESHOLD
) -> Dict:
    """
    Detect skin rash in an image using YOLOv8.

    Args:
        image_path: Path to the image file
        confidence_threshold: Minimum confidence score (0.0 to 1.0)

    Returns:
        dict: Detection results with format:
            {
                "success": bool,
                "detections": [
                    {
                        "rash_label": str,
                        "confidence": float,
                        "bounding_box": {
                            "x": int,
                            "y": int,
                            "width": int,
                            "height": int
                        }
                    }
                ],
                "error": str (if success is False)
            }
    """
    # Check if model is loaded
    if not is_model_loaded():
        return _mock_detection(image_path)

    try:
        # Check if image exists
        if not os.path.exists(image_path):
            return {
                "success": False,
                "detections": [],
                "error": f"Image file not found: {image_path}",
            }

        # Run YOLOv8 inference
        results = _yolo_model.predict(
            source=image_path,
            conf=confidence_threshold,
            verbose=False,  # Set to True for detailed output
        )

        # Parse results
        detections = _parse_yolo_results(results, confidence_threshold)

        return {
            "success": True,
            "detections": detections,
        }

    except Exception as e:
        return {
            "success": False,
            "detections": [],
            "error": f"Detection error: {str(e)}",
        }


def _parse_yolo_results(results, confidence_threshold: float) -> List[Dict]:
    """
    Parse YOLOv8 results into standardized format.

    Args:
        results: YOLOv8 results object
        confidence_threshold: Minimum confidence threshold

    Returns:
        list: List of detection dictionaries
    """
    detections = []

    # YOLOv8 returns a list of results (one per image)
    for result in results:
        # Get boxes, confidence scores, and class IDs
        boxes = result.boxes

        if boxes is None or len(boxes) == 0:
            continue

        # Extract detection data
        for i in range(len(boxes)):
            # Get box coordinates (xyxy format: x1, y1, x2, y2)
            box = boxes.xyxy[i].cpu().numpy()
            x1, y1, x2, y2 = box[0], box[1], box[2], box[3]

            # Get confidence score
            confidence = float(boxes.conf[i].cpu().numpy())

            # Get class ID and name
            class_id = int(boxes.cls[i].cpu().numpy())
            class_name = (
                CLASS_NAMES[class_id]
                if class_id < len(CLASS_NAMES)
                else f"class_{class_id}"
            )

            # Convert to x, y, width, height format
            x = int(x1)
            y = int(y1)
            width = int(x2 - x1)
            height = int(y2 - y1)

            # Only include if above confidence threshold
            if confidence >= confidence_threshold:
                detections.append(
                    {
                        "rash_label": class_name,
                        "confidence": round(
                            confidence * 100, 2
                        ),  # Convert to percentage
                        "bounding_box": {
                            "x": x,
                            "y": y,
                            "width": width,
                            "height": height,
                        },
                    }
                )

    # Sort by confidence (highest first)
    detections.sort(key=lambda x: x["confidence"], reverse=True)

    return detections


def _mock_detection(image_path: str) -> Dict:
    """
    Return mock detection results when model is not loaded.
    Mimics real model behavior by returning top 5 detections with varying confidence levels.
    Used for testing and development.

    Args:
        image_path: Path to image (not used in mock)

    Returns:
        dict: Mock detection results with top 5 conditions (sorted by confidence)
    """
    # Mock top 5 detections with realistic confidence levels
    # These represent the model's top predictions for the skin condition
    mock_detections = [
        {
            "rash_label": "eczema",
            "confidence": 85.5,
            "bounding_box": {
                "x": 100,
                "y": 150,
                "width": 200,
                "height": 180,
            },
        },
        {
            "rash_label": "psoriasis",
            "confidence": 72.3,
            "bounding_box": {
                "x": 95,
                "y": 145,
                "width": 210,
                "height": 190,
            },
        },
        {
            "rash_label": "contact_dermatitis",
            "confidence": 58.7,
            "bounding_box": {
                "x": 105,
                "y": 155,
                "width": 195,
                "height": 175,
            },
        },
        {
            "rash_label": "atopic_dermatitis",
            "confidence": 45.2,
            "bounding_box": {
                "x": 98,
                "y": 148,
                "width": 205,
                "height": 185,
            },
        },
        {
            "rash_label": "seborrheic_dermatitis",
            "confidence": 32.8,
            "bounding_box": {
                "x": 102,
                "y": 152,
                "width": 198,
                "height": 178,
            },
        },
    ]

    return {
        "success": True,
        "detections": mock_detections,  # Top 5 detections sorted by confidence
        "mock": True,  # Flag to indicate this is mock data
    }


def get_model_info() -> Dict:
    """
    Get information about the loaded model.

    Returns:
        dict: Model information
    """
    if not is_model_loaded():
        return {
            "loaded": False,
            "model_path": _model_path,
            "message": "Model not loaded - using mock mode",
        }

    return {
        "loaded": True,
        "model_path": _model_path,
        "classes": CLASS_NAMES,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
    }
