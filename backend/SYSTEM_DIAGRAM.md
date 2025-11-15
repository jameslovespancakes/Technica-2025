# Backend System Architecture Diagram

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vite)                           │
│                      http://localhost:5173                              │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               │ HTTP Requests
                               │
                               ▼
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
│  └─────────────────────────────────────────────────────────────────┘  │
│                               │                                          │
│                               │ Startup                                  │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              YOLOv8 Model Loading (Startup)                      │  │
│  │                                                                  │  │
│  │  load_yolo_model(MODEL_PATH)                                    │  │
│  │         │                                                        │  │
│  │         ├─► Model exists? ──NO──► Mock Mode                     │  │
│  │         │                                                        │  │
│  │         └─► YES ──► Load YOLO(model_path)                       │  │
│  │                    │                                             │  │
│  │                    ├─► Success ──► Real Detection Mode          │  │
│  │                    │                                             │  │
│  │                    └─► Error ──► Mock Mode                      │  │
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
                   │ 4. Return JSON    │
                   │    • success      │
                   │    • detections[] │
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

### **3. File Cleanup Utility (utils/file_cleanup.py)**

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

### ✅ Completed (Phase 1-3)

- [x] Flask application setup
- [x] CORS configuration
- [x] Image upload endpoint (`POST /upload`)
- [x] File validation (extension, size, content type)
- [x] File cleanup utility
- [x] YOLOv8 service structure
- [x] Model loading (with mock mode)
- [x] Analysis endpoint (`POST /analyze`)
- [x] Model info endpoint (`GET /model/info`)
- [x] Cleanup endpoint (`POST /cleanup`)
- [x] Health check endpoint (`GET /health`)
- [x] Error handling
- [x] System documentation

### ⏳ Pending (Phase 4-6)

**Phase 4: Gemini API Integration**
- [ ] Create `services/gemini_service.py`
- [ ] Set up Gemini API client
- [ ] Format YOLOv8 results for Gemini prompt
- [ ] Call Gemini API
- [ ] Parse Gemini response
- [ ] Handle API errors
- [ ] Add API key to `.env`

**Phase 5: End-to-End Integration**
- [ ] Integrate Gemini into analyze endpoint
- [ ] Combine YOLOv8 + Gemini results
- [ ] Update response format
- [ ] Handle partial failures
- [ ] File cleanup after analysis
- [ ] Test complete workflow

**Phase 6: Production Readiness**
- [ ] Create `config.py` for configuration
- [ ] Add `.env` file support
- [ ] Implement logging system
- [ ] Add rate limiting
- [ ] Create API documentation
- [ ] Write unit tests
- [ ] Set up production server
- [ ] Configure CORS for production
- [ ] Sanitize error messages

---

## Future System Flow (Complete Implementation)

```
User Uploads Image
   │
   ▼
POST /upload
   │
   ├─► Validate & Save Image
   │
   ├─► Run YOLOv8 Detection
   │   └─► Get: label, confidence, bbox
   │
   ├─► Send to Gemini API
   │   └─► Get: explanation, recommendations
   │
   ├─► Combine All Results
   │
   ├─► Clean Up Temporary File
   │
   └─► Return Complete JSON:
       {
         "rash_label": "...",
         "confidence": 85.5,
         "bounding_box": {...},
         "ai_explanation": "...",
         "recommendations": [...]
       }
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

