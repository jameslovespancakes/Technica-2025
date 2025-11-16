# Backend System Architecture Diagram

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vite)                           │
│                      http://localhost:5173                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              Analysis Page (Analysis.jsx)                        │  │
│  │  • AnimatedAIChat - Image upload interface                      │  │
│  │  • AnalysisResults - Chat display with Gemini responses         │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                               │                                          │
│                               │ HTTP Requests                            │
│                               │ (via base44Client.js)                    │
│                               ▼                                          │
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLASK BACKEND SERVER                                 │
│                   http://localhost:5000                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    app.py (Main Application)                    │  │
│  │                                                                  │  │
│  │  Configuration:                                                  │  │
│  │  • UPLOAD_FOLDER = "uploads"                                    │  │
│  │  • MODEL_PATH = "models/swin_best.pt"                            │  │
│  │  • MAX_FILE_SIZE = 10MB                                         │  │
│  │  • CLEANUP_MAX_AGE_HOURS = 1                                    │  │
│  │  • CORS enabled for frontend                                    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                               │                                          │
│                               │ Startup                                  │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │         Service Initialization (Startup)                          │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐   │  │
│  │  │  Swin Transformer Model    │  │  Gemini API Client       │   │  │
│  │  │  Loading                   │  │                          │   │  │
│  │  │                          │  │                          │   │  │
│  │  │  load_swin_model()        │  │  load_gemini_client()    │   │  │
│  │  │         │                │  │         │                │   │  │
│  │  │         ├─► Missing?    │  │         ├─► API Key?     │   │  │
│  │  │         │   Mock Mode   │  │         │   Available    │   │  │
│  │  │         │                │  │         │                │   │  │
│  │  │         └─► Loaded?      │  │         └─► Ready        │   │  │
│  │  │            Real Mode     │  │            gemini-2.0-    │   │  │
│  │  │            (216 classes) │  │            flash-001      │   │  │
│  │  └──────────────────────────┘  └──────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   /health     │    │   /upload     │    │   /analyze    │
│   (GET)       │    │   (POST)      │    │   (POST)      │
└───────────────┘    └───────────────┘    └───────────────┘
        │                      │                      │
        │                      │                      │
        ▼                      ▼                      ▼
   Returns OK      ┌───────────────────┐    ┌───────────────────┐
                   │ 1. Validate File  │    │ 1. Get Image Path │
                   │    • Extension    │    │    • filename      │
                   │    • Content Type │    │    • image_path    │
                   │    • File Size    │    │                   │
                   └─────────┬─────────┘    └─────────┬─────────┘
                             │                        │
                             ▼                        │
                   ┌───────────────────┐             │
                   │ 2. Generate       │             │
                   │    Unique Name     │             │
                   │    rash_TIMESTAMP  │             │
                   └─────────┬─────────┘             │
                             │                        │
                             ▼                        │
                   ┌───────────────────┐             │
                   │ 3. Save File      │             │
                   │    uploads/       │             │
                   └─────────┬─────────┘             │
                             │                        │
                             ▼                        │
                   ┌───────────────────┐             │
                   │ 4. Cleanup Old    │◄────────────┘
                   │    Files (>1hr)   │
                   │                    │
                   │    Uses:          │
                   │    cleanup_old_   │
                   │    files()        │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │ 5. Return JSON    │
                   │    • success      │
                   │    • filename     │
                   │    • path         │
                   └───────────────────┘
                             │
                             │
                             ▼
                   ┌───────────────────┐
                   │ 2. Validate Path  │
                   │    • File exists? │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │ 3. Validate Image  │
                   │    Quality         │
                   │    • Size check    │
                   │    • Blur check    │
                   │    (Laplacian var) │
                   └─────────┬─────────┘
                             │
                             ├─► Invalid ──► Return 400 Error
                             │
                             ▼ Valid
                   ┌───────────────────┐
                   │ 4. Run            │
                   │    Classification │
                   │                    │
                   │    classify_image()│
                   │         │         │
                   │         ├─► Model │
                   │         │  Loaded?│
                   │         │         │
                   │         ├─► NO ──►│
                   │         │         │
                   │         │  _mock_ │
                   │         │  classification()│
                   │         │         │
                   │         └─► YES ──►│
                   │                    │
                   │         Preprocess │
                   │         • Resize   │
                   │         • Normalize│
                   │                    │
                   │         TTA?       │
                   │         (optional)  │
                   │         • 10 augs  │
                   │                    │
                   │         _swin_model│
                   │         (forward)   │
                   │                    │
                   │         Softmax    │
                   │         Top-K      │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │ 5. Get Predictions│
                   │    Results        │
                   │    • predictions[]│
                   │      - condition   │
                   │      - confidence  │
                   │    • primary_     │
                   │      condition     │
                   │    • top_k (5)     │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │ 6. Call Gemini    │
                   │    API            │
                   │                    │
                   │    generate_      │
                   │    explanation()  │
                   │         │         │
                   │         ├─► Format │
                   │         │  prompt │
                   │         │  (with  │
                   │         │  predictions)│
                   │         │         │
                   │         ├─► Send  │
                   │         │  to    │
                   │         │  Gemini│
                   │         │         │
                   │         └─► Get   │
                   │             explanation│
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │ 7. Combine &      │
                   │    Return JSON    │
                   │    • success      │
                   │    • predictions[] │
                   │      - condition   │
                   │      - confidence  │
                   │    • primary_     │
                   │      condition     │
                   │    • confidence   │
                   │    • ai_explanation│
                   │    • explanation_ │
                   │      available    │
                   │    • model_loaded │
                   │    • mock         │
                   └───────────────────┘
