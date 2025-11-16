"""
Swin Transformer Service for skin condition classification.
Handles model loading, image classification, and result parsing.
"""

import os
from typing import Dict, List, Optional
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import timm


# Global model instance (loaded on startup)
_swin_model = None
_model_loaded = False
_model_path = None
_device = None

# Class names for skin conditions (update based on your model's training)
CLASS_NAMES = [
    "atopic_dermatitis",
    "basal_cell_carcinoma",
    "benign_keratosis",
    "dermatofibroma",
    "melanocytic_nevus",
    "melanoma",
    "squamous_cell_carcinoma",
    "tinea_ringworm",
    "vascular_lesion",
]

# Confidence threshold for predictions
CONFIDENCE_THRESHOLD = 0.01  # Return predictions with >1% confidence


def load_swin_model(model_path: str = "models/swin_best.pt") -> bool:
    """
    Load Swin Transformer model from file.

    Args:
        model_path: Path to the Swin model file (.pt format)

    Returns:
        bool: True if model loaded successfully, False otherwise
    """
    global _swin_model, _model_loaded, _model_path, _device, CLASS_NAMES

    # Always set model path (even if loading fails)
    _model_path = model_path

    try:
        # Check if model file exists
        if not os.path.exists(model_path):
            print(f" [WARN] Model file not found: {model_path}")
            print(f" [INFO] Using mock mode until model is available")
            _model_loaded = False
            return False

        # Determine device (GPU if available, otherwise CPU)
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f" [LOAD] Loading model from: {model_path}")
        print(f" [INFO] Device: {_device}")

        # Load the checkpoint
        checkpoint = torch.load(model_path, map_location=_device, weights_only=False)

        # Try to detect the correct model architecture from checkpoint
        # Check dimensions to identify Swin variant
        if isinstance(checkpoint, dict):
            state_dict = checkpoint.get("model_state_dict") or checkpoint.get("state_dict") or checkpoint
        else:
            state_dict = checkpoint

        # Detect model variant from patch_embed dimensions
        embed_dim = state_dict.get("patch_embed.proj.weight", torch.zeros(96, 3, 4, 4)).shape[0]

        # Detect number of classes from the final layer
        num_classes = len(CLASS_NAMES)
        if "head.fc.weight" in state_dict:
            num_classes = state_dict["head.fc.weight"].shape[0]
        elif "head.weight" in state_dict:
            num_classes = state_dict["head.weight"].shape[0]

        print(f" [INFO] Detected {num_classes} classes in checkpoint")

        # Map embedding dimensions to model variants
        model_variants = {
            96: "swinv2_tiny_window8_256",
            128: "swinv2_small_window8_256",
            192: "swinv2_base_window8_256",
            384: "swinv2_large_window12_192"
        }

        model_name = model_variants.get(embed_dim, "swinv2_tiny_window8_256")
        print(f" [INFO] Model variant: {model_name} (embed_dim={embed_dim})")

        # Create model architecture with correct number of classes
        model = timm.create_model(
            model_name,
            pretrained=False,
            num_classes=num_classes
        )

        # Load state dict
        model.load_state_dict(state_dict, strict=False)

        # Load class names from checkpoint if available
        if "class_to_idx" in checkpoint:
            class_to_idx = checkpoint["class_to_idx"]
            idx_to_class = {v: k for k, v in class_to_idx.items()}
            CLASS_NAMES = [idx_to_class[i] for i in range(num_classes)]
            print(f" [INFO] Loaded {num_classes} class names from checkpoint")
        elif num_classes != len(CLASS_NAMES):
            # Fallback to generic names if not in checkpoint
            CLASS_NAMES = [f"class_{i}" for i in range(num_classes)]
            print(f" [INFO] Using {num_classes} generic class labels")

        model = model.to(_device)
        model.eval()

        _swin_model = model
        _model_loaded = True

        print(f" [SUCCESS] Model loaded successfully!")
        print(f" [INFO] Classes: {num_classes} | Device: {_device}")

        return True

    except Exception as e:
        print(f" [ERROR] Failed to load model: {str(e)}")
        print(f" [INFO] Using mock mode")
        _model_loaded = False
        return False


def is_model_loaded() -> bool:
    """
    Check if Swin Transformer model is loaded.

    Returns:
        bool: True if model is loaded, False otherwise
    """
    return _model_loaded and _swin_model is not None


def get_image_transform():
    """
    Get image preprocessing transform for Swin Transformer.

    Returns:
        torchvision.transforms: Transform pipeline
    """
    return transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])


