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
│  │  • MODEL_PATH = "models/rash_model.pt"                          │  │
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
│  │  │  YOLOv8 Model Loading     │  │  Gemini API Client       │   │  │
│  │  │                          │  │                          │   │  │
│  │  │  load_yolo_model()       │  │  load_gemini_client()    │   │  │
│  │  │         │                │  │         │                │   │  │
│  │  │         ├─► Missing?    │  │         ├─► API Key?     │   │  │
│  │  │         │   Mock Mode   │  │         │   Available    │   │  │
│  │  │         │                │  │         │                │   │  │
│  │  │         └─► Loaded?      │  │         └─► Ready        │   │  │
│  │  │            Real Mode     │  │            gemini-pro    │   │  │
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
                   │ 3. Run Detection  │
                   │                    │
                   │    detect_rash()  │
                   │         │         │
                   │         ├─► Model │
                   │         │  Loaded?│
                   │         │         │
                   │         ├─► NO ──►│
                   │         │         │
                   │         │  _mock_ │
                   │         │  detection()│
                   │         │         │
                   │         └─► YES ──►│
                   │                    │
                   │         _yolo_model│
                   │         .predict() │
                   │                    │
                   │         _parse_yolo│
                   │         _results() │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │ 4. Get Detection  │
                   │    Results        │
                   │    • rash_label   │
                   │    • confidence   │
                   │    • bounding_box │
                   └─────────┬─────────┘
                             │
                             ▼
                   ┌───────────────────┐
                   │ 5. Call Gemini    │
                   │    API            │
                   │                    │
                   │    generate_      │
                   │    explanation()  │
                   │         │         │
                   │         ├─► Format │
                   │         │  prompt │
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
                   │ 6. Combine &      │
                   │    Return JSON    │
                   │    • success      │
                   │    • detections[] │
                   │    • rash_label   │
                   │    • confidence   │
                   │    • bounding_box │
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

### **2. YOLOv8 Service (services/yolo_service.py)**