```

---

## Component Breakdown

### **1. Flask Application (app.py)**

```
┌─────────────────────────────────────────────────────────┐
│                    Flask App                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Routes:                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ GET /health │  │POST /upload │  │POST /analyze│   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐                     │
│  │POST /cleanup│  │GET /model/  │                     │
│  │DELETE       │  │    info     │                     │
│  └─────────────┘  └─────────────┘                     │
│                                                         │
│  Helper Functions:                                     │
│  • allowed_file(filename)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### **2. Swin Transformer Service (services/swin_service.py)**

```
┌─────────────────────────────────────────────────────────┐
│          Swin Transformer Service Module                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Global State:                                          │
│  • _swin_model (timm model instance)                    │
│  • _model_loaded (bool)                                 │
│  • _model_path (str)                                    │
│  • _device (torch.device)                               │
│  • CLASS_NAMES (list of 216 conditions)                 │
│                                                         │
│  Functions:                                             │
│  ┌─────────────────────────────────────┐              │
│  │ load_swin_model(path)               │              │
│  │   ├─► Check file exists              │              │
│  │   ├─► Load checkpoint                │              │
│  │   ├─► Detect num_classes             │              │
│  │   ├─► Create timm model              │              │
│  │   │   (swinv2_small_window16_256)    │              │
│  │   ├─► Load state dict                 │              │
│  │   ├─► Load class names                │              │
│  │   └─► Set global state                │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ classify_image(image_path, top_k,   │              │
│  │                use_tta)              │              │
│  │   ├─► Check model loaded?           │              │
│  │   │   ├─► NO ──► _mock_classification()│            │
│  │   │   └─► YES ──► Continue           │              │
│  │   ├─► Load & validate image          │              │
│  │   │   ├─► Check size (>50x50)        │              │
│  │   │   └─► Check blur (Laplacian)     │              │
│  │   ├─► Preprocess image               │              │
│  │   │   ├─► Resize (256x256)           │              │
│  │   │   └─► Normalize                  │              │
│  │   ├─► TTA? (if use_tta=True)        │              │
│  │   │   ├─► 10 augmentations           │              │
│  │   │   └─► Average predictions        │              │
│  │   ├─► Run model forward pass         │              │
│  │   ├─► Softmax                         │              │
│  │   ├─► Top-K predictions              │              │
│  │   └─► Return formatted results       │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ get_image_transform()               │              │
│  │   └─► Return preprocessing pipeline  │              │
│  │       (Resize, ToTensor, Normalize)  │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ get_tta_transforms()                │              │
│  │   └─► Return 10 augmentation        │              │
│  │       pipelines                      │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ _mock_classification(image_path)     │              │
│  │   └─► Return top 5 mock predictions │              │
│  │       (realistic condition names)    │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ get_model_info()                     │              │
│  │   └─► Return model status           │              │
│  │       (loaded, path, device, classes)│              │
│  └─────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### **3. Gemini Service (services/gemini_service.py)**

```
┌─────────────────────────────────────────────────────────┐
│              Gemini Service Module                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Global State:                                          │
│  • _gemini_model (GenerativeModel instance)            │
│  • _gemini_available (bool)                            │
│                                                         │
│  Configuration:                                         │
│  • GEMINI_MODEL = "gemini-2.0-flash-001"               │
│  • TIMEOUT_SECONDS = 30                                │
│                                                         │
│  Functions:                                             │
│  ┌─────────────────────────────────────┐              │
│  │ load_gemini_client()                 │              │
│  │   ├─► Get API key from .env         │              │
│  │   ├─► Configure genai               │              │
│  │   ├─► Initialize GenerativeModel    │              │
│  │   └─► Set global state               │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ generate_explanation(detection)      │              │
│  │   ├─► Check if available            │              │
│  │   ├─► Format prompt                 │              │
│  │   ├─► Call Gemini API               │              │
│  │   └─► Return explanation text       │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ format_prompt_for_gemini()          │              │
│  │   └─► Create medical prompt with    │              │
│  │       detection data                │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ get_gemini_info()                    │              │
│  │   └─► Return API status             │              │
│  └─────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### **4. File Cleanup Utility (utils/file_cleanup.py)**

