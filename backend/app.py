from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from utils.file_cleanup import cleanup_old_files
from services.swin_service import (
    load_swin_model,
    classify_image,
    is_model_loaded,
    get_model_info,
)
from services.gemini_service import (
    load_gemini_client,
    is_gemini_available,
    generate_explanation,
    generate_chat_response,
)

# Create Flask application instance
app = Flask(__name__)

# Enable CORS to allow frontend to connect
# This allows requests from any origin (for development)
# In production, you'd specify allowed origins
CORS(app)

# Configuration constants for file uploads
UPLOAD_FOLDER = "uploads"  # Directory where uploaded images will be saved
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}  # Allowed image file extensions
MAX_FILE_SIZE = 10 * 1024 * 1024  # Maximum file size: 10MB (in bytes)
CLEANUP_MAX_AGE_HOURS = 1  # Delete files older than 1 hour
MODEL_PATH = "models/swin_best.pt"  # Path to Swin Transformer model file

# Ensure uploads directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Ensure models directory exists
os.makedirs("models", exist_ok=True)

# Initialize models
print("\n" + "=" * 70)
print(" SWIN TRANSFORMER MODEL INITIALIZATION")
print("=" * 70)
model_loaded = load_swin_model(MODEL_PATH)
print("=" * 70 + "\n")

print("=" * 70)
print(" GEMINI API INITIALIZATION")
print("=" * 70)
gemini_loaded = load_gemini_client()
print("=" * 70 + "\n")


# Helper function to check if file extension is allowed
def allowed_file(filename):
    """
    Check if the file has an allowed extension.

    Args:
        filename: The name of the file to check

    Returns:
        True if the file extension is allowed, False otherwise
    """
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# Health check route - test if backend is running
@app.route("/health", methods=["GET"])
def health_check():
    """
    Simple health check endpoint to verify the server is running.
    Frontend can call this to test connectivity.
    """
    return jsonify({"status": "ok", "message": "Backend is running"}), 200


# Image upload route
@app.route("/upload", methods=["POST"])
def upload_image():
    """
    Handle image upload from frontend.
    Validates the file, saves it temporarily, and returns file information.
    """
    print(f"\n[UPLOAD] Received upload request")

    # Check if file was sent in the request
    if "image" not in request.files:
        print(f"[UPLOAD] Error: No image in request.files")
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]

    # Check if file was actually selected (not empty)
    if file.filename == "":
        print(f"[UPLOAD] Error: Empty filename")
        return jsonify({"error": "No file selected"}), 400

    # Validate file extension
    if not allowed_file(file.filename):
        print(f"[UPLOAD] Error: Invalid file type - {file.filename}")
        return jsonify({"error": "Invalid file type. Only JPG, JPEG, PNG, GIF, and WebP files are allowed."}), 400

    # Validate content type
    if not file.content_type.startswith("image/"):
        print(f"[UPLOAD] Error: Invalid content type - {file.content_type}")
        return jsonify({"error": "File must be an image"}), 400

    # Read file to check size
    file.seek(0, os.SEEK_END)  # Move to end of file
    file_size = file.tell()  # Get file size
    file.seek(0)  # Reset to beginning

    # Validate file size
    if file_size > MAX_FILE_SIZE:
        print(f"[UPLOAD] Error: File too large - {file_size / (1024 * 1024):.2f}MB")
        return jsonify({"error": f"File too large. Maximum size: {MAX_FILE_SIZE / (1024 * 1024):.1f}MB"}), 400

    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit(".", 1)[1].lower()
    unique_filename = f"rash_{timestamp}.{file_extension}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    try:
        file.save(file_path)
        cleanup_old_files(UPLOAD_FOLDER, max_age_hours=CLEANUP_MAX_AGE_HOURS, allowed_extensions=ALLOWED_EXTENSIONS)

        print(f"[UPLOAD] Success: {unique_filename} ({file_size / 1024:.1f}KB)")

        return jsonify({
            "success": True,
            "message": "Image uploaded successfully",
            "filename": unique_filename,
            "path": file_path,
        }), 200
    except Exception as e:
        print(f"[UPLOAD] Error: Failed to save - {str(e)}")
        return jsonify({"error": f"Failed to save image: {str(e)}"}), 500


