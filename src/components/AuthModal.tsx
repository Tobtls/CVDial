import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../lib/firebase';
import { syncUserProfile } from '../lib/firestoreService';
import { X, Mail, Lock, User, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { uid: string; name: string; email: string; isGuest: boolean }) => void;
  onProceedGuest: () => void;
  initialMode?: 'signup' | 'signin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onProceedGuest,
  initialMode = 'signup',
}) => {
  const [mode, setMode] = useState<'signup' | 'signin'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // Update Firebase Auth Display Name
        if (name.trim()) {
          await updateProfile(user, { displayName: name.trim() });
        }

        // Save User Profile to Firestore
        await syncUserProfile(user.uid, user.email || email.trim(), name.trim() || email.split('@')[0]);

        const userProfile = {
          uid: user.uid,
          name: name.trim() || email.split('@')[0],
          email: user.email || email.trim(),
          isGuest: false,
        };

        try {
          localStorage.setItem('cvdial_user', JSON.stringify(userProfile));
        } catch {
          // ignore
        }

        onSuccess(userProfile);
        onClose();
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        const displayName = user.displayName || email.split('@')[0];
        await syncUserProfile(user.uid, user.email || email.trim(), displayName);

        const userProfile = {
          uid: user.uid,
          name: displayName,
          email: user.email || email.trim(),
          isGuest: false,
        };

        try {
          localStorage.setItem('cvdial_user', JSON.stringify(userProfile));
        } catch {
          // ignore
        }

        onSuccess(userProfile);
        onClose();
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let message = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'The email address is badly formatted.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (providerName: 'Google' | 'GitHub') => {
    setIsLoading(true);
    setError('');
    try {
      const provider = providerName === 'Google' ? googleProvider : githubProvider;
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const displayName = user.displayName || user.email?.split('@')[0] || `${providerName} User`;
      await syncUserProfile(user.uid, user.email || `${user.uid}@auth.cvdial.app`, displayName);

      const userProfile = {
        uid: user.uid,
        name: displayName,
        email: user.email || `${user.uid}@auth.cvdial.app`,
        isGuest: false,
      };

      try {
        localStorage.setItem('cvdial_user', JSON.stringify(userProfile));
      } catch {
        // ignore
      }

      onSuccess(userProfile);
      onClose();
    } catch (err: any) {
      console.error('OAuth Popup Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in popup was closed before completing.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email using another provider.');
      } else {
        setError(err.message || 'OAuth authentication failed. Try email signup.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 mb-3">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.34 16.5A9 9 0 1 1 20.66 16.5" />
              <path d="M12 12l4.5 -4.5" stroke="#38BDF8" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="17" cy="7" r="1.2" fill="#38BDF8" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'signup' ? 'Create your CVDial Account' : 'Welcome back to CVDial'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'signup'
              ? 'Save your resumes to Firebase Cloud, tailor for unlimited roles, and track history.'
              : 'Sign in to access your saved CVs and optimization history.'}
          </p>
        </div>

        {/* Quick OAuth options */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => handleOAuthLogin('Google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('GitHub')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </button>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider absolute">
            or continue with email
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account with Firebase' : 'Sign In with Firebase'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle signin/signup */}
        <div className="mt-4 text-center">
          {mode === 'signup' ? (
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('signin');
                }}
                className="text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('signup');
                }}
                className="text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>

        {/* Guest Mode Direct Exit */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              onProceedGuest();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 font-medium inline-flex items-center gap-1.5 transition-colors group cursor-pointer"
          >
            <span>Or proceed in guest mode without an account</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