```
┌─────────────────────────────────────────────────────────┐
│            File Cleanup Utility                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ get_file_age_hours(file_path)        │              │
│  │   ├─► Get modification time         │              │
│  │   ├─► Calculate age in hours        │              │
│  │   └─► Return age                    │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ cleanup_old_files(folder, max_age)  │              │
│  │   ├─► List all files in folder      │              │
│  │   ├─► For each file:                │              │
│  │   │   ├─► Skip .gitkeep             │              │
│  │   │   ├─► Check extension           │              │
│  │   │   ├─► Get file age              │              │
│  │   │   ├─► Age > threshold?          │              │
│  │   │   │   └─► YES ──► Delete file   │              │
│  │   │   └─► NO ──► Keep file          │              │
│  │   └─► Return deletion count         │              │
│  └─────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagrams

### **Upload Flow**

```
Frontend
   │
   │ POST /upload
   │ Content-Type: multipart/form-data
   │ Body: {image: File}
   │
   ▼
┌─────────────────┐
│ Flask receives  │
│ request         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate File   │
│ • Extension?    │
│ • Content Type? │
│ • Size < 10MB?  │
└────────┬────────┘
         │
         ├─► Invalid ──► Return 400 Error
         │
         ▼ Valid
┌─────────────────┐
│ Generate Unique │
│ Filename        │
│ rash_TIMESTAMP  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to         │
│ uploads/ folder │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cleanup Old     │
│ Files (>1hr)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Success  │
│ JSON Response   │
└─────────────────┘
```

---

### **Analysis Flow**

```
Frontend
   │
   │ POST /analyze
   │ Content-Type: application/json
   │ Body: {filename: "rash_XXX.png"}
   │
   ▼
