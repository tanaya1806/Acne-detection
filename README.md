# Clinderma - Unified Facial Preprocessing & Acne Detection Pipeline

A clinical-grade AI pipeline combining **MediaPipe Face Mesh landmark orientation & 5-zone anatomical segmentation** with an **RF-DETR deep learning acne detection model** to provide end-to-end acne classification and Global Acne Grading System (GAGS) evaluation.

---

## 🌟 Key Features

1. **4-Stage Automated Pipeline**:
   - **Stage 1: Image Input & Validation**: Ingestion of patient clinical photographs with sample benchmark selection.
   - **Stage 2: Facial Preprocessing**: MediaPipe 468-landmark mesh detection, view orientation classification (`FRONT`, `LEFT_PROFILE`, `RIGHT_PROFILE`), and generation of 5 anatomical region masks (`forehead`, `left_cheek`, `right_cheek`, `nose`, `chin`).
   - **Stage 3: Deep Learning Acne Detection**: locally run RF-DETR small (ONNX) detecting `comedone`, `nodule`, `papule` and `pustule` (no cyst class yet). No patient photo leaves the machine.
   - **Stage 4: Spatial Zone Fusion & GAGS Grading**: Intersects detected lesion bounding boxes with facial region masks, maps each lesion to its anatomical zone, and calculates local zone scores and global GAGS severity.

2. **Interactive Multi-Layer Canvas**:
   - **Full Pipeline Composite**: Combines region segmentation masks with bounding boxes and zone tags.
   - **Acne Boxes**: Clean view of bounding boxes, confidence badges, and lesion classifications.
   - **Facial Zones**: Color-coded anatomical zones with smooth alpha-blended contours.
   - **Face Mesh**: 468 MediaPipe landmark wireframe, midline, and boundary polylines.
   - **Raw**: Unprocessed source photograph.

3. **Clinical Dashboard & Analytics**:
   - **Global Acne Grading System (GAGS)** score card with severity indicator (Mild, Moderate, Severe, Very Severe).
   - **Zone Factor Breakdown**: Individual scores for Forehead (×2), Left Cheek (×2), Right Cheek (×2), Nose (×1), Chin (×1).
   - **Head Pose & Asymmetry**: Nose shift ratio, eye asymmetry ratio, and view classification.
   - **Filterable Lesions Catalog**: Searchable table by zone or lesion type with jump-to-box highlighting and full JSON report export.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, MediaPipe, OpenCV, ONNX Runtime, Ultralytics, PyTorch, Uvicorn
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite 8

---

## 🚀 How to Run

### 0. One-time setup (files that are not in this repository)

- **Acne model:** put `acne_rfdetr_small.onnx` in `backend/models/` (123 MB, shared privately; `acne_classes.txt` is already there). Override the path with `ACNE_MODEL_PATH`.
- **V_3 preprocessing:** clone `https://github.com/Harsh2517-coder/Clinderma` (branch `V3-preprocess-training`) into `preprocessing/Clinderma` and run its `V_3/models/download_models.sh` for the YOLOv8-face and face-parsing models.
- **Confidence:** default 0.15 (`ACNE_CONFIDENCE_THRESHOLD`), the best GAGS grading on 106 labelled photos.
- **Severity:** the higher of the GAGS zone band and a lesion-count band, so widespread acne is not reported as mild.
- **FaceVeda:** this UI is also built into FaceVeda as the Acne Lab (`ACNE_LAB_OUT=<faceveda>/static/acne-lab npm run build`).

### 1. Backend Server (FastAPI)

```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run the API server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API runs at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend Application (React + Vite)

```powershell
# From the project root (d:\CLINDERMA\prototype)
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📡 API Endpoints

- `POST /api/pipeline/run` - Runs the complete end-to-end pipeline (Preprocessing + Model + Zone Fusion + GAGS).
- `POST /api/preprocess` - Runs facial landmark extraction, orientation, and 5-zone segmentation masks only.
- `POST /api/acne/analyze` - Runs RF-DETR acne lesion detection model only.
- `GET /api/samples` - Retrieves pre-loaded benchmark patient photographs.
- `GET /api/samples/{filename}` - Serves sample patient images.
- `GET /api/health` - Health check status for the backend engine and local model.
- `GET /api/model/info` - Model description and measured accuracy / limits.
