# Skin Condition Classification System

A full-stack web application for automated skin condition detection and classification using deep learning. The system leverages a Swin Transformer model for image classification and provides AI-powered explanations via the Gemini API.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Model Information](#model-information)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Overview

This application enables users to upload images of skin conditions and receive automated classification results along with detailed AI-generated explanations. The system supports 216 different skin condition categories and provides confidence scores for predictions with Test Time Augmentation (TTA) for improved accuracy.

## Features

- **Image Upload and Validation**: Supports JPG, JPEG, PNG, and GIF formats with automatic file validation
- **Swin Transformer Classification**: State-of-the-art SwinV2 Tiny model for accurate skin condition detection across 216 classes
- **Test Time Augmentation (TTA)**: Multiple augmented predictions for improved accuracy and robustness
- **AI-Powered Explanations**: Integration with Google's Gemini 2.0 Flash API for detailed, context-aware condition explanations
- **Interactive Chat**: Follow-up question support with conversation context maintenance via Gemini API
- **Real-time Analysis**: Fast inference and results delivery
- **Automatic File Cleanup**: Scheduled cleanup of uploaded images to manage storage
- **RESTful API**: Clean API design for easy integration
- **Modern UI**: React-based frontend with markdown formatting, smooth animations, and responsive design

## Architecture

The application follows a client-server architecture:

- **Frontend**: React-based single-page application with Vite build system
- **Backend**: Flask REST API server with Python
- **Model**: SwinV2 Tiny Transformer (swin_best.pt) trained on 216 skin condition classes
- **AI Service**: Google Gemini 2.0 Flash API for natural language explanations and conversational support

## Technology Stack

### Backend
- Python 3.11+
- Flask 3.1.2
- PyTorch 2.9.1
- timm (PyTorch Image Models)
- Google Generative AI (Gemini API)
- OpenCV
- Pillow

### Frontend
- React 18.2.0
- Vite 5.0.8
- React Router 6.20.0
- Tailwind CSS 3.3.6
- Framer Motion
- Three.js
- GSAP

## Installation

### Prerequisites

- Python 3.11 or higher
- Node.js 16 or higher
- pip package manager
- npm package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file in the backend directory with:
```
GOOGLE_API_KEY=your_gemini_api_key_here
# or
GEMINI_API_KEY=your_gemini_api_key_here
```
Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. Ensure the model file exists:
Place the `swin_best.pt` model file in the `models/` directory.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

## Usage

### Running the Backend

From the backend directory:

```bash
python app.py
```

The server will start on `http://localhost:5000`

### Running the Frontend

From the frontend directory:

```bash
npm run dev
```

The development server will start on `http://localhost:5173` (or next available port)

### Building for Production

Frontend production build:
```bash
npm run build
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Upload Image
```
POST /upload
```
Upload an image file for analysis.

**Request**: Multipart form data with `image` field

**Response**:
```json
{
  "success": true,
  "filename": "rash_20231215_123456.jpg",
  "path": "uploads/rash_20231215_123456.jpg"
}
```

### Analyze Image
```
POST /analyze
```
Classify a skin condition from an uploaded image using Swin Transformer with TTA.

**Request Body**:
```json
{
  "filename": "rash_20231215_123456.jpg",
  "user_context": "Optional description from user",
  "top_k": 5
}
```

**Response**:
```json
{
  "success": true,
  "predictions": [
    {
      "condition": "Atopic dermatitis",
      "confidence": 85.5
    }
  ],
  "primary_condition": "Atopic dermatitis",
  "confidence": 85.5,
  "ai_explanation": "Detailed explanation from Gemini API",
  "explanation_available": true,
  "model_loaded": true
}
```

### Chat Follow-up
```
POST /chat
```
Ask follow-up questions about an analysis with conversation context.

**Request Body**:
```json
{
  "message": "What are the treatment options?",
  "conversation_history": [
    {"role": "user", "content": "What causes this?"},
    {"role": "assistant", "content": "Previous response..."}
  ],
  "analysis_context": {
    "condition": "Atopic dermatitis",
    "confidence": 85.5,
    "explanation": "Initial analysis explanation..."
  }
}
```

**Response**:
```json
{
  "success": true,
  "response": "AI-generated response maintaining context"
}
```

### Model Info
```
GET /model/info
```
Get information about the loaded model.

### Cleanup Files
```
POST /cleanup
DELETE /cleanup
```
Manually trigger cleanup of old uploaded files.

## Model Information

### Swin Transformer Model

The application uses a **SwinV2 Tiny** model trained for comprehensive skin condition classification across **216 distinct classes**.

**Model Architecture**: SwinV2 Tiny Window 8 (256x256)

**Key Features**:
- 216 skin condition classes loaded from checkpoint
- Test Time Augmentation (TTA) with 8 augmented predictions for improved robustness
- Automatic model variant detection from checkpoint
- Dynamic class name loading from model checkpoint

**Input Requirements**:
- Image size: 256x256 pixels (automatically resized)
- Format: RGB
- Normalization: ImageNet standard (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
- TTA augmentations: horizontal flip, vertical flip, rotation (90°, 180°, 270°), brightness adjustment

**Supported Conditions**: 216 classes including (but not limited to):
- Abrasion, scrape, or scab
- Acne
- Atopic dermatitis
- Basal cell carcinoma
- Blisters
- Contact dermatitis
- Eczema
- Melanoma
- Psoriasis
- Rosacea
- And 206+ additional conditions

*Full class list loaded dynamically from model checkpoint*

## Project Structure

```
Technica-2025/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── services/
│   │   ├── swin_service.py   # Swin Transformer model service
│   │   └── gemini_service.py # Gemini API integration
│   ├── utils/
│   │   └── file_cleanup.py   # File management utilities
│   ├── uploads/              # Temporary image storage
│   └── models/
│       └── swin_best.pt      # Trained model weights
├── frontend/
│   ├── src/
│   ├── Components/
│   ├── pages/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Configuration

### Backend Configuration

Edit `app.py` to modify:
- `UPLOAD_FOLDER`: Directory for uploaded images (default: "uploads")
- `MAX_FILE_SIZE`: Maximum upload size (default: 10MB)
- `CLEANUP_MAX_AGE_HOURS`: File retention period (default: 1 hour)
- `MODEL_PATH`: Path to model file (default: "models/swin_best.pt")

### Model Configuration

Edit `backend/services/swin_service.py` to modify:
- `CONFIDENCE_THRESHOLD`: Minimum confidence for predictions (default: 0.01)
- TTA settings: Enable/disable or customize augmentation strategies
- Model architecture detection and preprocessing parameters

**Note**: Class names are automatically loaded from the model checkpoint, supporting dynamic model updates without code changes.

## Contributing

This project was developed for Technica 2025.

## License

This project is part of the Technica 2025 hackathon submission.

## Acknowledgments

- Swin Transformer architecture by Microsoft Research
- Google Gemini API for natural language generation
- PyTorch and timm library for model implementation