┌─────────────────┐
│ Flask receives  │
│ request         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract Path    │
│ • filename?     │
│ • image_path?   │
└────────┬────────┘
         │
         ├─► Missing ──► Return 400 Error
         │
         ▼ Valid
┌─────────────────┐
│ Check File      │
│ Exists?         │
└────────┬────────┘
         │
         ├─► Not Found ──► Return 404 Error
         │
         ▼ Exists
┌─────────────────┐
│ Validate Image  │
│ Quality         │
│ • Size check    │
│ • Blur check    │
└────────┬────────┘
         │
         ├─► Invalid ──► Return 400 Error
         │
         ▼ Valid
┌─────────────────┐
│ Call classify_  │
│ image()         │
│ (image_path,    │
│  top_k=5)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Model Loaded?   │
└────────┬────────┘
         │
         ├─► NO ──► Return Mock Predictions
         │
         ▼ YES
┌─────────────────┐
│ Preprocess Image│
│ • Resize 256x256│
│ • Normalize     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Use TTA?        │
│ (optional)      │
└────────┬────────┘
         │
         ├─► YES ──► 10 Augmentations → Average
         │
         └─► NO ──► Single Forward Pass
         │
         ▼
┌─────────────────┐
│ Swin Transformer│
│ Forward Pass    │
│ • Get logits    │
│ • Softmax        │
│ • Top-K (5)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Format Results  │
│ • predictions[] │
│ • primary_      │
│   condition     │
│ • confidence    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return          │
│ Predictions     │
│ JSON Response   │
└─────────────────┘
```

---

## Data Flow

### **Image Upload → Analysis Pipeline**

```
┌──────────────┐
│ User Uploads │
│ Image        │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│ /upload      │─────►│ Saved to    │
│ Endpoint     │      │ uploads/    │
└──────────────┘      └──────┬───────┘
                             │
                             │ Filename returned
                             │
                             ▼
┌──────────────┐      ┌──────────────┐
│ /analyze     │─────►│ Swin         │
│ Endpoint     │      │ Transformer  │
│              │      │ Classification│
└──────────────┘      └──────┬───────┘
                             │
                             │ Predictions
                             │ (Top-K)
                             │
                             ▼
┌──────────────┐      ┌──────────────┐
│ Frontend     │◄─────│ JSON Response│
│ Displays     │      │ with         │
│ Results      │      │ predictions[] │
└──────────────┘      └──────────────┘
```

---

## State Management

### **Model Loading State**

```
┌─────────────────────────────────────────┐
│         Application Startup             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
        ┌──────────────────┐
        │ load_swin_model()│
        └────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ Model Found?  │   │ Model Missing │
└───────┬───────┘   └───────┬───────┘
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ Load Checkpoint│   │ Set Mock Mode │
│ • Create timm  │   │               │
│   model        │   │               │
│ • Load weights │   │               │
│ • Detect       │   │               │
│   classes      │   │               │
└───────┬───────┘   └───────┬───────┘
        │                   │
        ├─► Success         │
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ Real Mode     │   │ Mock Mode     │
│ _model_loaded │   │ _model_loaded │
│ = True        │   │ = False       │
│ 216 classes   │   │ Top 5 mock    │
│ Device: CUDA/ │   │ predictions   │
│ CPU           │   │               │
└───────────────┘   └───────────────┘
```

---

## File System Structure

```
backend/
│
├── app.py                    # Main Flask application
│   ├── Routes
│   ├── Configuration
│   └── Model Loading (startup)
│
├── services/
│   ├── __init__.py
│   ├── swin_service.py        # Swin Transformer classification logic
│   │   ├── Model loading
│   │   ├── Image preprocessing
│   │   ├── Classification
│   │   ├── TTA (Test Time Augmentation)
│   │   └── Result formatting
│   └── gemini_service.py      # Gemini API integration
│       ├── API client
│       ├── Prompt formatting
│       └── Explanation generation
│
├── utils/
│   ├── __init__.py
│   └── file_cleanup.py        # File cleanup utility
│       ├── Age calculation
│       └── File deletion
│
├── models/
│   ├── swin_best.pt           # Swin Transformer model (when available)
│   └── class_mapping.json     # 216 skin condition mappings
│
└── uploads/
    ├── .gitkeep
    └── rash_*.png            # Uploaded images (temporary)
