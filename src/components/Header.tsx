import React from 'react';
import { Sparkles, FileText, Briefcase, RefreshCw, Layers, CheckCircle2, Award, Home, User, UserCheck, FolderArchive, LogOut } from 'lucide-react';
import { ResumeData } from '../types';

interface HeaderProps {
  currentResume: ResumeData;
  onReset: () => void;
  matchScore?: number;
  activeTab: 'builder' | 'ats' | 'bullets' | 'cover-letter' | 'diff';
  setActiveTab: (tab: 'builder' | 'ats' | 'bullets' | 'cover-letter' | 'diff') => void;
  isAnalyzing: boolean;
  isOptimizing: boolean;
  onGoToLanding?: () => void;
  currentUser?: { uid?: string; name: string; email: string; isGuest: boolean } | null;
  onOpenAuth?: (mode: 'signup' | 'signin') => void;
  onOpenVault?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentResume,
  onReset,
  matchScore,
  activeTab,
  setActiveTab,
  isAnalyzing,
  isOptimizing,
  onGoToLanding,
  currentUser,
  onOpenAuth,
  onOpenVault,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Name (Clickable to Home/Landing) */}
          <button
            onClick={onGoToLanding}
            className="flex items-center space-x-3 text-left group focus:outline-none cursor-pointer"
            title="Return to CVDial Home & Landing Page"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white relative group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.34 16.5A9 9 0 1 1 20.66 16.5" />
                <path d="M12 12l4.5 -4.5" stroke="#38BDF8" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <circle cx="17" cy="7" r="1.2" fill="#38BDF8" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white flex items-center group-hover:text-indigo-200 transition-colors">
                  CV<span className="text-indigo-400">Dial</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  AI Match Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                tailor your resume for any role
              </p>
            </div>
          </button>

          {/* Score Badge, User Status & Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Landing page link */}
            {onGoToLanding && (
              <button
                onClick={onGoToLanding}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Landing Page</span>
              </button>
            )}

            {/* Cloud Saved Resumes Vault button */}
            {onOpenVault && (
              <button
                onClick={onOpenVault}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-lg transition-colors cursor-pointer"
                title="Open Cloud Saved Resumes & History"
              >
                <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Saved Resumes</span>
                <span className="sm:hidden">Vault</span>
              </button>
            )}

            {/* Current User or Guest badge */}
            {currentUser && (
              <div className="flex items-center gap-2">
                {currentUser.isGuest ? (
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-lg">
                      <UserCheck className="w-3 h-3 text-indigo-400" />
                      <span>Guest Mode</span>
                    </span>
                    {onOpenAuth && (
                      <button
                        onClick={() => onOpenAuth('signup')}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-600 border border-indigo-500/40 rounded-lg transition-all cursor-pointer"
                      >
                        Sign Up
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200 hidden sm:inline">{currentUser.name}</span>
                    {onSignOut && (
                      <button
                        onClick={onSignOut}
                        className="text-slate-400 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                        title="Sign Out"
                      >
                        <LogOut className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {matchScore !== undefined && (
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">ATS Match:</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    matchScore >= 80
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : matchScore >= 60
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {matchScore}%
                </span>
              </div>
            )}

            <button
              onClick={onReset}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
              title="Start New Analysis"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'builder'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. CV & Job Input</span>
          </button>

          <button
            onClick={() => setActiveTab('ats')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'ats'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. ATS Audit & Keywords</span>
            {isAnalyzing && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping ml-1" />}
          </button>

          <button
            onClick={() => setActiveTab('bullets')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'bullets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Bullet Rewriter</span>
            {isOptimizing && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />}
          </button>

          <button
            onClick={() => setActiveTab('diff')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'diff'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. Visual Diff & Tailored CV</span>
          </button>

          <button
            onClick={() => setActiveTab('cover-letter')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'cover-letter'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>5. Cover Letter</span>
          </button>
        </div>
      </div>
    </header>
  );
};
