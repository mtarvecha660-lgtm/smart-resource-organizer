import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Sparkles, 
  Globe, 
  FileText, 
  Github, 
  Film, 
  ExternalLink, 
  Check, 
  Plus, 
  Tag as TagIcon,
  AlertCircle 
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
      setUrlError('URL cannot be empty');
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
      setTitleError('Title is required');
      hasError = true;
    } else {
      setTitleError(null);
    }

    if (!url.trim()) {
      setUrlError('URL cannot be empty');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="incoming-share-modal"
        className="w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 transition-all"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Save Shared Resource
                </h3>
                <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Mobile Share
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and customize the title and description before saving
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Shared Link Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="share-url-input" className="block text-xs font-semibold text-slate-200">
                Shared Link <span className="text-rose-400">*</span>
              </label>
              {url && !urlError && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  <span>Preview link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              id="share-url-input"
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
              <label htmlFor="share-title-input" className="block text-xs font-semibold text-slate-200">
                Title <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">{title.length}/100</span>
            </div>
            <input
              id="share-title-input"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setTitleError(null);
              }}
              placeholder="Enter resource title..."
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

          {/* Description & Notes Field (User can enter/edit description here) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="share-desc-input" className="block text-xs font-semibold text-slate-200">
                Description & Notes <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <span className="text-[11px] text-slate-500">{description.length}/300</span>
            </div>
            <textarea
              id="share-desc-input"
              rows={3}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add your personal notes, thoughts, or key takeaways..."
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
                  placeholder="Add a tag and press Enter"
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

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="confirm-share-save-btn"
              type="submit"
              disabled={loading || !title.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Save to Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
