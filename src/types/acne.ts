export type AcneDetection = {
  class: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
};

export type AcneAnalysisResponse = {
  image_width: number;
  image_height: number;
  detections: AcneDetection[];
  total_detections: number;
  lesions_summary?: Record<string, number>;
};
