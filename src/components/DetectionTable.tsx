import React from 'react';
import type { AcneDetection } from '../types/acne';

interface DetectionTableProps {
  detections: AcneDetection[];
}

export const DetectionTable: React.FC<DetectionTableProps> = ({ detections }) => {
  if (detections.length === 0) {
    return <p className="text-neutral-500 text-sm py-4">No lesions detected.</p>;
  }

  const formatLesionName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Lesion</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {detections.map((det, idx) => (
            <tr key={idx}>
              <td className="px-4 py-3 text-neutral-900 font-medium">{formatLesionName(det.class)}</td>
              <td className="px-4 py-3 text-neutral-600">{Math.round(det.confidence * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
