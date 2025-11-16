from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from utils.file_cleanup import cleanup_old_files
from services.yolo_service import (
    load_yolo_model,
    detect_rash,
    is_model_loaded,
    get_model_info,
)
from services.gemini_service import (
    load_gemini_client,
    is_gemini_available,
    generate_explanation,
)

# Create Flask application instance
app = Flask(__name__)

# Enable CORS to allow frontend to connect
# This allows requests from any origin (for development)
# In production, you'd specify allowed origins
CORS(app)

# Configuration constants for file uploads
UPLOAD_FOLDER = "uploads"  # Directory where uploaded images will be saved
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}  # Allowed image file extensions
MAX_FILE_SIZE = 10 * 1024 * 1024  # Maximum file size: 10MB (in bytes)
CLEANUP_MAX_AGE_HOURS = 1  # Delete files older than 1 hour
MODEL_PATH = "models/rash_model.pt"  # Path to YOLOv8 model file

# Ensure uploads directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Ensure models directory exists
os.makedirs("models", exist_ok=True)

# Load YOLOv8 model on startup
print("\n" + "=" * 60)
print("🤖 Loading YOLOv8 Model")
print("=" * 60)
model_loaded = load_yolo_model(MODEL_PATH)
if model_loaded:
    print("✅ YOLOv8 model ready!")
else:
    print("⚠️  YOLOv8 model not found - using mock mode")
print("=" * 60 + "\n")

# Load Gemini API client on startup
print("=" * 60)
print("🧠 Loading Gemini API Client")
print("=" * 60)
gemini_loaded = load_gemini_client()
if gemini_loaded:
    print("✅ Gemini API client ready!")
else:
    print("⚠️  Gemini API not configured - AI explanations unavailable")
print("=" * 60 + "\n")


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
    # Check if file was sent in the request
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]

    # Check if file was actually selected (not empty)
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # Validate file extension
    if not allowed_file(file.filename):
        return (
            jsonify(
                {
                    "error": "Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed."
                }
            ),
            400,
        )

    # Validate content type
    if not file.content_type.startswith("image/"):
        return jsonify({"error": "File must be an image"}), 400

    # Read file to check size
    file.seek(0, os.SEEK_END)  # Move to end of file
    file_size = file.tell()  # Get file size
    file.seek(0)  # Reset to beginning

    # Validate file size
    if file_size > MAX_FILE_SIZE:
        return (
            jsonify(
                {
                    "error": f"File too large. Maximum size: {MAX_FILE_SIZE / (1024 * 1024):.1f}MB"
                }
            ),
            400,
        )

    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit(".", 1)[1].lower()
    unique_filename = f"rash_{timestamp}.{file_extension}"

    # Create full path to save file
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    try:
        # Save the file
        file.save(file_path)

        # Clean up old files after successful upload
        cleanup_result = cleanup_old_files(
            UPLOAD_FOLDER,
            max_age_hours=CLEANUP_MAX_AGE_HOURS,
            allowed_extensions=ALLOWED_EXTENSIONS,
        )

        # Return success response with file information
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Image uploaded successfully",
                    "filename": unique_filename,
                    "path": file_path,
                }
            ),
            200,
        )
    except Exception as e:
        # Handle any errors during file save
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


# Analysis endpoint - detect rash in uploaded image
@app.route("/analyze", methods=["POST"])
def analyze_image():
    """
    Analyze an uploaded image using YOLOv8 to detect skin rashes,
    then generate AI explanation using Gemini API.
    Requires 'image_path' or 'filename' in request body.

    Returns combined YOLOv8 detection results and Gemini AI explanation.
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

        # If filename provided, construct full path
        if filename and not image_path:
            # Try uploads folder first, then test_images folder
            potential_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(potential_path):
                image_path = potential_path
            else:
                # Try test_images folder as fallback
                test_images_path = os.path.join("test_images", filename)
                if os.path.exists(test_images_path):
                    image_path = test_images_path
                else:
                    image_path = potential_path  # Will fail validation below

        # Validate image path
        if not image_path:
            return (
                jsonify(
                    {
                        "error": "No image path provided. Send 'image_path' or 'filename' in request body."
                    }
                ),
                400,
            )

        if not os.path.exists(image_path):
            return jsonify({"error": f"Image file not found: {image_path}"}), 404

        # Run YOLOv8 detection
        detection_result = detect_rash(image_path)

        if not detection_result["success"]:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": detection_result.get("error", "Detection failed"),
                        "detections": [],
                    }
                ),
                500,
            )

        detections = detection_result["detections"]

        # If no detections found, return early
        if not detections or len(detections) == 0:
            return (
                jsonify(
                    {
                        "success": True,
                        "detections": [],
                        "rash_label": None,
                        "confidence": None,
                        "bounding_box": None,
                        "ai_explanation": None,
                        "explanation_available": False,
                        "model_loaded": is_model_loaded(),
                        "mock": detection_result.get("mock", False),
                    }
                ),
                200,
            )

        # Get top detections (up to 3, already sorted by confidence)
        top_detections = detections[:3]  # Top 3 detections
        first_detection = detections[0]  # Primary detection (highest confidence)

        import time

        start_time = time.time()

        print(f"\n🔍 Detections found: {len(detections)} total")
        for i, det in enumerate(top_detections, 1):
            print(
                f"   {i}. {det.get('rash_label')} ({det.get('confidence')}% confidence)"
            )
        print(f"📤 Sending top {len(top_detections)} detections to Gemini API...")

        detection_time = time.time() - start_time
        print(f"⏱️  Detection took: {detection_time:.2f}s")

        # Generate AI explanation using Gemini with all top detections and user context
        if user_context and user_context.strip():
            print(
                f"💬 User provided context: \"{user_context[:100]}{'...' if len(user_context) > 100 else ''}\""
            )
        gemini_start = time.time()
        gemini_result = generate_explanation(top_detections, user_context=user_context)
        gemini_time = time.time() - gemini_start

        if gemini_result["success"]:
            print(
                f"✅ Gemini explanation received ({len(gemini_result.get('explanation', ''))} chars) in {gemini_time:.2f}s"
            )
        else:
            print(
                f"❌ Gemini failed: {gemini_result.get('error')} (took {gemini_time:.2f}s)"
            )

        total_time = time.time() - start_time
        print(f"⏱️  Total analysis time: {total_time:.2f}s")

        # Combine YOLOv8 detection results with Gemini explanation
        response_data = {
            "success": True,
            "detections": detections,  # Keep all detections for reference
            "rash_label": first_detection["rash_label"],
            "confidence": first_detection["confidence"],
            "bounding_box": first_detection["bounding_box"],
            "ai_explanation": (
                gemini_result.get("explanation") if gemini_result["success"] else None
            ),
            "explanation_available": gemini_result["success"],
            "explanation_error": (
                gemini_result.get("error") if not gemini_result["success"] else None
            ),
            "model_loaded": is_model_loaded(),
            "mock": detection_result.get("mock", False),
        }

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": f"Analysis error: {str(e)}"}), 500


# Model info endpoint
@app.route("/model/info", methods=["GET"])
def model_info():
    """
    Get information about the loaded YOLOv8 model.
    """
    info = get_model_info()
    return jsonify(info), 200


# Main entry point - runs the Flask development server
if __name__ == "__main__":
    # Run on localhost, port 5000
    # debug=True enables auto-reload on code changes (useful for development)
    app.run(host="0.0.0.0", port=5000, debug=True)
