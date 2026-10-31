import os
import io
import time
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np
import onnxruntime as ort
from PIL import Image

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
ACNE_MODEL_PATH = Path(os.getenv("ACNE_MODEL_PATH", MODELS_DIR / "acne_rfdetr_small.onnx"))
ACNE_CLASSES_PATH = MODELS_DIR / "acne_classes.txt"
MODEL_INPUT_SIZE = 512
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
# 0.15 minimised GAGS grading error on 106 labelled patient photos (0.30 under-graded 3x more often)
DEFAULT_CONFIDENCE_THRESHOLD = float(os.getenv("ACNE_CONFIDENCE_THRESHOLD", 0.15))

def compute_iou(box1: Dict[str, float], box2: Dict[str, float]) -> float:
    """Computes Intersection over Union (IoU) between two bounding boxes."""
    ix1 = max(box1["x1"], box2["x1"])
    iy1 = max(box1["y1"], box2["y1"])
    ix2 = min(box1["x2"], box2["x2"])
    iy2 = min(box2["y2"], box2["y2"])

    inter_w = max(0.0, ix2 - ix1)
    inter_h = max(0.0, iy2 - iy1)
    intersection = inter_w * inter_h
    if intersection <= 0.0:
        return 0.0

    area1 = max(1.0, (box1["x2"] - box1["x1"]) * (box1["y2"] - box1["y1"]))
    area2 = max(1.0, (box2["x2"] - box2["x1"]) * (box2["y2"] - box2["y1"]))
    union = area1 + area2 - intersection
    if union <= 0.0:
        return 0.0
    return intersection / union

def apply_nms(
    detections: list[Dict[str, Any]],
    cross_class_iou: float = 0.30,
    same_class_iou: float = 0.55,
) -> list[Dict[str, Any]]:
    """Applies cross-class Non-Maximum Suppression (IoU 0.30 across different class labels)
    per Clinderma standard, while preserving adjacent clustered lesions of the same class.
    """
    if not detections:
        return detections

    sorted_dets = sorted(detections, key=lambda d: d.get("confidence", 0.0), reverse=True)
    kept: list[Dict[str, Any]] = []

    for det in sorted_dets:
        box = det["bbox"]
        cls = det.get("class", "")
        suppress = False
        for k in kept:
            iou = compute_iou(box, k["bbox"])
            if cls != k.get("class", ""):
                # Duplicate box across different class labels: suppress if IoU >= 0.30
                if iou >= cross_class_iou:
                    suppress = True
                    break
            else:
                # Same-class lesion: only suppress if nearly identical duplicate box
                if iou >= same_class_iou:
                    suppress = True
                    break
        if not suppress:
            kept.append(det)

    return kept


class AcneDetector:
    """Locally trained RF-DETR small (ONNX), 4 classes: comedone, nodule, papule, pustule."""

    def __init__(self):
        self.model_path = ACNE_MODEL_PATH
        self.model_id = f"local-rfdetr-small ({self.model_path.name})"
        self.confidence_threshold = DEFAULT_CONFIDENCE_THRESHOLD
        self.class_names = [
            c.strip() for c in ACNE_CLASSES_PATH.read_text().splitlines() if c.strip()
        ] if ACNE_CLASSES_PATH.exists() else ["comedone", "nodule", "papule", "pustule"]
        self._session: Optional[ort.InferenceSession] = None

    def is_model_available(self) -> bool:
        return self.model_path.exists()

    def load_model(self):
        if self._session is None:
            if not self.is_model_available():
                raise FileNotFoundError(f"Acne model not found at {self.model_path}")
            self._session = ort.InferenceSession(
                str(self.model_path), providers=["CPUExecutionProvider"]
            )
            self._input_name = self._session.get_inputs()[0].name
        print("====================================")
        print("ACNE MODEL (LOCAL RF-DETR ONNX)")
        print(f"Model: {self.model_path}")
        print(f"Classes: {self.class_names}")
        print(f"Default Confidence: {self.confidence_threshold}")
        print("====================================")

    def _run(self, image: Image.Image):
        if self._session is None:
            self.load_model()
        # Plain stretch to 512x512 (no crop), /255, ImageNet normalisation
        arr = np.asarray(
            image.convert("RGB").resize((MODEL_INPUT_SIZE, MODEL_INPUT_SIZE), Image.BILINEAR),
            dtype=np.float32,
        ) / 255.0
        arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
        tensor = arr.transpose(2, 0, 1)[None].astype(np.float32)
        outputs = self._session.run(None, {self._input_name: tensor})
        names = [o.name for o in self._session.get_outputs()]
        out = dict(zip(names, outputs))
        return out["dets"][0], out["labels"][0]

    def predict(
        self,
        image_bytes: bytes,
        confidence: Optional[float] = None,
        iou_threshold: float = 0.30,
    ) -> Dict[str, Any]:
        """Runs local ONNX inference, applies NMS deduplication, and returns detections."""
        start_time = time.time()
        conf_to_use = confidence if confidence is not None else self.confidence_threshold

        image = Image.open(io.BytesIO(image_bytes))
        img_w, img_h = image.size

        dets, logits = self._run(image)
        n_cls = len(self.class_names)
        scores = 1.0 / (1.0 + np.exp(-logits[:, :n_cls]))  # channel 4 is unused

        raw_detections = []
        for i in range(dets.shape[0]):
            c = int(np.argmax(scores[i]))
            score = float(scores[i, c])
            if score < conf_to_use:
                continue
            cx, cy, w, h = (float(v) for v in dets[i])
            x1 = max(0.0, min((cx - w / 2.0) * img_w, float(img_w - 1)))
            y1 = max(0.0, min((cy - h / 2.0) * img_h, float(img_h - 1)))
            x2 = max(0.0, min((cx + w / 2.0) * img_w, float(img_w)))
            y2 = max(0.0, min((cy + h / 2.0) * img_h, float(img_h)))
            if (x2 - x1) < 2 or (y2 - y1) < 2:
                continue
            raw_detections.append({
                "class": self.class_names[c],
                "confidence": round(score, 4),
                "bbox": {"x1": round(x1, 2), "y1": round(y1, 2), "x2": round(x2, 2), "y2": round(y2, 2)},
            })

        detections = apply_nms(raw_detections, cross_class_iou=iou_threshold)

        lesions_summary = {}
        for d in detections:
            lesions_summary[d["class"]] = lesions_summary.get(d["class"], 0) + 1

        inference_time_ms = int((time.time() - start_time) * 1000)
        print(f"Acne inference (conf={conf_to_use}, nms={iou_threshold}): {inference_time_ms} ms, raw: {len(raw_detections)}, post-nms: {len(detections)}")

        return {
            "image_width": img_w,
            "image_height": img_h,
            "detections": detections,
            "total_detections": len(detections),
            "lesions_summary": lesions_summary,
            "confidence_threshold": conf_to_use,
        }
