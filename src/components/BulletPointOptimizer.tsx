import React, { useState } from 'react';
import { ResumeData, JobDescriptionData } from '../types';
import { Sparkles, Check, Edit3, ArrowRight, Wand2, RefreshCw, Layers, Lightbulb, ChevronRight, CornerDownRight } from 'lucide-react';

interface BulletPointOptimizerProps {
  resume: ResumeData;
  jobDescription: JobDescriptionData | null;
  onUpdateBullet: (expIndex: number, bulletIndex: number, newText: string) => void;
  isOptimizing: boolean;
  onOptimizeAll: () => void;
}

interface RewriteOption {
  label: string;
  text: string;
  keywordsInjected: string[];
}

export const BulletPointOptimizer: React.FC<BulletPointOptimizerProps> = ({
  resume,
  jobDescription,
  onUpdateBullet,
  isOptimizing,
  onOptimizeAll,
}) => {
  const [selectedBullet, setSelectedBullet] = useState<{ expIdx: number; bulletIdx: number; originalText: string; roleContext: string } | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('Quantify metrics and add Google X-Y-Z framework impact');
  const [variations, setVariations] = useState<RewriteOption[]>([]);
  const [isLoadingRewrites, setIsLoadingRewrites] = useState<boolean>(false);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);

  const handleOpenRewriteModal = (expIdx: number, bulletIdx: number, bulletText: string, role: string, company: string) => {
    setSelectedBullet({
      expIdx,
      bulletIdx,
      originalText: bulletText,
      roleContext: `${role} at ${company}`,
    });
    setVariations([]);
    fetchRewrites(bulletText, `${role} at ${company}`, 'Quantify metrics and integrate strong action verbs');
  };

  const fetchRewrites = async (bulletText: string, roleCtx: string, instruction: string) => {
    setIsLoadingRewrites(true);
    try {
      const res = await fetch('/api/rewrite-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalBullet: bulletText,
          roleContext: roleCtx,
          jobDescription: jobDescription?.rawText || '',
          instruction: instruction,
        }),
      });
      const data = await res.json();
      if (data.variations) {
        setVariations(data.variations);
      }
    } catch (err) {
      console.error('Failed to rewrite bullet:', err);
    } finally {
      setIsLoadingRewrites(false);
    }
  };

  const handleApplyVariation = (expIdx: number, bulletIdx: number, newText: string) => {
    onUpdateBullet(expIdx, bulletIdx, newText);
    setAppliedKey(`${expIdx}-${bulletIdx}`);
    setTimeout(() => setAppliedKey(null), 2000);
    setSelectedBullet(null);
  };

  return (
    <div className="space-y-6 my-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            AI Bullet Point Optimizer
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Refine each accomplishment bullet using Google’s X-Y-Z formula ("Accomplished [X], measured by [Y], by doing [Z]").
          </p>
        </div>

        <button
          onClick={onOptimizeAll}
          disabled={isOptimizing}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <Wand2 className="w-4 h-4" />
          <span>{isOptimizing ? 'Optimizing All Experience Bullets...' : 'AI Mass-Tailor All Bullets'}</span>
        </button>
      </div>

      {/* Experience Sections */}
      <div className="space-y-6">
        {resume.experience.map((exp, expIdx) => (
          <div key={exp.id || expIdx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-slate-100 text-base">{exp.role}</h4>
                <p className="text-xs text-indigo-400 font-medium">
                  {exp.company} • {exp.location}
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono mt-1 sm:mt-0">{exp.dates}</span>
            </div>

            <div className="space-y-3">
              {exp.bullets.map((bullet, bulletIdx) => {
                const isJustApplied = appliedKey === `${expIdx}-${bulletIdx}`;

                return (
                  <div
                    key={bulletIdx}
                    className={`p-4 rounded-xl border transition-all ${
                      isJustApplied
                        ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-2 text-xs text-slate-200 leading-relaxed flex-1">
                        <span className="text-indigo-400 font-bold mt-0.5">•</span>
                        <p className="flex-1">{bullet}</p>
                      </div>

                      <button
                        onClick={() => handleOpenRewriteModal(expIdx, bulletIdx, bullet, exp.role, exp.company)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>AI Rewrite</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive AI Rewrite Modal */}
      {selectedBullet && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  AI Bullet Point Rewriter
                </h4>
                <p className="text-xs text-slate-400">{selectedBullet.roleContext}</p>
              </div>
              <button
                onClick={() => setSelectedBullet(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Original Bullet */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Original Text</span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedBullet.originalText}</p>
            </div>

            {/* Preset Instructions */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Select Refinement Angle or Custom Prompt:
              </label>

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => {
                    const inst = 'Quantify metrics with percentages, numbers, and scale';
                    setCustomPrompt(inst);
                    fetchRewrites(selectedBullet.originalText, selectedBullet.roleContext, inst);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors"
                >
                  📊 Quantify Metrics
                </button>

                <button
                  onClick={() => {
                    const inst = 'Incorporate strong leadership action verbs and direct ownership';
                    setCustomPrompt(inst);
                    fetchRewrites(selectedBullet.originalText, selectedBullet.roleContext, inst);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors"
                >
                  🚀 Leadership Focus
                </button>

                <button
                  onClick={() => {
                    const inst = 'Make it concise, punchy, and under 25 words';
                    setCustomPrompt(inst);
                    fetchRewrites(selectedBullet.originalText, selectedBullet.roleContext, inst);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors"
                >
                  ⚡ Concise Pass
                </button>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Custom instruction e.g. Add Docker and AWS cloud keywords"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => fetchRewrites(selectedBullet.originalText, selectedBullet.roleContext, customPrompt)}
                  disabled={isLoadingRewrites}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRewrites ? 'animate-spin' : ''}`} />
                  <span>Generate</span>
                </button>
              </div>
            </div>

            {/* Variations Generated */}
            {isLoadingRewrites ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2 animate-spin" />
                Crafting 3 high-impact variations...
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {variations.map((v, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all space-y-2 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {v.label}
                      </span>
                      <button
                        onClick={() =>
                          handleApplyVariation(selectedBullet.expIdx, selectedBullet.bulletIdx, v.text)
                        }
                        className="flex items-center space-x-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Use This Version</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{v.text}</p>

                    {v.keywordsInjected?.length > 0 && (
                      <div className="flex items-center space-x-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-500 font-medium">Keywords added:</span>
                        {v.keywordsInjected.map((kw, kwIdx) => (
                          <span
                            key={kwIdx}
                            className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded"
                          >
                            +{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
