import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Target,
  Zap,
  Layers,
  Award,
  Shield,
  Briefcase,
  UserCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { AuthModal } from './AuthModal';

interface LandingPageProps {
  onEnterApp: (user?: { uid?: string; name: string; email: string; isGuest: boolean }) => void;
  currentUser?: { uid?: string; name: string; email: string; isGuest: boolean } | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, currentUser }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');

  const openAuth = (mode: 'signup' | 'signin') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleGuestProceed = () => {
    onEnterApp({ uid: 'guest', name: 'Guest Candidate', email: 'guest@cvdial.app', isGuest: true });
  };

  const handleAuthSuccess = (user: { uid: string; name: string; email: string; isGuest: boolean }) => {
    onEnterApp(user);
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white relative">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.34 16.5A9 9 0 1 1 20.66 16.5" />
                <path d="M12 12l4.5 -4.5" stroke="#38BDF8" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <circle cx="17" cy="7" r="1.2" fill="#38BDF8" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white flex items-center">
                  CV<span className="text-indigo-400">Dial</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                tailor your resume for any role
              </p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {currentUser && !currentUser.isGuest ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => onEnterApp(currentUser)}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-colors flex items-center gap-1.5"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => openAuth('signin')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  onClick={handleGuestProceed}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-indigo-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Test CVDial instantly with sample data without an account"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Guest Mode</span>
                  <span className="sm:hidden">Guest</span>
                </button>

                <button
                  onClick={() => openAuth('signup')}
                  className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Hero Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Smart ATS Calibration & Bullet Point Optimizer</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Dial in your resume for <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">any role</span> in seconds.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            CVDial cross-examines your CV against any job description, uncovers critical keyword gaps, transforms weak bullets into quantifiable achievements with Google XYZ metrics, and crafts tailor-made cover letters.
          </p>

          {/* Main Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <button
              onClick={() => openAuth('signup')}
              className="w-full sm:w-auto py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Get Started — Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleGuestProceed}
              className="w-full sm:w-auto py-3.5 px-6 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Proceed in Guest Mode</span>
            </button>
          </div>

          {/* Trust points */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant ATS Score & Keywords</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export clean Word (.docx) & PDF</span>
            </div>
          </div>
        </div>

        {/* Feature Demonstration Preview Card */}
        <div className="mt-14 max-w-5xl mx-auto w-full">
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50">
            {/* Top Dial Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ATS Calibration Engine</h3>
                  <p className="text-xs text-slate-400">Automated keyword discovery & metric alignment</p>
                </div>
              </div>

              {/* Score Calibration Pill */}
              <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Match Calibration</span>
                  <span className="text-xs font-semibold text-slate-400">Original: 52%</span>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 mx-1" />
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>94% ATS Score</span>
                </div>
              </div>
            </div>

            {/* 4 Feature Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {/* Feature 1 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-indigo-500/40 transition-colors space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">1. ATS Keyword Audit</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Identifies missing skills, hard tech requirements, and keywords from the job spec.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-indigo-500/40 transition-colors space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">2. Google XYZ Rewriter</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transforms vague tasks into quantified achievements ("Accomplished [X], measured by [Y], by doing [Z]").
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-indigo-500/40 transition-colors space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">3. Visual Diff & Templates</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Review side-by-side changes and switch across Executive, Tech, Modern, and Classic templates.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-indigo-500/40 transition-colors space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">4. AI Cover Letter</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generates an aligned cover letter connecting your real experience directly to the employer's mission.
                </p>
              </div>
            </div>

            {/* Quick action bar inside showcase */}
            <div className="mt-6 pt-5 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-medium text-center sm:text-left">
                Ready to customize your CV for your next job application?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGuestProceed}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Quick Guest Test
                </button>
                <button
                  onClick={() => openAuth('signup')}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Sign Up Now</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">CVDial</span>
            <span>—</span>
            <span>tailor your resume for any role</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={handleGuestProceed} className="hover:text-white transition-colors">
              Guest Sandbox
            </button>
            <span>•</span>
            <button onClick={() => openAuth('signin')} className="hover:text-white transition-colors">
              Account Login
            </button>
            <span>•</span>
            <button onClick={() => openAuth('signup')} className="hover:text-white transition-colors">
              Register Free
            </button>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        onProceedGuest={handleGuestProceed}
        initialMode={authMode}
      />
    </div>
  );
};
