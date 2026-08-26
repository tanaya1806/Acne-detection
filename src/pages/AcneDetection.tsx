import React, { useState, useEffect } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { DetectionCanvas } from '../components/DetectionCanvas';
import { DetectionTable } from '../components/DetectionTable';
import { analyzeAcne } from '../services/acneDetection';
import type { AcneDetection } from '../types/acne';
import { AlertCircle, Loader2 } from 'lucide-react';

type Status = 'idle' | 'analyzing' | 'results' | 'error';

export const AcneDetection: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [detections, setDetections] = useState<AcneDetection[]>([]);
  const [lesionsSummary, setLesionsSummary] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    return () => {
      // Cleanup object URL
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setImagePreviewUrl(URL.createObjectURL(selectedFile));
    setStatus('idle');
    setDetections([]);
    setLesionsSummary({});
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setStatus('analyzing');
    try {
      const response = await analyzeAcne(file);
      setDetections(response.detections);
      setLesionsSummary(response.lesions_summary || {});
      setStatus('results');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('Failed to analyze the image. Please try again.');
    }
  };

  const reset = () => {
    setFile(null);
    setImagePreviewUrl(null);
    setStatus('idle');
    setDetections([]);
    setLesionsSummary({});
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      {/* Header */}
      <header className="mb-10 text-center">
        <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-2">Clinderma</h2>
        <h1 className="text-3xl font-extrabold text-neutral-900 mb-3">Acne Detection</h1>
        <p className="text-neutral-500">Upload a facial image to detect acne lesions.</p>
      </header>

      {/* Main Content Area */}
      <main className="space-y-8">
        
        {/* Upload State */}
        {!file && (
          <div className="max-w-xl mx-auto">
            <ImageUploader onImageSelected={handleImageSelected} />
          </div>
        )}

        {/* Image Selected / Analyzing / Results States */}
        {file && imagePreviewUrl && (
          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Left Column: Image Canvas */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <DetectionCanvas imageUrl={imagePreviewUrl} detections={detections} />
                
                {status === 'idle' && (
                  <div className="flex gap-4">
                    <button
                      onClick={handleAnalyze}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Analyze Image
                    </button>
                    <button
                      onClick={reset}
                      className="px-6 py-3 border border-neutral-300 text-neutral-600 font-semibold rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
                
                {status === 'analyzing' && (
                  <div className="flex items-center justify-center py-4 text-blue-600 font-medium cursor-not-allowed opacity-75">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </div>
                )}

                {status === 'error' && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Error</p>
                      <p className="text-sm mt-1">{errorMessage}</p>
                      <button onClick={reset} className="mt-3 text-sm font-semibold underline text-red-800">
                        Try again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Results */}
              <div className="w-full md:w-1/2 space-y-8">
                {status === 'results' ? (
                  <>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
                      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Detections</p>
                      <p className="text-5xl font-extrabold text-blue-700">{detections.length}</p>
                    </div>
                    
                    {Object.keys(lesionsSummary).length > 0 && (
                      <div className="bg-white border border-neutral-200 rounded-lg p-6">
                        <p className="text-sm font-semibold text-neutral-800 uppercase tracking-wide mb-4">Lesions Summary</p>
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(lesionsSummary).map(([lesion, count]) => (
                            <div key={lesion} className="bg-neutral-100 px-4 py-2 rounded-full flex items-center justify-between min-w-[120px] flex-1">
                              <span className="text-neutral-700 font-medium capitalize">{lesion.replace(/_/g, ' ')}</span>
                              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">Detected Lesions</h3>
                      <DetectionTable detections={detections} />
                    </div>
                    
                    <button
                      onClick={reset}
                      className="w-full py-3 border border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors mt-4"
                    >
                      Upload New Image
                    </button>
                  </>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center p-12 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-400 bg-neutral-50/50">
                    <p className="text-center text-sm">Results will appear here after analysis.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
