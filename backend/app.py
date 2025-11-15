from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from datetime import datetime

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

# Ensure uploads directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


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


# Main entry point - runs the Flask development server
if __name__ == "__main__":
    # Run on localhost, port 5000
    # debug=True enables auto-reload on code changes (useful for development)
    app.run(host="0.0.0.0", port=5000, debug=True)