```

---

## Error Handling Flow

```
Request
   │
   ▼
┌─────────────────┐
│ Try Block       │
└────────┬────────┘
         │
         ├─► Success ──► Return 200 + Data
         │
         ▼ Exception
┌─────────────────┐
│ Catch Exception │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Error    │
│ • 400: Bad Request│
│ • 404: Not Found │
│ • 500: Server Error│
└─────────────────┘
```

---

## Key Interactions

### **1. Upload Endpoint**
- Receives file → Validates → Saves → Cleans up → Returns

### **2. Analyze Endpoint**
- Receives filename → Validates path → Validates image quality → Calls Swin Transformer → Gets Top-K predictions → Returns

### **3. Model Service**
- Checks if loaded → Uses real model OR mock → Preprocesses image → Runs classification (with optional TTA) → Returns Top-K predictions

### **4. Cleanup Utility**
- Scans folder → Checks age → Deletes old files → Returns count

---

## Summary

**Main Components:**
1. **Flask App** - Handles HTTP requests
2. **Swin Transformer Service** - Model loading and classification (216 classes)
3. **Gemini Service** - AI explanation generation
4. **File Cleanup** - Manages temporary files
5. **File System** - Stores models and uploads

**Key Flows:**
1. **Upload Flow** - File → Validation → Save → Cleanup → Response
2. **Analysis Flow** - Filename → Path → Quality Check → Swin Classification → Top-K Predictions → Gemini Explanation → Response
3. **Model Loading** - Startup → Check → Load Checkpoint → Create Model → Load Weights → Set State

**State Management:**
- Model loaded state (global)
- Mock vs Real mode
- File cleanup state

---

## Migration: YOLOv8 → Swin Transformer ✅

### **Completed Migration**

The system has been successfully migrated from YOLOv8 object detection to Swin Transformer image classification:

**Key Changes:**
- ✅ Model architecture: YOLOv8 → Swin Transformer (Vision Transformer)
- ✅ Model file: `rash_model.pt` → `swin_best.pt`
- ✅ Service: `yolo_service.py` → `swin_service.py`
- ✅ Output format: Detections with bounding boxes → Top-K predictions
- ✅ Classes: ~5-10 conditions → 216 skin conditions
- ✅ New features: TTA (Test Time Augmentation), image quality validation
- ✅ Library: Ultralytics → timm (PyTorch Image Models)

**Response Format Changes:**
- Removed: `bounding_box` coordinates
- Changed: `detections[]` → `predictions[]`
- Changed: `rash_label` → `primary_condition`
- Added: Top-K predictions array (default: 5)

**New Capabilities:**
- Image quality validation (blur detection, size checks)
- Test Time Augmentation for improved accuracy
- Support for 216 different skin conditions
- Dynamic class detection from model checkpoint

---

### Phase 6: Production Readiness ⏳

```
┌─────────────────────────────────────────────────────────┐
│              TO BE IMPLEMENTED                          │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ Configuration Management            │              │
│  │                                      │              │
│  │ • config.py                         │              │
│  │ • .env file support                 │              │
│  │ • Environment variables:            │              │
│  │   - GEMINI_API_KEY                 │              │
│  │   - MODEL_PATH                     │              │
│  │   - FLASK_ENV                      │              │
│  │   - UPLOAD_FOLDER                 │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ Logging System                      │              │
│  │                                      │              │
│  │ • Request logging                   │              │
│  │ • Error logging                      │              │
│  │ • Performance logging                │              │
│  │ • Log file rotation                 │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ Rate Limiting                       │              │
│  │                                      │              │
│  │ • Prevent API abuse                 │              │
│  │ • Limit requests per IP              │              │
│  │ • Limit requests per endpoint       │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ API Documentation                   │              │
│  │                                      │              │
│  │ • Swagger/OpenAPI docs               │              │
│  │ • Endpoint documentation             │              │
│  │ • Request/response examples          │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ Testing                             │              │
│  │                                      │              │
│  │ • Unit tests                        │              │
│  │ • Integration tests                 │              │
│  │ • End-to-end tests                  │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ Deployment Configuration            │              │
│  │                                      │              │
│  │ • Production server (Gunicorn)      │              │
│  │ • CORS restrictions                 │              │
│  │ • Error message sanitization        │              │
│  │ • Debug mode disabled               │              │
│  └─────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Missing Components:**
- `config.py` - Centralized configuration
- `.env` file - Environment variables
- Logging configuration
- Rate limiting middleware
- API documentation (Swagger)
- Unit tests
- Production server setup

