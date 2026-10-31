import React from 'react';
import type { AcneTypeSummary } from '../types/acne';
import { Microscope } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  comedone: 'bg-yellow-400',
  papule: 'bg-amber-500',
  pustule: 'bg-red-500',
  nodule: 'bg-purple-500',
  cyst: 'bg-fuchsia-600',
};

export const AcneTypesCard: React.FC<{ types: AcneTypeSummary[] }> = ({ types }) => (
  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
      <Microscope className="w-3.5 h-3.5 text-blue-400" />
      Acne Types Detected
    </h3>
    {types.length === 0 ? (
      <p className="text-xs text-slate-400">No acne lesions detected.</p>
    ) : (
      <>
        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-800 mb-4">
          {types.map((t) => (
            <div
              key={t.type}
              className={TYPE_COLORS[t.type] ?? 'bg-blue-500'}
              style={{ width: `${t.percent}%` }}
              title={`${t.type} ${t.percent}%`}
            />
          ))}
        </div>
        <ul className="space-y-2.5">
          {types.map((t) => (
            <li key={t.type} className="flex items-start gap-3">
              <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${TYPE_COLORS[t.type] ?? 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-100 capitalize">{t.type}</span>
                  <span className="text-xs font-mono text-slate-300">
                    {t.count} · {t.percent}% · avg conf {Math.round(t.mean_confidence * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{t.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </>
    )}
  </div>
);