def get_tta_transforms():
    """
    Get Test Time Augmentation transforms for improved accuracy.

    Returns:
        list: List of transform pipelines for TTA
    """
    base_normalize = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    tta_transforms = [
        # Original
        transforms.Compose([
            transforms.Resize((256, 256)),
            base_normalize
        ]),
        # Horizontal flip
        transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.RandomHorizontalFlip(p=1.0),
            base_normalize
        ]),
        # Vertical flip
        transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.RandomVerticalFlip(p=1.0),
            base_normalize
        ]),
        # Center crop from slightly larger
        transforms.Compose([
            transforms.Resize((282, 282)),
            transforms.CenterCrop(256),
            base_normalize
        ]),
    ]

    return tta_transforms


def classify_image(
    image_path: str,
    confidence_threshold: float = CONFIDENCE_THRESHOLD,
    top_k: int = 5,
    use_tta: bool = True
) -> Dict:
    """
    Classify skin condition in an image using Swin Transformer with TTA.

    Args:
        image_path: Path to the image file
        confidence_threshold: Minimum confidence score (0.0 to 1.0)
        top_k: Number of top predictions to return
        use_tta: Whether to use Test Time Augmentation (slower but more accurate)

    Returns:
        dict: Classification results with format:
            {
                "success": bool,
                "predictions": [
                    {
                        "condition": str,
                        "confidence": float
                    }
                ],
                "error": str (if success is False)
            }
    """
    # Check if model is loaded
    if not is_model_loaded():
        return _mock_classification(image_path, top_k)

    try:
        # Check if image exists
        if not os.path.exists(image_path):
            return {
                "success": False,
                "predictions": [],
                "error": f"Image file not found: {image_path}",
            }

        # Load and validate image
        try:
            image = Image.open(image_path).convert("RGB")
        except Exception as img_error:
            return {
                "success": False,
                "predictions": [],
                "error": "Unable to read the image file. Please ensure it's a valid image format (JPG, PNG, GIF, or WebP).",
            }

        # Check image dimensions - reject images that are too small or corrupted
        width, height = image.size
        if width < 50 or height < 50:
            return {
                "success": False,
                "predictions": [],
                "error": "Image is too small. Please upload a larger, clearer image (minimum 50x50 pixels).",
            }

        # Check if image is too blurry or low quality using variance of Laplacian
        import cv2
        import numpy as np

        # Convert PIL image to numpy array for quality check
        img_array = np.array(image)
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # If variance is very low, image is likely too blurry
        if laplacian_var < 10:
            return {
                "success": False,
                "predictions": [],
                "error": "Image appears to be too blurry or low quality. Please upload a clearer, well-focused image.",
            }

        if use_tta:
            # Use Test Time Augmentation for better accuracy
            tta_transforms = get_tta_transforms()
            all_outputs = []

            with torch.no_grad():
                for transform in tta_transforms:
                    image_tensor = transform(image).unsqueeze(0).to(_device)
                    outputs = _swin_model(image_tensor)
                    probabilities = torch.nn.functional.softmax(outputs, dim=1)
                    all_outputs.append(probabilities)

            # Average predictions from all augmentations
            avg_probabilities = torch.mean(torch.stack(all_outputs), dim=0)
            confidences, indices = torch.topk(avg_probabilities, k=min(top_k, len(CLASS_NAMES)))
        else:
            # Single prediction without TTA
            transform = get_image_transform()
            image_tensor = transform(image).unsqueeze(0).to(_device)

            with torch.no_grad():
                outputs = _swin_model(image_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)
                confidences, indices = torch.topk(probabilities, k=min(top_k, len(CLASS_NAMES)))

        # Parse results
        predictions = []
        for conf, idx in zip(confidences[0], indices[0]):
            confidence_value = float(conf.cpu().numpy())
            if confidence_value >= confidence_threshold:
                predictions.append({
                    "condition": CLASS_NAMES[int(idx)],
                    "confidence": round(confidence_value * 100, 2)  # Convert to percentage
                })

        return {
            "success": True,
            "predictions": predictions,
        }

    except Exception as e:
        return {
            "success": False,
            "predictions": [],
            "error": f"Classification error: {str(e)}",
        }


def _mock_classification(image_path: str, top_k: int = 5) -> Dict:
    """
    Return mock classification results when model is not loaded.
    Used for testing and development.

    Args:
        image_path: Path to image (not used in mock)
        top_k: Number of predictions to return

    Returns:
        dict: Mock classification results
    """
    mock_predictions = [
        {"condition": "atopic_dermatitis", "confidence": 85.5},
        {"condition": "melanocytic_nevus", "confidence": 72.3},
        {"condition": "benign_keratosis", "confidence": 58.7},
        {"condition": "vascular_lesion", "confidence": 45.2},
        {"condition": "dermatofibroma", "confidence": 32.8},
    ]

    return {
        "success": True,
        "predictions": mock_predictions[:top_k],
        "mock": True,
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
            "device": str(_device) if _device else "unknown",
            "message": "Model not loaded - using mock mode",
        }

    return {
        "loaded": True,
        "model_path": _model_path,
        "device": str(_device),
        "classes": CLASS_NAMES,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "model_type": "Swin Transformer",
    }
