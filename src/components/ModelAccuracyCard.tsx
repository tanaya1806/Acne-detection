import React, { useEffect, useState } from 'react';
import type { ModelInfo } from '../types/acne';
import { fetchModelInfo } from '../services/acneDetection';
import { Gauge } from 'lucide-react';

export const ModelAccuracyCard: React.FC = () => {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  useEffect(() => {
    fetchModelInfo().then(setInfo);
  }, []);
  if (!info) return null;
  return (
    <details className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Gauge className="w-3.5 h-3.5 text-blue-400" />
        Model Accuracy &amp; Limits
      </summary>
      <div className="mt-3 text-xs text-slate-300 space-y-3">
        <p className="text-slate-400">
          {info.model}. Tested on {info.test_set.photos} unseen photos ({info.test_set.lesions} lesions, IoU ≥ {info.test_set.iou}).
        </p>
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr className="text-slate-500 text-left">
              <th className="font-medium">Confidence</th>
              <th className="font-medium">Precision</th>
              <th className="font-medium">Recall</th>
              <th className="font-medium">F1</th>
            </tr>
          </thead>
          <tbody>
            {info.metrics.map((m) => (
              <tr key={m.confidence}>
                <td>{Math.round(m.confidence * 100)}%</td>
                <td>{Math.round(m.precision * 100)}%</td>
                <td>{Math.round(m.recall * 100)}%</td>
                <td>{m.f1.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="list-disc pl-4 space-y-1 text-slate-400">
          {info.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </details>
  );
};