# Cleanup endpoint - manually trigger file cleanup
@app.route("/cleanup", methods=["POST", "DELETE"])
def cleanup_files():
    """
    Manually trigger cleanup of old uploaded files.
    Deletes files older than CLEANUP_MAX_AGE_HOURS.
    """
    try:
        cleanup_result = cleanup_old_files(
            UPLOAD_FOLDER,
            max_age_hours=CLEANUP_MAX_AGE_HOURS,
            allowed_extensions=ALLOWED_EXTENSIONS,
        )

        if cleanup_result["success"]:
            return (
                jsonify(
                    {
                        "success": True,
                        "message": f"Cleanup completed. Deleted {cleanup_result['files_deleted']} file(s).",
                        "files_deleted": cleanup_result["files_deleted"],
                        "errors": (
                            cleanup_result["errors"]
                            if cleanup_result["errors"]
                            else None
                        ),
                    }
                ),
                200,
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Cleanup completed with errors",
                        "files_deleted": cleanup_result["files_deleted"],
                        "errors": cleanup_result["errors"],
                    }
                ),
                200,
            )
    except Exception as e:
        return jsonify({"error": f"Failed to cleanup files: {str(e)}"}), 500


# Analysis endpoint - classify skin condition using Swin Transformer
@app.route("/analyze", methods=["POST"])
def classify_skin_condition():
    """
    Classify skin condition using Swin Transformer model.
    Requires 'image_path' or 'filename' in request body.

    Returns top K predictions with confidence scores and Gemini AI explanation.
    """
    try:
        # Get image path and user context from request
        data = request.get_json() or {}
        image_path = data.get("image_path") or data.get("path")
        filename = data.get("filename")
        user_context = (
            data.get("user_context")
            or data.get("user_description")
            or data.get("description")
            or ""
        )
        top_k = data.get("top_k", 5)  # Default to top 5 predictions

        # If filename provided, construct full path
        if filename and not image_path:
            potential_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(potential_path):
                image_path = potential_path
            else:
                test_images_path = os.path.join("test_images", filename)
                if os.path.exists(test_images_path):
                    image_path = test_images_path
                else:
                    image_path = potential_path

        # Validate image path
        if not image_path:
            print(f"[ANALYZE] Error: No image provided")
            return jsonify({
                "success": False,
                "error": "Please upload an image to analyze. No image was provided.",
                "predictions": []
            }), 400

        if not os.path.exists(image_path):
            print(f"[ANALYZE] Error: Image file not found - {image_path}")
            return jsonify({
                "success": False,
                "error": "The uploaded image could not be found. Please try uploading again.",
                "predictions": []
            }), 404

        import time
        start_time = time.time()

        # Run Swin classification (without TTA for faster inference)
        print(f"\n[ANALYZE] Processing: {os.path.basename(image_path)}")
        classification_result = classify_image(image_path, top_k=top_k, use_tta=False)

        if not classification_result["success"]:
            error_msg = classification_result.get("error", "Classification failed")
            print(f"[ANALYZE] Error: {error_msg}")
            return jsonify({
                "success": False,
                "error": error_msg,
                "predictions": [],
            }), 400 if "blurry" in error_msg.lower() or "small" in error_msg.lower() else 500

        predictions = classification_result["predictions"]

        # If no predictions found, return early with helpful message
        if not predictions or len(predictions) == 0:
            print(f"[ANALYZE] Warning: No confident predictions found")
            return jsonify({
                "success": False,
                "error": "Unable to identify the skin condition with confidence. Please ensure the image is clear, well-lit, and focused on the affected area.",
                "predictions": [],
                "primary_condition": None,
                "confidence": None,
                "ai_explanation": None,
                "explanation_available": False,
                "model_loaded": is_model_loaded(),
                "mock": classification_result.get("mock", False),
            }), 400

        # Get primary prediction (highest confidence)
        primary_prediction = predictions[0]

        classification_time = time.time() - start_time
        print(f"[CLASSIFY] Found {len(predictions)} predictions in {classification_time:.2f}s")
        for i, pred in enumerate(predictions, 1):
            print(f"           {i}. {pred.get('condition')} ({pred.get('confidence')}%)")

        # Convert predictions to format compatible with Gemini
        # (using same structure as YOLO detections for compatibility)
        gemini_predictions = [
            {"rash_label": pred["condition"], "confidence": pred["confidence"]}
            for pred in predictions
        ]

        # Generate AI explanation using Gemini
        if user_context and user_context.strip():
            print(f"[CONTEXT] User description provided ({len(user_context)} chars)")

        gemini_start = time.time()
        gemini_result = generate_explanation(gemini_predictions, user_context=user_context)
        gemini_time = time.time() - gemini_start

        if gemini_result["success"]:
            print(f"[GEMINI] Generated explanation ({len(gemini_result.get('explanation', ''))} chars) in {gemini_time:.2f}s")
        else:
            print(f"[GEMINI] Failed: {gemini_result.get('error')}")

        total_time = time.time() - start_time
        print(f"[ANALYZE] Total time: {total_time:.2f}s\n")

        # Combine Swin classification results with Gemini explanation
        response_data = {
            "success": True,
            "predictions": predictions,
            "primary_condition": primary_prediction["condition"],
            "confidence": primary_prediction["confidence"],
            "ai_explanation": (
                gemini_result.get("explanation") if gemini_result["success"] else None
            ),
            "explanation_available": gemini_result["success"],
            "explanation_error": (
                gemini_result.get("error") if not gemini_result["success"] else None
            ),
            "model_loaded": is_model_loaded(),
            "mock": classification_result.get("mock", False),
        }

        return jsonify(response_data), 200

    except Exception as e:
        import traceback
        print(f"\n[ERROR] Classification failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Classification error: {str(e)}"}), 500