```
┌─────────────────────────────────────────────────────────┐
│              YOLOv8 Service Module                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Global State:                                          │
│  • _yolo_model (YOLO instance)                         │
│  • _model_loaded (bool)                                 │
│  • _model_path (str)                                    │
│                                                         │
│  Functions:                                             │
│  ┌─────────────────────────────────────┐              │
│  │ load_yolo_model(path)                │              │
│  │   ├─► Check file exists              │              │
│  │   ├─► Load YOLO(model_path)         │              │
│  │   ├─► Extract class names           │              │
│  │   └─► Set global state               │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ detect_rash(image_path)             │              │
│  │   ├─► Check model loaded?           │              │
│  │   │   ├─► NO ──► _mock_detection()  │              │
│  │   │   └─► YES ──► Run YOLO predict  │              │
│  │   │              └─► _parse_results │              │
│  │   └─► Return formatted results      │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ _parse_yolo_results(results)        │              │
│  │   ├─► Extract boxes, conf, classes  │              │
│  │   ├─► Convert xyxy → x,y,w,h        │              │
│  │   ├─► Filter by confidence          │              │
│  │   └─► Sort by confidence            │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ _mock_detection(image_path)          │              │
│  │   └─► Return placeholder data       │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ get_model_info()                     │              │
│  │   └─► Return model status           │              │
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
│ Call detect_rash│
│ (image_path)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Model Loaded?   │
└────────┬────────┘
         │
         ├─► NO ──► Return Mock Detection
         │
         ▼ YES
┌─────────────────┐
│ YOLOv8 Predict  │
│ • Load image    │
│ • Run inference │
│ • Get results   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parse Results   │
│ • Extract boxes │
│ • Get confidences│
│ • Get class IDs │
│ • Format data   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Detection│
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
│ /analyze     │─────►│ YOLOv8       │
│ Endpoint     │      │ Detection    │
└──────────────┘      └──────┬───────┘
                             │
                             │ Results
                             │
                             ▼
┌──────────────┐      ┌──────────────┐
│ Frontend     │◄─────│ JSON Response│
│ Displays     │      │ with         │
│ Results      │      │ detections   │
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
        │ load_yolo_model()│
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
│ Load YOLO()   │   │ Set Mock Mode │
└───────┬───────┘   └───────┬───────┘
        │                   │
        ├─► Success         │
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ Real Mode     │   │ Mock Mode     │
│ _model_loaded │   │ _model_loaded │
│ = True        │   │ = False       │
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
│   └── yolo_service.py       # YOLOv8 detection logic
│       ├── Model loading
│       ├── Detection
│       └── Result parsing
│
├── utils/
│   ├── __init__.py
│   └── file_cleanup.py        # File cleanup utility
│       ├── Age calculation
│       └── File deletion
│
├── models/
│   └── rash_model.pt         # YOLOv8 model file (when available)
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
- Receives filename → Validates path → Calls YOLOv8 → Parses → Returns

### **3. Model Service**
- Checks if loaded → Uses real model OR mock → Returns formatted results

### **4. Cleanup Utility**
- Scans folder → Checks age → Deletes old files → Returns count

---

## Summary

**Main Components:**
1. **Flask App** - Handles HTTP requests
2. **YOLOv8 Service** - Model loading and detection
3. **File Cleanup** - Manages temporary files
4. **File System** - Stores models and uploads

**Key Flows:**
1. **Upload Flow** - File → Validation → Save → Cleanup → Response
2. **Analysis Flow** - Filename → Path → YOLOv8 → Parse → Response
3. **Model Loading** - Startup → Check → Load → Set State

**State Management:**
- Model loaded state (global)
- Mock vs Real mode
- File cleanup state

---

## Pending Implementation (Not Yet Built)

### Phase 4: Gemini API Integration ⏳

```
┌─────────────────────────────────────────────────────────┐
│         CURRENT: Analysis Returns YOLOv8 Results        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              TO BE IMPLEMENTED                          │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ services/gemini_service.py           │              │
│  │                                      │              │
│  │ Functions Needed:                    │              │
│  │ • get_explanation(yolo_results)      │              │
│  │ • format_prompt_for_gemini()         │              │
│  │ • call_gemini_api(prompt)            │              │
│  │ • parse_gemini_response()            │              │
│  └──────────────────┬───────────────────┘              │
│                     │                                   │
│                     ▼                                   │
│  ┌─────────────────────────────────────┐              │
│  │ Gemini API Integration              │              │
│  │                                      │              │
│  │ Input:                               │              │
│  │ • Rash label (from YOLOv8)          │              │
│  │ • Confidence score                   │              │
│  │ • Request for explanation            │              │
│  │                                      │              │
│  │ Process:                             │              │
│  │ • Format prompt                      │              │
│  │ • Send to Gemini API                │              │
│  │ • Handle API errors                 │              │
│  │ • Parse response                     │              │
│  │                                      │              │
│  │ Output:                              │              │
│  │ • AI-generated explanation          │              │
│  │ • Context about condition           │              │
│  │ • Recommendations                   │              │
│  └─────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Missing Components:**
- `services/gemini_service.py` - Gemini API client
- Environment variable for API key (`.env` file)
- Prompt formatting logic
- Error handling for API failures
- Response parsing

**Expected Flow:**
```
YOLOv8 Detection → Format Results → Gemini API → Parse Response → Return Combined
```

---

### Phase 5: End-to-End Integration ⏳

