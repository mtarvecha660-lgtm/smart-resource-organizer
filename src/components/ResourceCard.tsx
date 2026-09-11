// File: src/components/ResourceCard.tsx
import React, { useState } from 'react';
import {
  Globe,
  FileText,
  Github,
  Film,
  ExternalLink,
  MoreVertical,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Copy,
} from 'lucide-react';
import { ResourceItem, ResourceCategory } from '../types/resource';
import { summarizeDocument, DocumentSummaryResult } from '../services/geminiService';

interface ResourceCardProps {
  item: ResourceItem;
  onEdit: (item: ResourceItem) => void;
  onDelete: (id: string, title: string) => void;
  onTagClick: (tag: string) => void;
  activeTag: string | null;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  item,
  onEdit,
  onDelete,
  onTagClick,
  activeTag,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<DocumentSummaryResult | null>(null);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  let hostname = '';
  try {
    hostname = new URL(item.url).hostname.replace(/^www\./, '');
  } catch {
    hostname = item.url;
  }

  const getCategoryIcon = (category: ResourceCategory) => {
    switch (category) {
      case 'GitHub':
        return <Github className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />;
      case 'Reel':
        return <Film className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />;
      case 'Document':
        return <FileText className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />;
      case 'Link':
      default:
        return <Globe className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setIsMenuOpen(false);
    } catch (e) {
      console.error('Failed to copy URL', e);
    }
  };

  const handleGenerateSummary = async () => {
    if (aiSummary) {
      setShowAiSummary(!showAiSummary);
      return;
    }
    setIsSummarizing(true);
    try {
      const res = await summarizeDocument(item.title, item.url, item.description);
      setAiSummary(res);
      setShowAiSummary(true);
    } catch (err) {
      console.error('AI summary error:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const formattedDate = (() => {
    if (!item.createdAt) return '';
    try {
      const date =
        'toDate' in item.createdAt && typeof item.createdAt.toDate === 'function'
          ? item.createdAt.toDate()
          : 'seconds' in item.createdAt
          ? new Date((item.createdAt as { seconds: number }).seconds * 1000)
          : null;
      if (!date) return '';
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  })();

  const isLongDescription = (item.description || '').length > 120;

  return (
    <article
      id={`resource-card-${item.id}`}
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 sm:p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col justify-between"
    >
      <div>
        {/* Header: Category Badge, Hostname & Action Menu */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center shrink-0 overflow-hidden">
              {!faviconError && hostname && !hostname.startsWith('smart-resource.local') ? (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                  alt=""
                  className="w-3.5 h-3.5 object-contain"
                  onError={() => setFaviconError(true)}
                  loading="lazy"
                />
              ) : (
                getCategoryIcon(item.category)
              )}
            </div>

            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60 shrink-0">
              {item.category}
            </span>

            <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[140px] sm:max-w-[200px]">
              {hostname}
            </span>
          </div>

          <div className="relative shrink-0">
            <button
              id={`menu-trigger-${item.id}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="More options"
              aria-label="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div
                  id={`action-menu-${item.id}`}
                  className="absolute right-0 top-7 z-30 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg py-1 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                    <span>Open in tab</span>
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-zinc-900 dark:text-zinc-100" />
                    ) : (
                      <Copy className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy URL'}</span>
                  </button>

                  <button
                    id={`action-edit-${item.id}`}
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                    <span>Edit</span>
                  </button>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

                  <button
                    id={`action-delete-${item.id}`}
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(item.id, item.title);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600 dark:text-red-400 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          title={item.title}
          className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2"
        >
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <div className="mt-2">
            <p
              className={`text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans ${
                !isExpanded && isLongDescription ? 'line-clamp-2' : ''
              }`}
            >
              {item.description}
            </p>
            {isLongDescription && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <span>Collapse</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>Expand</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* AI Quick Summary Trigger (Document or explicit request) */}
        {(item.category === 'Document' || (item.description && item.description.length > 80)) && (
          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              onClick={handleGenerateSummary}
              disabled={isSummarizing}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3 h-3 ${isSummarizing ? 'animate-spin' : ''}`} />
              <span>
                {isSummarizing ? 'Analyzing...' : showAiSummary ? 'Hide Summary' : 'AI Summary'}
              </span>
            </button>

            {showAiSummary && aiSummary && (
              <div className="mt-2 p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 space-y-2">
                <p className="leading-relaxed font-sans">{aiSummary.summary}</p>
                {aiSummary.keyPoints.length > 0 && (
                  <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 text-[11px] space-y-0.5">
                    {aiSummary.keyPoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Monospaced Tags & Date / External Link */}
      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.map((tag) => {
              const isSelected = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                      : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
          <span>{formattedDate}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <span>Visit</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </article>
  );
};
