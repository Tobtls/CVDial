import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CVAndJobInput } from './components/CVAndJobInput';
import { ATSScoreCard } from './components/ATSScoreCard';
import { BulletPointOptimizer } from './components/BulletPointOptimizer';
import { TailoredResumePreview } from './components/TailoredResumePreview';
import { CoverLetterTab } from './components/CoverLetterTab';
import { DiffView } from './components/DiffView';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { SavedResumesModal } from './components/SavedResumesModal';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { syncUserProfile, logUserActivity } from './lib/firestoreService';
import { SAMPLE_RESUMES, SAMPLE_JOB_DESCRIPTIONS } from './data/samplePresets';
import { ResumeData, JobDescriptionData, ATSAnalysisResult, BulletImprovement, SavedResumeRecord } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [currentUser, setCurrentUser] = useState<{ uid?: string; name: string; email: string; isGuest: boolean } | null>(() => {
    try {
      const saved = localStorage.getItem('cvdial_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'signin'>('signup');
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const [resume, setResume] = useState<ResumeData>(SAMPLE_RESUMES[0].data);
  const [tailoredResume, setTailoredResume] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescriptionData>(SAMPLE_JOB_DESCRIPTIONS[0]);

  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);
  const [improvementsMade, setImprovementsMade] = useState<BulletImprovement[]>([]);
  const [coverLetterText, setCoverLetterText] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'builder' | 'ats' | 'bullets' | 'cover-letter' | 'diff'>('builder');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Monitor Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Candidate';
        const userObj = {
          uid: firebaseUser.uid,
          name: displayName,
          email: firebaseUser.email || '',
          isGuest: false,
        };
        setCurrentUser(userObj);
        try {
          localStorage.setItem('cvdial_user', JSON.stringify(userObj));
        } catch {
          // ignore
        }
        await syncUserProfile(firebaseUser.uid, firebaseUser.email || '', displayName);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check URL hash on mount (e.g. #workspace or #app)
  useEffect(() => {
    if (window.location.hash === '#app' || window.location.hash === '#workspace') {
      setCurrentView('app');
    }
  }, []);

  const runATSAnalysis = async () => {
    if (!jobDescription.rawText.trim()) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          jobDescription: jobDescription.rawText,
        }),
      });

      const data: ATSAnalysisResult = await res.json();
      if (data.matchScore !== undefined) {
        setAnalysisResult(data);

        // Log user activity to Firebase if signed in
        if (currentUser && !currentUser.isGuest && currentUser.uid) {
          logUserActivity(currentUser.uid, 'ats_analysis', jobDescription.title || 'Target Job', data.matchScore);
        }
      }
    } catch (err) {
      console.error('Failed to analyze ATS match:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeClick = async () => {
    await runATSAnalysis();
    setActiveTab('ats');
  };

  const runFullOptimization = async () => {
    if (!jobDescription.rawText.trim()) return;
    setIsOptimizing(true);

    try {
      const res = await fetch('/api/optimize-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume,
          jobDescription: jobDescription.rawText,
        }),
      });

      const data = await res.json();
      if (data.tailoredResume) {
        setTailoredResume(data.tailoredResume);
        setImprovementsMade(data.improvementsMade || []);
        setCoverLetterText(data.coverLetter || '');

        if (analysisResult) {
          setAnalysisResult({
            ...analysisResult,
            matchScore: data.newMatchScore || 92,
            verdict: 'Strong Optimized ATS Match',
          });
        }

        // Log user activity
        if (currentUser && !currentUser.isGuest && currentUser.uid) {
          logUserActivity(currentUser.uid, 'resume_tailored', jobDescription.title || 'Target Job', data.newMatchScore || 92);
        }

        setActiveTab('diff');
      }
    } catch (err) {
      console.error('Failed to optimize CV:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReset = () => {
    setResume(SAMPLE_RESUMES[0].data);
    setTailoredResume(null);
    setJobDescription(SAMPLE_JOB_DESCRIPTIONS[0]);
    setAnalysisResult(null);
    setImprovementsMade([]);
    setCoverLetterText('');
    setActiveTab('builder');
  };

  const handleUpdateBullet = (expIdx: number, bulletIdx: number, newText: string) => {
    const updatedExp = [...resume.experience];
    updatedExp[expIdx].bullets[bulletIdx] = newText;
    setResume({ ...resume, experience: updatedExp });

    if (tailoredResume) {
      const updatedTailoredExp = [...tailoredResume.experience];
      if (updatedTailoredExp[expIdx]) {
        updatedTailoredExp[expIdx].bullets[bulletIdx] = newText;
        setTailoredResume({ ...tailoredResume, experience: updatedTailoredExp });
      }
    }
  };

  const handleEnterApp = (user?: { uid?: string; name: string; email: string; isGuest: boolean }) => {
    if (user) {
      setCurrentUser(user);
    } else if (!currentUser) {
      setCurrentUser({ uid: 'guest', name: 'Guest Candidate', email: 'guest@cvdial.app', isGuest: true });
    }
    setCurrentView('app');
    window.location.hash = 'app';
    if (!analysisResult) {
      runATSAnalysis();
    }
  };

  const handleOpenAuthFromHeader = (mode: 'signup' | 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('cvdial_user');
    } catch {
      // ignore
    }
    setCurrentUser({ uid: 'guest', name: 'Guest Candidate', email: 'guest@cvdial.app', isGuest: true });
  };

  const handleLoadSavedResume = (record: SavedResumeRecord) => {
    setResume(record.resumeData);
    if (record.tailoredResumeData) {
      setTailoredResume(record.tailoredResumeData);
    } else {
      setTailoredResume(null);
    }
    if (record.targetRole) {
      setJobDescription((prev) => ({
        ...prev,
        title: record.targetRole,
      }));
    }
    if (record.coverLetter) {
      setCoverLetterText(record.coverLetter);
    }
    if (record.atsScore) {
      if (analysisResult) {
        setAnalysisResult({
          ...analysisResult,
          matchScore: record.atsScore,
        });
      }
    }
    setActiveTab('builder');
  };

  const currentDisplayResume = tailoredResume || resume;

  if (currentView === 'landing') {
    return (
      <LandingPage
        onEnterApp={handleEnterApp}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        currentResume={currentDisplayResume}
        onReset={handleReset}
        matchScore={analysisResult?.matchScore}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAnalyzing={isAnalyzing}
        isOptimizing={isOptimizing}
        onGoToLanding={() => {
          setCurrentView('landing');
          window.location.hash = '';
        }}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuthFromHeader}
        onOpenVault={() => {
          if (!currentUser || currentUser.isGuest) {
            handleOpenAuthFromHeader('signup');
          } else {
            setIsVaultOpen(true);
          }
        }}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'builder' && (
          <CVAndJobInput
            resume={resume}
            onUpdateResume={setResume}
            jobDescription={jobDescription}
            onUpdateJobDescription={setJobDescription}
            onRunAnalysis={handleAnalyzeClick}
            isAnalyzing={isAnalyzing}
          />
        )}

        {activeTab === 'ats' && (
          <ATSScoreCard
            analysis={analysisResult}
            isAnalyzing={isAnalyzing}
            onOptimizeClick={runFullOptimization}
            isOptimizing={isOptimizing}
          />
        )}

        {activeTab === 'bullets' && (
          <BulletPointOptimizer
            resume={currentDisplayResume}
            jobDescription={jobDescription}
            onUpdateBullet={handleUpdateBullet}
            isOptimizing={isOptimizing}
            onOptimizeAll={runFullOptimization}
          />
        )}

        {activeTab === 'diff' && (
          <div>
            <DiffView
              originalResume={resume}
              tailoredResume={tailoredResume}
              improvementsMade={improvementsMade}
            />
            <div className="mt-8 border-t border-slate-800 pt-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Export & Live Render Stage</h3>
              <TailoredResumePreview
                resume={currentDisplayResume}
                onUpdateResume={(up) => {
                  if (tailoredResume) setTailoredResume(up);
                  else setResume(up);
                }}
                highlightKeywords={analysisResult?.keywords?.matching || []}
              />
            </div>
          </div>
        )}

        {activeTab === 'cover-letter' && (
          <CoverLetterTab
            resume={currentDisplayResume}
            jobDescription={jobDescription}
            initialCoverLetter={coverLetterText}
          />
        )}
      </main>

      {/* In-app Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
        onProceedGuest={() => {
          setCurrentUser({ uid: 'guest', name: 'Guest Candidate', email: 'guest@cvdial.app', isGuest: true });
        }}
        initialMode={authModalMode}
      />

      {/* Cloud Saved Resumes & Activity Modal */}
      {currentUser && !currentUser.isGuest && currentUser.uid && (
        <SavedResumesModal
          isOpen={isVaultOpen}
          onClose={() => setIsVaultOpen(false)}
          userId={currentUser.uid}
          currentResume={resume}
          currentTailoredResume={tailoredResume}
          targetRole={jobDescription.title || 'Target Job Role'}
          currentAtsScore={analysisResult?.matchScore}
          currentCoverLetter={coverLetterText}
          onLoadResume={handleLoadSavedResume}
        />
      )}
    </div>
  );
}
