from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from app.acne_detector import AcneDetector

app = FastAPI(title="Clinderma Acne Detection API")

# Configure CORS for Vite development server
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate the detector
detector = AcneDetector()

@app.on_event("startup")
async def startup_event():
    # Log model config on startup
    try:
        detector.load_model()
    except Exception as e:
        print(f"Warning on startup: {e}")

@app.post("/api/acne/analyze")
async def analyze_image(file: UploadFile = File(...)) -> Dict[str, Any]:
    # Check if a file was uploaded
    if not file:
        raise HTTPException(status_code=400, detail="No upload file sent")
        
    # Read the file content
    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="There was an error parsing the uploaded file")

    if not detector.is_model_available():
        raise HTTPException(
            status_code=503, 
            detail="Roboflow API key is missing. Please set ROBOFLOW_API_KEY."
        )
        
    try:
        # Run inference via API
        result = detector.predict(contents)
        return result
    except Exception as e:
        print(f"Inference error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to analyze the image. Please try again."
        )
