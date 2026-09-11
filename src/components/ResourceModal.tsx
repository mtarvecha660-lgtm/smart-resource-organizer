import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Globe, 
  FileText, 
  Github, 
  Film, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { ResourceCategory, ResourceFormData, ResourceItem } from '../types/resource';
import { validateUrl, autoCategorizeUrl, suggestTitleFromUrl } from '../lib/autoCategorize';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => Promise<void>;
  initialData?: ResourceItem | null;
  loading: boolean;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
}) => {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('Link');
  const [isCategoryUserSelected, setIsCategoryUserSelected] = useState(false);
  const [autoDetectedCategory, setAutoDetectedCategory] = useState<ResourceCategory | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setUrl(initialData.url);
        setTitle(initialData.title);
        setCategory(initialData.category);
        setIsCategoryUserSelected(true);
        setDescription(initialData.description || '');
        setTags(initialData.tags || []);
        setUrlError(null);
        setAutoDetectedCategory(null);
      } else {
        // Reset for new item
        setUrl('');
        setUrlError(null);
        setTitle('');
        setCategory('Link');
        setIsCategoryUserSelected(false);
        setAutoDetectedCategory(null);
        setDescription('');
        setTags([]);
        setTagInput('');
        setTouched(false);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Handle URL Change & Auto-categorization
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);

    if (!val.trim()) {
      setUrlError(null);
      setAutoDetectedCategory(null);
      return;
    }

    const validation = validateUrl(val);
    if (!validation.isValid) {
      setUrlError(validation.error || 'Invalid URL');
    } else {
      setUrlError(null);
    }

    // Auto categorize based on the regex specifications
    const detected = autoCategorizeUrl(val);
    setAutoDetectedCategory(detected);

    // If user hasn't explicitly clicked a category button, auto-select it
    if (!isCategoryUserSelected) {
      setCategory(detected);
    }

    // Suggest title if empty
    if (!title.trim()) {
      const suggested = suggestTitleFromUrl(val);
      if (suggested) {
        setTitle(suggested);
      }
    }
  };

  const handleUrlBlur = () => {
    setTouched(true);
    if (url.trim()) {
      const validation = validateUrl(url);
      if (!validation.isValid) {
        setUrlError(validation.error || 'Invalid URL');
      } else {
        setUrlError(null);
      }
    }
  };

  const handleSelectCategory = (cat: ResourceCategory) => {
    setCategory(cat);
    setIsCategoryUserSelected(true);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/^[#,\s]+/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const validation = validateUrl(url);
    if (!validation.isValid) {
      setUrlError(validation.error || 'Please provide a valid URL.');
      return;
    }

    if (!title.trim()) {
      return;
    }

    await onSubmit({
      url: url.trim(),
      title: title.trim(),
      category,
      description: description.trim(),
      tags,
    });
  };

  const categoryOptions: { label: string; value: ResourceCategory; icon: React.ReactNode }[] = [
    { label: 'Link', value: 'Link', icon: <Globe className="w-4 h-4" /> },
    { label: 'Document', value: 'Document', icon: <FileText className="w-4 h-4" /> },
    { label: 'GitHub', value: 'GitHub', icon: <Github className="w-4 h-4" /> },
    { label: 'Reel', value: 'Reel', icon: <Film className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        id="resource-modal"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 my-8 text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {initialData ? 'Edit Resource' : 'Add New Resource'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Save links, docs, repositories, or reels to your personal vault
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5 mt-5">
          {/* URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="resource-url-input" className="text-xs font-semibold text-slate-300">
                Resource URL <span className="text-rose-400">*</span>
              </label>
              {autoDetectedCategory && (
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Auto-detected: {autoDetectedCategory}</span>
                </span>
              )}
            </div>
            <input
              id="resource-url-input"
              type="text"
              value={url}
              onChange={handleUrlChange}
              onBlur={handleUrlBlur}
              placeholder="https://github.com/... or https://..."
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                urlError && (touched || url)
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {/* Inline Red Error Message */}
            {urlError && (touched || url) && (
              <div id="url-inline-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categoryOptions.map((opt) => {
                const isSelected = category === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    id={`category-select-${opt.value.toLowerCase()}`}
                    onClick={() => handleSelectCategory(opt.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm'
                        : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label htmlFor="resource-title-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="resource-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React 19 Architecture Guide"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="resource-desc-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="resource-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context, key takeaways, or why you saved this..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Tags Input */}
          <div>
            <label htmlFor="resource-tag-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tags <span className="text-slate-500 font-normal">(press Enter or comma to add)</span>
            </label>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 flex flex-wrap items-center gap-1.5 min-h-[42px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-indigo-400 hover:text-white ml-0.5 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                id="resource-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "e.g. react, tutorial, api" : "Add more..."}
                className="flex-1 bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 focus:outline-none min-w-[100px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="resource-modal-submit-btn"
              disabled={loading || !!urlError || !url.trim() || !title.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{initialData ? 'Save Changes' : 'Add Resource'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
