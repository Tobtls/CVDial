import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Save,
  Trash2,
  Download,
  Calendar,
  Sparkles,
  Award,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  History,
  X,
  FileCheck,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { ResumeData, SavedResumeRecord, UserActivityRecord } from '../types';
import {
  saveResumeToFirestore,
  fetchUserResumes,
  deleteResumeFromFirestore,
  fetchUserActivities,
} from '../lib/firestoreService';

interface SavedResumesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentResume: ResumeData;
  currentTailoredResume: ResumeData | null;
  targetRole: string;
  currentAtsScore?: number;
  currentCoverLetter?: string;
  onLoadResume: (record: SavedResumeRecord) => void;
}

export const SavedResumesModal: React.FC<SavedResumesModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentResume,
  currentTailoredResume,
  targetRole,
  currentAtsScore,
  currentCoverLetter,
  onLoadResume,
}) => {
  const [resumes, setResumes] = useState<SavedResumeRecord[]>([]);
  const [activities, setActivities] = useState<UserActivityRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'resumes' | 'history'>('resumes');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTitle, setSaveTitle] = useState(currentResume.title || 'My Resume');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [savedList, actList] = await Promise.all([
        fetchUserResumes(userId),
        fetchUserActivities(userId),
      ]);
      setResumes(savedList);
      setActivities(actList);
    } catch (err: any) {
      console.error('Error loading user cloud data:', err);
      setErrorMsg('Failed to load saved records from cloud storage.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    setIsSaving(true);
    setSaveSuccessMsg('');
    setErrorMsg('');
    try {
      await saveResumeToFirestore(
        userId,
        saveTitle.trim(),
        targetRole || 'Target Role',
        currentResume,
        currentTailoredResume,
        currentAtsScore,
        currentCoverLetter
      );
      setSaveSuccessMsg('Resume saved to your Firebase cloud account!');
      await loadData();
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Save error:', err);
      setErrorMsg('Could not save resume to cloud. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved resume from your cloud account?')) {
      return;
    }
    try {
      await deleteResumeFromFirestore(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting record:', err);
      setErrorMsg('Failed to delete resume.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Your Cloud Vault & Activity</h2>
              <p className="text-xs text-slate-400">Manage saved resumes and track previous ATS calibrations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('resumes')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'resumes'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>Saved Resumes ({resumes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Recent Activities ({activities.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {activeTab === 'resumes' && (
            <>
              {/* Quick Save Current Workspace */}
              <form
                onSubmit={handleSaveCurrent}
                className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
              >
                <div className="flex-1">
                  <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                    Save current workspace to Firebase
                  </label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer - Tech Corp"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="sm:self-end py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Current'}</span>
                </button>
              </form>

              {/* Saved list */}
              <div>
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                  Your Cloud Saved Resumes
                </h3>

                {isLoading ? (
                  <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <span className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <span className="text-xs">Fetching your saved resumes...</span>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl p-6">
                    <FolderArchive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No saved resumes yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Save your current tailored resume and job match above to access it anytime from any device.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {resumes.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => {
                          onLoadResume(rec);
                          onClose();
                        }}
                        className="group p-4 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                              {rec.title}
                            </span>
                            {rec.atsScore ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {rec.atsScore}% ATS
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-slate-500" />
                              <span className="truncate">{rec.targetRole}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{new Date(rec.updatedAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadResume(rec);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span>Load</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(rec.id, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete resume"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
                Recent Optimization Logs
              </h3>

              {isLoading ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <span className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-xs">Loading activity logs...</span>
                </div>
              ) : activities.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl p-6">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No activity logged yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Your ATS analyses, bullet rewrites, and generated cover letters will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                          {act.actionType === 'ats_analysis' && <Award className="w-3.5 h-3.5" />}
                          {act.actionType === 'resume_tailored' && <Sparkles className="w-3.5 h-3.5" />}
                          {act.actionType === 'bullet_rewritten' && <FileCheck className="w-3.5 h-3.5" />}
                          {act.actionType === 'cover_letter_generated' && <Briefcase className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">
                            {act.actionType === 'ats_analysis' && 'ATS Calibration Ran'}
                            {act.actionType === 'resume_tailored' && 'Resume Tailored & Saved'}
                            {act.actionType === 'bullet_rewritten' && 'Bullet Points Optimized'}
                            {act.actionType === 'cover_letter_generated' && 'Cover Letter Generated'}
                            <span className="text-slate-400 font-normal"> — {act.jobTitle}</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(act.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {act.score ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                          {act.score}%
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Synced securely with Firebase Firestore</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
