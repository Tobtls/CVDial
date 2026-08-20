import React, { useState } from 'react';
import { ResumeData, BulletImprovement } from '../types';
import { Layers, ArrowRight, Check, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DiffViewProps {
  originalResume: ResumeData;
  tailoredResume: ResumeData | null;
  improvementsMade: BulletImprovement[];
}

export const DiffView: React.FC<DiffViewProps> = ({
  originalResume,
  tailoredResume,
  improvementsMade,
}) => {
  const [activeView, setActiveView] = useState<'changelog' | 'side-by-side'>('changelog');

  if (!tailoredResume) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center my-6 shadow-xl">
        <Layers className="w-12 h-12 text-slate-700 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-300">No Tailored Resume Generated Yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Click "Auto-Optimize CV for this Job" on Tab 2 or Tab 3 to build your tailored resume and review line-by-line diffs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-6">
      {/* Top Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            AI Optimization Changelog & Visual Diff
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Review every bullet point rephrasing, keyword injection, and structural enhancement made by Gemini AI.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveView('changelog')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
              activeView === 'changelog' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Changelog ({improvementsMade.length})
          </button>
          <button
            onClick={() => setActiveView('side-by-side')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
              activeView === 'side-by-side' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side CV
          </button>
        </div>
      </div>

      {activeView === 'changelog' ? (
        <div className="space-y-4">
          {improvementsMade.map((imp, idx) => (
            <div
              key={imp.id || idx}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{imp.section}</span>
                <div className="flex items-center space-x-1">
                  {imp.keywordsAdded?.map((kw, kwIdx) => (
                    <span
                      key={kwIdx}
                      className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full"
                    >
                      +{kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Original */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-500/20 text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block mb-1">
                    Original Bullet
                  </span>
                  <p className="leading-relaxed">{imp.original}</p>
                </div>

                {/* Tailored */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 text-slate-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-1">
                    Tailored Bullet (Google X-Y-Z)
                  </span>
                  <p className="leading-relaxed font-medium">{imp.tailored}</p>
                </div>
              </div>

              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-200 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-indigo-300">Strategic Reasoning:</strong> {imp.reasoning}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Base CV Column */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h4 className="font-bold text-slate-300 text-sm">Original Base Resume</h4>
              <p className="text-xs text-slate-500">{originalResume.contact.name}</p>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div>
                <span className="font-bold text-slate-400 block mb-1 uppercase text-[10px]">Summary</span>
                <p className="bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">{originalResume.summary}</p>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1 uppercase text-[10px]">Skills</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <p>
                    <strong className="text-slate-200">Technical:</strong> {originalResume.skills?.technical?.join(', ')}
                  </p>
                  <p>
                    <strong className="text-slate-200">Tools:</strong> {originalResume.skills?.tools?.join(', ')}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1 uppercase text-[10px]">Experience Bullets</span>
                <div className="space-y-2">
                  {originalResume.experience?.map((exp, eIdx) => (
                    <div key={eIdx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                      <p className="font-bold text-slate-200">
                        {exp.role} @ {exp.company}
                      </p>
                      <ul className="list-disc ml-4 space-y-1 text-slate-400">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tailored CV Column */}
          <div className="bg-slate-900 border border-indigo-900/50 rounded-2xl p-6 shadow-xl space-y-4 relative">
            <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Tailored ATS-Optimized Resume
                </h4>
                <p className="text-xs text-slate-400">{tailoredResume.contact.name}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-200">
              <div>
                <span className="font-bold text-emerald-400 block mb-1 uppercase text-[10px]">Tailored Summary</span>
                <p className="bg-slate-950 p-3 rounded-lg border border-emerald-500/20 leading-relaxed">
                  {tailoredResume.summary}
                </p>
              </div>

              <div>
                <span className="font-bold text-emerald-400 block mb-1 uppercase text-[10px]">Reordered Skills</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/20 space-y-1">
                  <p>
                    <strong className="text-slate-100">Technical:</strong> {tailoredResume.skills?.technical?.join(', ')}
                  </p>
                  <p>
                    <strong className="text-slate-100">Tools:</strong> {tailoredResume.skills?.tools?.join(', ')}
                  </p>
                </div>
              </div>

              <div>
                <span className="font-bold text-emerald-400 block mb-1 uppercase text-[10px]">Optimized Bullets</span>
                <div className="space-y-2">
                  {tailoredResume.experience?.map((exp, eIdx) => (
                    <div key={eIdx} className="bg-slate-950 p-3 rounded-lg border border-emerald-500/20 space-y-1">
                      <p className="font-bold text-slate-100">
                        {exp.role} @ {exp.company}
                      </p>
                      <ul className="list-disc ml-4 space-y-1 text-slate-200">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
