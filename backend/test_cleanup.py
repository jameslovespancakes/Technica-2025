"""
Test script to check file ages and test cleanup functionality.
Run this to debug cleanup issues.
"""

import os
import time
from utils.file_cleanup import get_file_age_hours, cleanup_old_files

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}

print("=" * 60)
print("FILE CLEANUP TEST")
print("=" * 60)

# Check all files in uploads folder
if os.path.exists(UPLOAD_FOLDER):
    files = os.listdir(UPLOAD_FOLDER)
    print(f"\nFound {len(files)} file(s) in {UPLOAD_FOLDER}/")
    print("-" * 60)

    for filename in files:
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        if os.path.isdir(file_path):
            print(f"{filename} - [DIRECTORY]")
            continue

        if filename == ".gitkeep":
            print(f"{filename} - [.gitkeep - skipped]")
            continue

        # Get file age
        age_hours = get_file_age_hours(file_path)

        if age_hours is not None:
            age_minutes = age_hours * 60
            print(f"{filename}")
            print(f"  Age: {age_hours:.2f} hours ({age_minutes:.1f} minutes)")
            print(f"  Will be deleted if > 1 hour: {'YES' if age_hours > 1 else 'NO'}")
        else:
            print(f"{filename} - [Could not determine age]")
        print()
else:
    print(f"Upload folder '{UPLOAD_FOLDER}' does not exist!")

print("=" * 60)
print("Testing cleanup with 1 hour threshold...")
print("=" * 60)

result = cleanup_old_files(
    UPLOAD_FOLDER, max_age_hours=1, allowed_extensions=ALLOWED_EXTENSIONS
)

print(f"\nCleanup Result:")
print(f"  Success: {result['success']}")
print(f"  Files deleted: {result['files_deleted']}")
if result["errors"]:
    print(f"  Errors: {result['errors']}")
else:
    print(f"  Errors: None")

print("\n" + "=" * 60)
