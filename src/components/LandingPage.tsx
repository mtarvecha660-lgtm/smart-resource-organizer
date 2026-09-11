// File: src/components/LandingPage.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Github,
  Film,
  Globe,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Share2,
} from 'lucide-react';
import { signInWithPopup, auth, googleProvider } from '../lib/firebase';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  onSignInSuccess?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: (theme: 'dark' | 'light') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignInSuccess,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasPendingShare] = useState(() => {
    try {
      return !!localStorage.getItem('sro_pending_mobile_share');
    } catch {
      return false;
    }
  });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onSignInSuccess?.();
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(
        errorMsg.includes('popup-closed-by-user')
          ? 'Sign-in window was closed. Please try again.'
          : errorMsg.includes('unauthorized-domain')
          ? 'Notice: This domain requires authorization in the Firebase Console.'
          : errorMsg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 font-mono text-xs font-bold">
              S
            </div>
            <span className="font-medium text-xs sm:text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              Smart Resource Organizer
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded">
              v2.0
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                id="landing-theme-toggle-btn"
                onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
                className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-zinc-300" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-zinc-700" />
                )}
              </button>
            )}

            <PWAInstallButton variant="header" />

            <button
              id="nav-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
              ) : null}
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
        {authError && (
          <div className="mb-6 p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Notice</p>
              <p className="mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {hasPendingShare && (
          <div className="mb-6 p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Shared item waiting in browser cache
                </p>
                <p className="font-mono text-[11px] text-zinc-500">
                  Sign in to commit it into your isolated Firestore collection.
                </p>
              </div>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium text-xs transition-colors cursor-pointer shrink-0"
            >
              Sign In & Save
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <ShieldCheck className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
              <span>Isolated Firestore &bull; Document UID Security</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
              High-density resource hub for links, specifications, code, and media.
            </h1>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl font-sans">
              Organize technical bookmarks, research documents, git repositories, and video references. 
              Deterministic offline categorization, cursor-based pagination, and instant local persistence.
            </p>

            <div className="pt-2">
              <button
                id="hero-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

            {/* Checklist */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <span>Zero configuration auth</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <span>Isolated Firestore per UID</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <span>Deterministic offline regex</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <span>PWA install & Share Target</span>
              </div>
            </div>
          </div>

          {/* Right Column: 4-Quadrant Preview Grid */}
          <div className="lg:col-span-5">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  Target Categories
                </span>
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  offline-ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <Globe className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 mb-1.5" />
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Web Links</p>
                  <p className="font-mono text-[10px] text-zinc-500 mt-0.5">URLs & dashboards</p>
                </div>

                <div className="p-3 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <FileText className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 mb-1.5" />
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Documents</p>
                  <p className="font-mono text-[10px] text-zinc-500 mt-0.5">PDFs & technical specs</p>
                </div>

                <div className="p-3 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <Github className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 mb-1.5" />
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">GitHub</p>
                  <p className="font-mono text-[10px] text-zinc-500 mt-0.5">Repositories & code</p>
                </div>

                <div className="p-3 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <Film className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 mb-1.5" />
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Reels & Media</p>
                  <p className="font-mono text-[10px] text-zinc-500 mt-0.5">YouTube & video sources</p>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] text-zinc-500 leading-normal">
                Quick Send bar detects format automatically via URL parsing and assigns deterministic categorization.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4 text-center font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
        Smart Resource Organizer &bull; Strict UID Isolation &bull; Firebase Firestore Persistence
      </footer>
    </div>
  );
};
