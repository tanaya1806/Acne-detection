import os
import requests
import io
import time
import base64
from typing import Dict, Any
from PIL import Image

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "T8q7J07ioYGmmvTOzzp5")
ROBOFLOW_MODEL_ID = "tanayaaa/acne-detection-v1-tjjbs-2-rfdetr-small-t1"
# Default to 0.25 if not set in environment
DEFAULT_CONFIDENCE_THRESHOLD = float(os.getenv("ACNE_CONFIDENCE_THRESHOLD", 0.25))

class AcneDetector:
    def __init__(self):
        self.api_key = ROBOFLOW_API_KEY
        self.model_id = ROBOFLOW_MODEL_ID
        self.confidence_threshold = DEFAULT_CONFIDENCE_THRESHOLD

    def is_model_available(self) -> bool:
        """Check if the API key is set."""
        return bool(self.api_key)
        
    def load_model(self):
        """Not required for hosted API, just prints config."""
        if not self.is_model_available():
            print("WARNING: ROBOFLOW_API_KEY is not set in the environment.")
            
        print("====================================")
        print("ACNE MODEL (ROBOFLOW API)")
        print("====================================")
        print(f"Model ID: {self.model_id}")
        print(f"API Key Set: {self.is_model_available()}")
        print(f"Confidence threshold: {self.confidence_threshold}")
        print("====================================")

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """Runs inference via Roboflow Hosted API and returns detections."""
        if not self.is_model_available():
            raise ValueError("ROBOFLOW_API_KEY is missing. Cannot call inference API.")
            
        start_time = time.time()
            
        # 1. Decode image just to get original dimensions for response
        image = Image.open(io.BytesIO(image_bytes))
        img_w, img_h = image.size
        
        # 2. Call Roboflow API
        url = f"https://detect.roboflow.com/{self.model_id}?api_key={self.api_key}&confidence={int(self.confidence_threshold*100)}"
        
        # Base64 encode the image for Roboflow API
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        res = requests.post(
            url,
            data=image_b64,
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )
        
        if not res.ok:
            raise Exception(f"Roboflow API error: {res.status_code} - {res.text}")
            
        result_json = res.json()
        raw_predictions = result_json.get("predictions", [])
        
        # 3. Post-processing
        detections = []
        lesions_summary = {}
        
        for p in raw_predictions:
            cls = str(p["class"])
            x_center = float(p["x"])
            y_center = float(p["y"])
            width = float(p["width"])
            height = float(p["height"])
            
            # Roboflow returns center coords in original image scale
            x1 = x_center - (width / 2)
            y1 = y_center - (height / 2)
            x2 = x_center + (width / 2)
            y2 = y_center + (height / 2)
            
            # Clip bounds
            x1 = max(0.0, min(x1, float(img_w)))
            y1 = max(0.0, min(y1, float(img_h)))
            x2 = max(0.0, min(x2, float(img_w)))
            y2 = max(0.0, min(y2, float(img_h)))
            
            detections.append({
                "class": cls,
                "confidence": float(p["confidence"]),
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2)
                }
            })
            
            # Count lesions
            lesions_summary[cls] = lesions_summary.get(cls, 0) + 1
                
        inference_time_ms = int((time.time() - start_time) * 1000)
        print(f"Acne inference API call: {inference_time_ms} ms")
        print(f"Detections returned: {len(detections)}")

        return {
            "image_width": img_w,
            "image_height": img_h,
            "detections": detections,
            "total_detections": len(detections),
            "lesions_summary": lesions_summary
        }