---

## Implementation Status

### ✅ **Completed (Phase 1-5)**

**Phase 1-3: Core Backend Infrastructure**
- [x] Flask application setup
- [x] CORS configuration
- [x] Image upload endpoint (`POST /upload`)
- [x] File validation (extension, size, content type)
- [x] File cleanup utility
- [x] Swin Transformer service structure
- [x] Model loading (with mock mode)
- [x] Mock classification with top 5 conditions
- [x] Analysis endpoint (`POST /analyze`)
- [x] Model info endpoint (`GET /model/info`)
- [x] Cleanup endpoint (`POST /cleanup`)
- [x] Health check endpoint (`GET /health`)
- [x] Error handling
- [x] System documentation

**Phase 4: Gemini API Integration** ✅
- [x] Create `services/gemini_service.py`
- [x] Set up Gemini API client
- [x] Format Swin Transformer predictions for Gemini prompt (supports top-K predictions)
- [x] Format prompt with user context prominently featured
- [x] Call Gemini API
- [x] Parse Gemini response
- [x] Handle API errors
- [x] Add API key support via `.env`
- [x] Optimized prompt for faster responses
- [x] Generation config for performance
- [x] Chat follow-up endpoint (`POST /chat`)

**Phase 5: End-to-End Integration** ✅
- [x] Integrate Gemini into analyze endpoint
- [x] Combine Swin Transformer + Gemini results
- [x] Update response format (includes all predictions + explanation)
- [x] Handle partial failures (returns predictions even if Gemini fails)
- [x] Frontend-backend connection
- [x] User context integration (image + text description)
- [x] Top-K predictions support (default: 5)
- [x] Image quality validation (blur detection, size checks)
- [x] Test Time Augmentation (TTA) support
- [x] Performance timing logs
- [x] Test complete workflow

### ⏳ **Pending (Phase 6: Production Readiness)**

**Configuration & Environment**
- [ ] Create `config.py` for centralized configuration
- [x] `.env` file support (already implemented via `python-dotenv`)
- [ ] Move hardcoded constants to config file

**Logging System**
- [ ] Implement proper logging system (replace `print` statements)
- [ ] Request logging middleware
- [ ] Error logging with stack traces
- [ ] Performance logging
- [ ] Log file rotation

