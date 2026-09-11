// File: src/components/ResourceModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  FileText,
  Github,
  Film,
  AlertCircle,
  Plus,
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

    const detected = autoCategorizeUrl(val);
    setAutoDetectedCategory(detected);

    if (!isCategoryUserSelected) {
      setCategory(detected);
    }

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
    { label: 'Link', value: 'Link', icon: <Globe className="w-3.5 h-3.5" /> },
    { label: 'Document', value: 'Document', icon: <FileText className="w-3.5 h-3.5" /> },
    { label: 'GitHub', value: 'GitHub', icon: <Github className="w-3.5 h-3.5" /> },
    { label: 'Reel', value: 'Reel', icon: <Film className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      <div
        id="resource-modal"
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-5 z-10 my-8 text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {initialData ? 'Edit Resource' : 'Add Resource'}
            </h2>
            <p className="font-mono text-[11px] text-zinc-500 mt-0.5">
              Target destination: Firestore isolation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
          {/* URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="resource-url-input" className="font-mono text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                URL <span className="text-red-500">*</span>
              </label>
              {autoDetectedCategory && (
                <span className="font-mono text-[10px] uppercase text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60">
                  detected: {autoDetectedCategory}
                </span>
              )}
            </div>
            <input
              id="resource-url-input"
              type="text"
              value={url}
              onChange={handleUrlChange}
              onBlur={handleUrlBlur}
              placeholder="https://..."
              className={`w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-colors ${
                urlError && (touched || url)
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600'
              }`}
            />
            {urlError && (touched || url) && (
              <div id="url-inline-error" className="mt-1 flex items-center gap-1 text-[11px] font-mono text-red-500">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Category
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {categoryOptions.map((opt) => {
                const isSelected = category === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    id={`category-select-${opt.value.toLowerCase()}`}
                    onClick={() => handleSelectCategory(opt.value)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-mono transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-medium'
                        : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
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
            <label htmlFor="resource-title-input" className="block font-mono text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="resource-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Engine"
              className="w-full px-3 py-2 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
            />
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="resource-desc-input" className="block font-mono text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Description <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="resource-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context or notes..."
              className="w-full px-3 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none"
            />
          </div>

          {/* Tags Input */}
          <div>
            <label htmlFor="resource-tag-input" className="block font-mono text-[11px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Tags <span className="text-zinc-400 font-normal">(comma or enter)</span>
            </label>
            <div className="p-1.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-1 min-h-[38px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[10px]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
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
                placeholder={tags.length === 0 ? "add tags..." : ""}
                className="flex-1 bg-transparent border-none text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none min-w-[80px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 rounded-md text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="resource-modal-submit-btn"
              disabled={loading || !!urlError || !url.trim() || !title.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{initialData ? 'Save Changes' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
