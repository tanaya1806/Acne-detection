import type { AcneAnalysisResponse } from '../types/acne';

export const analyzeAcne = async (imageFile: File): Promise<AcneAnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await fetch('http://localhost:8000/api/acne/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze image');
  }

  return response.json();
};