```
┌─────────────────────────────────────────────────────────┐
│         CURRENT: Separate Upload & Analyze              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              TO BE IMPLEMENTED                          │
│                                                         │
│  Complete Workflow:                                      │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ POST /upload                        │              │
│  │   │                                 │              │
│  │   ├─► Save Image                   │              │
│  │   │                                 │              │
│  │   ├─► Run YOLOv8 Detection         │              │
│  │   │   └─► Get rash label,          │              │
│  │   │       confidence, bbox         │              │
│  │   │                                 │              │
│  │   ├─► Send to Gemini API          │              │
│  │   │   └─► Get explanation          │              │
│  │   │                                 │              │
│  │   ├─► Combine All Results          │              │
│  │   │                                 │              │
│  │   └─► Return Single JSON Response  │              │
│  │       {                             │              │
│  │         "rash_label": "...",        │              │
│  │         "confidence": 85.5,        │              │
│  │         "bounding_box": {...},      │              │
│  │         "ai_explanation": "..."    │              │
│  │       }                             │              │
│  └─────────────────────────────────────┘              │
│                                                         │
│  OR                                                     │
│                                                         │
│  ┌─────────────────────────────────────┐              │
│  │ Enhanced POST /analyze              │              │
│  │   │                                 │              │
│  │   ├─► YOLOv8 Detection             │              │
│  │   ├─► Gemini Explanation            │              │
│  │   └─► Combined Response            │              │
│  └─────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Missing Components:**
- Integration of Gemini service into analyze endpoint
- Combined response format
- Error handling for partial failures (YOLO works, Gemini fails)
- File cleanup after analysis completion

**Expected Response Format:**
```json
{
  "success": true,
  "rash_label": "eczema",
  "confidence": 85.5,
  "bounding_box": {
    "x": 100,
    "y": 150,
    "width": 200,
    "height": 180
  },
  "ai_explanation": "Eczema is a common skin condition...",
  "recommendations": ["Keep skin moisturized", "Avoid triggers"],
  "model_loaded": true
}
```

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
- [x] YOLOv8 service structure
- [x] Model loading (with mock mode)
- [x] Mock detection with top 3 conditions
- [x] Analysis endpoint (`POST /analyze`)
- [x] Model info endpoint (`GET /model/info`)
- [x] Cleanup endpoint (`POST /cleanup`)
- [x] Health check endpoint (`GET /health`)
- [x] Error handling
- [x] System documentation

**Phase 4: Gemini API Integration** ✅
- [x] Create `services/gemini_service.py`
- [x] Set up Gemini API client
- [x] Format YOLOv8 results for Gemini prompt (supports top 3 detections)
- [x] Format prompt with user context prominently featured
- [x] Call Gemini API
- [x] Parse Gemini response
- [x] Handle API errors
- [x] Add API key support via `.env`
- [x] Optimized prompt for faster responses
- [x] Generation config for performance

**Phase 5: End-to-End Integration** ✅
- [x] Integrate Gemini into analyze endpoint
- [x] Combine YOLOv8 + Gemini results
- [x] Update response format (includes all detections + explanation)
- [x] Handle partial failures (returns YOLOv8 results even if Gemini fails)
- [x] Frontend-backend connection
- [x] User context integration (image + text description)
- [x] Top 3 detections support
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
   ├─► Run YOLOv8 Detection
   │   ├─► Model loaded? → Real detection
   │   └─► Model missing? → Mock detection
   │   └─► Returns: {rash_label, confidence, bounding_box}
   │
   ├─► Call Gemini API
   │   ├─► Format prompt with detection results
   │   ├─► Send to Gemini API
   │   └─► Returns: {ai_explanation: "..."}
   │
   ├─► Combine All Results
   │   └─► Merge YOLOv8 + Gemini data
   │
   └─► Return Complete JSON:
       {
         "success": true,
         "rash_label": "eczema",
         "confidence": 85.5,
         "bounding_box": {...},
         "ai_explanation": "Full Gemini explanation...",
         "explanation_available": true,
         "detections": [...],
         "mock": true
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

### **Enhanced Analyze Endpoint**
- `POST /analyze` - Will include Gemini explanation in response

### **Potential New Endpoints**
- `GET /api/docs` - API documentation (Swagger)
- `POST /api/health/detailed` - Detailed health check with model status
- `GET /api/stats` - Usage statistics (if needed)

---

## Dependencies Needed

### **For Gemini Integration:**
- ✅ `google-generativeai` - Already in requirements.txt
- ⏳ Gemini API key - Need to obtain
- ⏳ `.env` file - Need to create

### **For Production:**
- ⏳ `gunicorn` - Production server
- ⏳ `python-dotenv` - Environment variable loading
- ⏳ `flask-limiter` - Rate limiting (optional)
- ⏳ `flasgger` or `flask-restx` - API documentation (optional)

---

## Next Steps Priority

1. **High Priority:**
   - Gemini API integration (Phase 4)
   - End-to-end workflow (Phase 5)

2. **Medium Priority:**
   - Configuration management
   - Logging system

3. **Low Priority:**
   - Rate limiting
   - API documentation
   - Unit tests
   - Production deployment

