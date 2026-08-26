# Clinderma Backend

This is the FastAPI backend for the Clinderma acne detection model.

## Setup

1. Place the ONNX model file at `models/acne_detector.onnx`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run the server: `uvicorn app.main:app --reload`.
