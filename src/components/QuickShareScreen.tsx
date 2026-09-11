// File: src/components/QuickShareScreen.tsx
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Share2,
  Globe,
  FileText,
  Github,
  Film,
  ExternalLink,
  Check,
  X,
  Plus,
  AlertCircle,
  LogIn,
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
      setTitleError('Title required');
      hasError = true;
    } else {
      setTitleError(null);
    }

    if (!url.trim()) {
      setUrlError('URL required');
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
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-900 dark:text-zinc-100 font-sans">
      <div
        id="quick-share-popup-card"
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden relative z-10"
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-zinc-500" />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold">
              Share Receiver
            </span>
          </div>

          <button
            onClick={handleDismiss}
            disabled={isSaving}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 font-mono text-xs">
          {authLoading && (
            <div className="py-8 flex flex-col items-center justify-center space-y-2 text-zinc-500">
              <div className="w-4 h-4 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
              <span>Verifying session...</span>
            </div>
          )}

          {!authLoading && !user && (
            <div className="py-4 space-y-3 text-center">
              <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-left space-y-1">
                <span className="text-[10px] uppercase text-zinc-400 font-semibold">
                  Payload Target
                </span>
                <p className="text-xs text-zinc-900 dark:text-zinc-100 truncate">
                  {url || 'Shared item'}
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                  Authentication Required
                </h3>
                <p className="text-xs text-zinc-500">
                  Authenticate to commit this document to your isolated Firestore collection.
                </p>
              </div>

              {authError && (
                <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-800 text-red-500 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Authenticate with Google</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 rounded text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {!authLoading && user && isSaved && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                <Check className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-sans">
                Document Persisted
              </h2>
              <button
                onClick={onOpenDashboard}
                className="text-[11px] text-zinc-500 hover:underline cursor-pointer"
              >
                Open Dashboard &rarr;
              </button>
            </div>
          )}

          {!authLoading && user && !isSaved && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="quick-url-input" className="text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    URL <span className="text-red-500">*</span>
                  </label>
                  {url && !urlError && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:underline"
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
                  className={`w-full px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border text-xs focus:outline-none transition-colors ${
                    urlError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="quick-title-input" className="block text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="quick-title-input"
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError(null);
                  }}
                  className={`w-full px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border text-xs font-sans focus:outline-none transition-colors ${
                    titleError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600'
                  }`}
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Category
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.label;

                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="quick-desc-input" className="block text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Description
                </label>
                <textarea
                  id="quick-desc-input"
                  rows={2}
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-sans focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Tags
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDownTag}
                    placeholder="Add tag and press Enter"
                    className="flex-1 px-3 py-1 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                    className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px]"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isSaving}
                  className="px-3 py-1 rounded-md text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="quick-save-and-return-btn"
                  type="submit"
                  disabled={isSaving || !title.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Commit</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
