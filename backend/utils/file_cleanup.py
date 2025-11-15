import os
import time
from datetime import datetime


def get_file_age_hours(file_path):
    """
    Get the age of a file in hours based on its modification time.

    Args:
        file_path: Path to the file

    Returns:
        float: Age of file in hours, or None if file doesn't exist
    """
    try:
        if not os.path.exists(file_path):
            return None

        # Get file modification time
        modification_time = os.path.getmtime(file_path)
        current_time = time.time()

        # Calculate age in hours
        age_seconds = current_time - modification_time
        age_hours = age_seconds / 3600  # Convert to hours

        return age_hours
    except Exception as e:
        print(f"Error getting file age for {file_path}: {str(e)}")
        return None


def cleanup_old_files(upload_folder, max_age_hours=1, allowed_extensions=None):
    """
    Delete old image files from the upload folder.

    Args:
        upload_folder: Path to the upload folder
        max_age_hours: Maximum age in hours before file is deleted (default: 1 hour)
        allowed_extensions: Set of allowed file extensions to check (default: None, checks all)

    Returns:
        dict: {
            "success": bool,
            "files_deleted": int,
            "errors": list of error messages
        }
    """
    if allowed_extensions is None:
        allowed_extensions = {"jpg", "jpeg", "png", "gif"}

    files_deleted = 0
    errors = []

    try:
        # Check if folder exists
        if not os.path.exists(upload_folder):
            return {
                "success": False,
                "files_deleted": 0,
                "errors": [f"Upload folder does not exist: {upload_folder}"],
            }

        # Get all files in the upload folder
        files = os.listdir(upload_folder)

        for filename in files:
            file_path = os.path.join(upload_folder, filename)

            # Skip directories
            if os.path.isdir(file_path):
                continue

            # Skip .gitkeep file
            if filename == ".gitkeep":
                continue

            # Check if file has allowed extension
            file_extension = (
                filename.rsplit(".", 1)[1].lower() if "." in filename else ""
            )
            if file_extension not in allowed_extensions:
                continue

            # Get file age
            age_hours = get_file_age_hours(file_path)

            if age_hours is None:
                errors.append(f"Could not determine age for: {filename}")
                continue

            # Debug: Print file age for all files
            print(
                f"Checking file: {filename} - Age: {age_hours:.2f} hours (threshold: {max_age_hours} hours)"
            )

            # Delete if file is older than threshold
            if age_hours > max_age_hours:
                try:
                    os.remove(file_path)
                    files_deleted += 1
                    print(f"Deleted old file: {filename} (age: {age_hours:.2f} hours)")
                except Exception as e:
                    error_msg = f"Failed to delete {filename}: {str(e)}"
                    errors.append(error_msg)
                    print(f"Error: {error_msg}")

        return {
            "success": True,
            "files_deleted": files_deleted,
            "errors": errors,
        }

    except Exception as e:
        error_msg = f"Error during cleanup: {str(e)}"
        errors.append(error_msg)
        print(f"Error: {error_msg}")
        return {
            "success": False,
            "files_deleted": files_deleted,
            "errors": errors,
        }
