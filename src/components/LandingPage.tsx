import React, { useState } from 'react';
import { 
  Compass, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  FileText, 
  Github, 
  Film, 
  Globe, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Share2
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
  onToggleTheme 
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
          ? 'Sign-in cancelled. Please try again.'
          : errorMsg.includes('unauthorized-domain')
          ? 'Notice: This domain requires authorization in the Firebase Console. You can also preview features below.'
          : errorMsg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold tracking-tight text-white text-base">Smart Resource Organizer</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onToggleTheme && (
              <button
                id="landing-theme-toggle-btn"
                onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
                className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-400" />
                )}
              </button>
            )}

            <PWAInstallButton variant="header" />

            <button
              id="nav-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm hover:shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              )}
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col justify-center max-w-6xl mx-auto px-6 py-16 w-full">
        {authError && (
          <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-rose-200">Sign-in Notice</p>
              <p className="text-xs text-rose-300/90 mt-1">{authError}</p>
            </div>
          </div>
        )}

        {hasPendingShare && (
          <div className="mb-8 p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-sm flex items-center justify-between gap-3 shadow-lg shadow-indigo-950/50 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">📱 Incoming Mobile Share Detected!</p>
                <p className="text-xs text-indigo-300 mt-0.5">
                  Sign in below to review the title, description, and save into your vault.
                </p>
              </div>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow transition-colors cursor-pointer shrink-0"
            >
              Sign In & Review
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Personal Encrypted Cloud Storage &bull; Strict UID Isolation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">
              Organize everything you find on the web in one structured dashboard.
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              Tame your scattered bookmarks, code repositories, research papers, and video reels. 
              Automatically categorized with regex patterns, protected by Firestore rules, and searched instantaneously.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                id="hero-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-base font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                )}
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 ml-1 text-indigo-200" />
              </button>
            </div>

            {/* Checklist */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero configuration required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Isolated Firestore per user</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant debounced search & tags</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Regex auto-categorization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Mobile Share Sheet target</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Installable PWA Home Screen app</span>
              </div>
            </div>
          </div>

          {/* Right Column: 4-Quadrant Preview Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>4 Dedicated Hub Sections</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Live Firestore Sync
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">Web Links</h2>
                  <p className="text-xs text-slate-400 mt-1">Articles, tutorials & web apps</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">Documents</h2>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX & Markdown specs</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-2">
                    <Github className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">GitHub Repos</h2>
                  <p className="text-xs text-slate-400 mt-1">Open source codebases & libs</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-2">
                    <Film className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">Reels & Media</h2>
                  <p className="text-xs text-slate-400 mt-1">YouTube, TikTok & Instagram</p>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  Pasting a URL instantly identifies whether it is code, media, or documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Smart Resource Organizer &bull; Secured with Google Firebase Authentication and Firestore Rule Isolation
      </footer>
    </div>
  );
};