# Follow-up chat endpoint - continue conversation with Gemini
@app.route("/chat", methods=["POST"])
def chat_followup():
    """
    Handle follow-up questions about an analysis using Gemini API.
    Maintains conversation context.
    """
    try:
        data = request.get_json() or {}
        user_message = data.get("message", "")
        conversation_history = data.get("conversation_history", [])
        analysis_context = data.get("analysis_context", {})

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        print(f"\n[CHAT] User: {user_message[:100]}{'...' if len(user_message) > 100 else ''}")

        # Call Gemini API with conversation context
        gemini_result = generate_chat_response(
            user_message=user_message,
            conversation_history=conversation_history,
            analysis_context=analysis_context
        )

        if gemini_result["success"]:
            print(f"[CHAT] Response generated ({len(gemini_result.get('explanation', ''))} chars)\n")
            return jsonify({
                "success": True,
                "response": gemini_result.get("explanation"),
            }), 200
        else:
            print(f"[CHAT] Failed: {gemini_result.get('error')}\n")
            return jsonify({
                "success": False,
                "error": gemini_result.get("error", "Failed to generate response")
            }), 500

    except Exception as e:
        import traceback
        print(f"\n[ERROR] Chat failed: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Chat error: {str(e)}"}), 500


# Model info endpoint
@app.route("/model/info", methods=["GET"])
def model_info():
    """
    Get information about the loaded Swin Transformer model.
    """
    info = get_model_info()
    return jsonify(info), 200


# Main entry point - runs the Flask development server
if __name__ == "__main__":
    # Run on localhost, port 5000
    # debug=True enables auto-reload on code changes (useful for development)
    app.run(host="0.0.0.0", port=5000, debug=True)
