import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Share2, 
  Sparkles, 
  Globe, 
  FileText, 
  Github, 
  Film, 
  ExternalLink, 
  Check, 
  X, 
  Plus, 
  Tag as TagIcon,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import { ResourceCategory, ResourceFormData } from '../types/resource';
import { autoCategorizeUrl, validateUrl } from '../lib/autoCategorize';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';

interface QuickShareScreenProps {
  initialData: {
    url: string;
    title: string;
    description: string;
    category: ResourceCategory;
    tags: string[];
  };
  user: User | null;
  authLoading: boolean;
  onSave: (data: ResourceFormData) => Promise<boolean>;
  onCancel: () => void;
  onOpenDashboard: () => void;
}

const CATEGORIES: { label: ResourceCategory; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Link', icon: Globe },
  { label: 'Document', icon: FileText },
  { label: 'GitHub', icon: Github },
  { label: 'Reel', icon: Film },
];

export const QuickShareScreen: React.FC<QuickShareScreenProps> = ({
  initialData,
  user,
  authLoading,
  onSave,
  onCancel,
  onOpenDashboard,
}) => {
  const [url, setUrl] = useState(initialData.url || '');
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [category, setCategory] = useState<ResourceCategory>(initialData.category || 'Link');
  const [tags, setTags] = useState<string[]>(initialData.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [detectedCategory, setDetectedCategory] = useState<ResourceCategory>(initialData.category || 'Link');
  
  const [urlError, setUrlError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setUrl(initialData.url || '');
    setTitle(initialData.title || '');
    setDescription(initialData.description || '');
    setCategory(initialData.category || 'Link');
    setDetectedCategory(initialData.category || 'Link');
    setTags(initialData.tags || []);
  }, [initialData]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!newUrl.trim()) {
      setUrlError('URL is required');
      return;
    }
    const validation = validateUrl(newUrl);
    if (!validation.isValid) {
      setUrlError(validation.error || 'Invalid URL');
    } else {
      setUrlError(null);
      const detected = autoCategorizeUrl(newUrl);
      setDetectedCategory(detected);
      setCategory(detected);
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setAuthError(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!title.trim()) {
      setTitleError('Please enter a title');
      hasError = true;
    } else {
      setTitleError(null);
    }

    if (!url.trim()) {
      setUrlError('Please enter a URL');
      hasError = true;
    } else {
      const validation = validateUrl(url);
      if (!validation.isValid) {
        setUrlError(validation.error || 'Invalid URL');
        hasError = true;
      } else {
        setUrlError(null);
      }
    }

    if (hasError) return;

    setIsSaving(true);
    const success = await onSave({
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
      category,
      tags,
    });

    setIsSaving(false);

    if (success) {
      setIsSaved(true);
      // Automatically attempt to close the popup window / return to the calling app
      setTimeout(() => {
        try {
          window.close();
        } catch {}
        setTimeout(() => {
          try {
            window.history.back();
          } catch {}
        }, 120);
      }, 700);
    }
  };

  const handleDismiss = () => {
    onCancel();
    try {
      window.close();
    } catch {}
    setTimeout(() => {
      try {
        window.history.back();
      } catch {}
    }, 120);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Quick Share Modal Card */}
      <div 
        id="quick-share-popup-card"
        className="w-full max-w-lg bg-slate-900/95 border border-indigo-500/30 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden relative z-10 transition-all duration-200 animate-in fade-in zoom-in-95"
      >
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Quick Save to Vault
                </h1>
                <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Direct Share
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Save resource and return directly to what you were doing
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            disabled={isSaving}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Cancel and return"
            aria-label="Cancel and return"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* STATE 1: Auth Loading */}
          {authLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Connecting to your vault...</p>
            </div>
          )}

          {/* STATE 2: Not Signed In */}
          {!authLoading && !user && (
            <div className="py-6 space-y-5 text-center">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-left space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                  Incoming Link
                </span>
                <p className="text-sm font-medium text-white truncate font-mono">
                  {url || 'Shared item'}
                </p>
                {title && (
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">
                  Sign in to save this link
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sign in once to save this directly to your private cloud vault, then you can instantly return to your app.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSigningIn ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>Sign In with Google</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-5 py-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel & Return
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: Successfully Saved Feedback */}
          {!authLoading && user && isSaved && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Saved to your Vault!
                </h2>
                <p className="text-xs text-slate-400">
                  Returning you to what you were doing...
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleDismiss}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Done (Close Window)
                </button>
                <button
                  onClick={onOpenDashboard}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Open in full vault &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: Authenticated & Editing Form */}
          {!authLoading && user && !isSaved && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Shared Link Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="quick-url-input" className="block text-xs font-semibold text-slate-200">
                    Shared Link <span className="text-rose-400">*</span>
                  </label>
                  {url && !urlError && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  id="quick-url-input"
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com/..."
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none transition-colors ${
                    urlError
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                />
                {urlError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{urlError}</span>
                  </p>
                )}
              </div>

              {/* Title Field (User can enter/edit title here) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="quick-title-input" className="block text-xs font-semibold text-slate-200">
                    Title <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">{title.length}/100</span>
                </div>
                <input
                  id="quick-title-input"
                  type="text"
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError(null);
                  }}
                  placeholder="Enter a descriptive title..."
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border text-white text-sm placeholder:text-slate-500 focus:outline-none transition-colors ${
                    titleError
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                  autoFocus
                />
                {titleError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{titleError}</span>
                  </p>
                )}
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-200">
                    Category
                  </label>
                  <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Detected: {detectedCategory}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.label;
                    const isAuto = detectedCategory === cat.label;

                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="truncate">{cat.label}</span>
                        {isAuto && (
                          <span className="absolute -top-1.5 -right-1 text-[8px] bg-indigo-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                            Auto
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description & Notes Field (User can enter personal notes here) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="quick-desc-input" className="block text-xs font-semibold text-slate-200">
                    Description & Notes <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">{description.length}/300</span>
                </div>
                <textarea
                  id="quick-desc-input"
                  rows={3}
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add your thoughts, key takeaways, or why you saved this..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Tags
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <TagIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleKeyDownTag}
                      placeholder="Add tag and press Enter"
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-white transition-colors cursor-pointer ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions: Save & Return vs Cancel */}
              <div className="pt-3 flex flex-col gap-3 border-t border-slate-800">
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel & Return
                  </button>
                  <button
                    id="quick-save-and-return-btn"
                    type="submit"
                    disabled={isSaving || !title.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Save & Return</span>
                  </button>
                </div>

                {/* Direct Vault Escape Hatch */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={onOpenDashboard}
                    className="text-[11px] text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    Want to view your full vault instead? Open App Dashboard &rarr;
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
