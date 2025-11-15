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