**Security & Performance**
- [ ] Add rate limiting (prevent API abuse)
- [ ] Sanitize error messages (don't expose internal details)
- [ ] Input validation enhancements
- [ ] Request timeout handling

**Documentation**
- [ ] Create API documentation (Swagger/OpenAPI)
- [x] Endpoint documentation (`ENDPOINTS_REFERENCE.md`)
- [ ] Update README.md with setup instructions

**Testing**
- [ ] Write unit tests for services
- [ ] Integration tests for endpoints
- [ ] End-to-end tests
- [ ] Mock service tests

**Production Deployment**
- [ ] Set up production server (Gunicorn)
- [ ] Configure CORS for production (specific origins)
- [ ] Disable debug mode
- [ ] Environment-specific configurations
- [ ] Health check monitoring
- [ ] Error tracking (optional: Sentry)

---

## Current End-to-End Flow (✅ Implemented)

```
User Uploads Image (Frontend)
   │
   ▼
POST /upload (Frontend → Backend)
   │
   ├─► Validate & Save Image
   │   └─► Returns: {filename: "rash_XXX.png"}
   │
   ▼
POST /analyze (Frontend → Backend)
   │ Body: {filename: "rash_XXX.png"}
   │
   ├─► Validate Image Quality
   │   ├─► Size check (>50x50 pixels)
   │   └─► Blur check (Laplacian variance)
   │
   ├─► Run Swin Transformer Classification
   │   ├─► Model loaded? → Real classification
   │   └─► Model missing? → Mock classification
   │   ├─► Preprocess image (resize, normalize)
   │   ├─► Optional: TTA (10 augmentations)
   │   ├─► Forward pass through model
   │   ├─► Softmax + Top-K (default: 5)
   │   └─► Returns: {predictions[], primary_condition, confidence}
   │
   ├─► Call Gemini API
   │   ├─► Format prompt with prediction results
   │   ├─► Include user context (if provided)
   │   ├─► Send to Gemini API
   │   └─► Returns: {ai_explanation: "..."}
   │
   ├─► Combine All Results
   │   └─► Merge Swin predictions + Gemini explanation
   │
   └─► Return Complete JSON:
       {
         "success": true,
         "predictions": [
           {"condition": "atopic_dermatitis", "confidence": 85.5},
           {"condition": "melanocytic_nevus", "confidence": 72.3},
           ...
         ],
         "primary_condition": "atopic_dermatitis",
         "confidence": 85.5,
         "ai_explanation": "Full Gemini explanation...",
         "explanation_available": true,
         "model_loaded": true,
         "mock": false
       }
   │
   ▼
Frontend Receives Response
   │
   ├─► Transform to frontend format
   │   └─► condition_name, severity, recommendations
   │
   └─► Display in Chat Interface
       └─► AnalysisResults component shows Gemini explanation
```

---

## Missing Endpoints (Future)

### **Enhanced Analyze Endpoint** ✅
- `POST /analyze` - Includes Swin Transformer predictions + Gemini explanation
- `POST /chat` - Follow-up chat with Gemini (context-aware)

### **Potential New Endpoints**
- `GET /api/docs` - API documentation (Swagger)
- `POST /api/health/detailed` - Detailed health check with model status
- `GET /api/stats` - Usage statistics (if needed)

---

## Dependencies Needed

### **For Gemini Integration:**
- ✅ `google-generativeai` - Already in requirements.txt
- ✅ Gemini API integration - Implemented
- ✅ `.env` file support - Implemented via python-dotenv

### **For Swin Transformer:**
- ✅ `timm` - PyTorch Image Models library
- ✅ `torch` - PyTorch framework
- ✅ `torchvision` - Image transforms
- ✅ `opencv-python` - Image quality validation

### **For Production:**
- ⏳ `gunicorn` - Production server
- ⏳ `python-dotenv` - Environment variable loading
- ⏳ `flask-limiter` - Rate limiting (optional)
- ⏳ `flasgger` or `flask-restx` - API documentation (optional)

---

## Next Steps Priority

1. **High Priority:**
   - ✅ Gemini API integration (Phase 4) - **COMPLETED**
   - ✅ End-to-end workflow (Phase 5) - **COMPLETED**
   - ✅ Swin Transformer migration - **COMPLETED**

2. **Medium Priority:**
   - Configuration management
   - Logging system
   - Update frontend for new response format

3. **Low Priority:**
   - Rate limiting
   - API documentation updates
   - Unit tests
   - Production deployment
   - Remove unused Ultralytics dependencies

