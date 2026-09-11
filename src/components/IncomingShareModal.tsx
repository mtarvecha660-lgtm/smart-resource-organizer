// File: src/components/IncomingShareModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Globe,
  FileText,
  Github,
  Film,
  ExternalLink,
  Check,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { ResourceCategory, ResourceFormData } from '../types/resource';
import { autoCategorizeUrl, validateUrl } from '../lib/autoCategorize';

interface IncomingShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ResourceFormData) => Promise<boolean>;
  initialData: {
    url: string;
    title: string;
    description: string;
    category: ResourceCategory;
    tags: string[];
  } | null;
  loading: boolean;
}

const CATEGORIES: { label: ResourceCategory; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Link', icon: Globe },
  { label: 'Document', icon: FileText },
  { label: 'GitHub', icon: Github },
  { label: 'Reel', icon: Film },
];

export const IncomingShareModal: React.FC<IncomingShareModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  loading,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('Link');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [detectedCategory, setDetectedCategory] = useState<ResourceCategory>('Link');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialData) {
      setUrl(initialData.url || '');
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'Link');
      setDetectedCategory(initialData.category || 'Link');
      setTags(initialData.tags || []);
      setTagInput('');
      setUrlError(null);
      setTitleError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen || !initialData) return null;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!newUrl.trim()) {
      setUrlError('URL required');
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

    const success = await onSave({
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
      category,
      tags,
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div
        id="incoming-share-modal"
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden my-6 text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono">
              Incoming Web Share
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 font-mono text-xs">
          {/* Shared Link Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="share-url-input" className="text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Shared URL <span className="text-red-500">*</span>
              </label>
              {url && !urlError && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:underline"
                >
                  <span>Open URL</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              id="share-url-input"
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border text-xs focus:outline-none transition-colors ${
                urlError
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600'
              }`}
            />
            {urlError && (
              <p className="text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{urlError}</span>
              </p>
            )}
          </div>

          {/* Title Field */}
          <div className="space-y-1">
            <label htmlFor="share-title-input" className="block text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="share-title-input"
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
            {titleError && (
              <p className="text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{titleError}</span>
              </p>
            )}
          </div>

          {/* Category Selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Category
              </label>
              <span className="text-[10px] text-zinc-400">
                Detected: {detectedCategory}
              </span>
            </div>

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

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="share-desc-input" className="block text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Description & Notes
            </label>
            <textarea
              id="share-desc-input"
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-sans focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none"
            />
          </div>

          {/* Tags */}
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

          {/* Actions */}
          <div className="pt-2.5 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1 rounded-md text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="confirm-share-save-btn"
              type="submit"
              disabled={loading || !title.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Commit Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
