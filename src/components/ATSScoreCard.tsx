import React, { useState } from 'react';
import { ATSAnalysisResult } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Sparkles, Filter, Zap, Target, ShieldAlert } from 'lucide-react';

interface ATSScoreCardProps {
  analysis: ATSAnalysisResult | null;
  isAnalyzing: boolean;
  onOptimizeClick: () => void;
  isOptimizing: boolean;
}

export const ATSScoreCard: React.FC<ATSScoreCardProps> = ({
  analysis,
  isAnalyzing,
  onOptimizeClick,
  isOptimizing,
}) => {
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'matching' | 'critical' | 'recommended'>('all');

  if (isAnalyzing) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center my-6 shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 animate-spin">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Analyzing ATS Compatibility & Keyword Gaps...</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Gemini 3.6 Flash is scanning job requirements, parsing required hard skills, and evaluating resume alignment.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center my-6">
        <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-200">No Analysis Performed Yet</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
          Provide your CV and Target Job Description on Tab 1, then click "Analyze ATS Match" to uncover keyword gaps.
        </p>
      </div>
    );
  }

  const { matchScore, breakdown, verdict, executiveSummary, keywords, missingSkillsAndGaps, keyStrengths, atsWarnings } = analysis;

  const scoreColor =
    matchScore >= 80 ? 'text-emerald-400 stroke-emerald-400' : matchScore >= 60 ? 'text-amber-400 stroke-amber-400' : 'text-rose-400 stroke-rose-400';

  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (matchScore / 100) * circumference;

  return (
    <div className="space-y-6 my-6">
      {/* Top Banner: ATS Score & Executive Summary */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-800/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Circular Score Meter */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`${scoreColor} transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white tracking-tight">{matchScore}%</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">ATS Match</span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {verdict}
              </span>
            </div>
          </div>

          {/* Executive Summary & Action CTA */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" />
                ATS Executive Screener Evaluation
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">{executiveSummary}</p>
            </div>

            {/* Score Breakdown Progress Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Hard Skills</span>
                  <span className="font-semibold text-slate-200">{breakdown.hardSkillsScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${breakdown.hardSkillsScore}%` }} />
                </div>
              </div>

              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Experience Fit</span>
                  <span className="font-semibold text-slate-200">{breakdown.experienceScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${breakdown.experienceScore}%` }} />
                </div>
              </div>

              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Soft Skills</span>
                  <span className="font-semibold text-slate-200">{breakdown.softSkillsScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${breakdown.softSkillsScore}%` }} />
                </div>
              </div>

              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">ATS Format</span>
                  <span className="font-semibold text-slate-200">{breakdown.formattingScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${breakdown.formattingScore}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOptimizeClick}
                disabled={isOptimizing}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isOptimizing ? 'Generating Tailored CV...' : 'Auto-Optimize CV for this Job'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keywords Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h4 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              ATS Keyword Matrix & Gaps
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison between job requirements and keywords found in your CV.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setKeywordFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                keywordFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({keywords.matching.length + keywords.missingCritical.length + keywords.missingRecommended.length})
            </button>
            <button
              onClick={() => setKeywordFilter('matching')}
              className={`px-2.5 py-1 rounded transition-colors ${
                keywordFilter === 'matching' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Matched ({keywords.matching.length})
            </button>
            <button
              onClick={() => setKeywordFilter('critical')}
              className={`px-2.5 py-1 rounded transition-colors ${
                keywordFilter === 'critical' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Missing Critical ({keywords.missingCritical.length})
            </button>
            <button
              onClick={() => setKeywordFilter('recommended')}
              className={`px-2.5 py-1 rounded transition-colors ${
                keywordFilter === 'recommended' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recommended ({keywords.missingRecommended.length})
            </button>
          </div>
        </div>

        {/* Tags Display */}
        <div className="flex flex-wrap gap-2">
          {(keywordFilter === 'all' || keywordFilter === 'matching') &&
            keywords.matching.map((kw, i) => (
              <span
                key={`m-${i}`}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{kw}</span>
              </span>
            ))}

          {(keywordFilter === 'all' || keywordFilter === 'critical') &&
            keywords.missingCritical.map((kw, i) => (
              <span
                key={`c-${i}`}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>{kw}</span>
                <span className="text-[10px] text-rose-400 font-bold ml-1">CRITICAL</span>
              </span>
            ))}

          {(keywordFilter === 'all' || keywordFilter === 'recommended') &&
            keywords.missingRecommended.map((kw, i) => (
              <span
                key={`r-${i}`}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{kw}</span>
              </span>
            ))}
        </div>
      </div>

      {/* Two Column Section: Strengths vs ATS Warnings & Missing Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h4 className="font-bold text-slate-100 text-base mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Key Candidate Strengths
          </h4>
          <ul className="space-y-2.5">
            {keyStrengths.map((str, i) => (
              <li key={i} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ATS Warnings & Missing Gaps */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h4 className="font-bold text-slate-100 text-base mb-3 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            ATS Risks & Skill Gaps
          </h4>
          <ul className="space-y-2.5">
            {missingSkillsAndGaps.map((gap, i) => (
              <li key={`gap-${i}`} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <span>{gap}</span>
              </li>
            ))}
            {atsWarnings.map((warn, i) => (
              <li key={`warn-${i}`} className="flex items-start space-x-2 text-xs text-amber-300/90 leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>{warn}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
