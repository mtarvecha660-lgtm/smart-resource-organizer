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
  Copy
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

  // Host extraction for favicon & display
  let hostname = '';
  try {
    hostname = new URL(item.url).hostname.replace(/^www\./, '');
  } catch {
    hostname = item.url;
  }

  const getCategoryConfig = (category: ResourceCategory) => {
    switch (category) {
      case 'GitHub':
        return {
          icon: <Github className="w-4 h-4 text-violet-400" />,
          badgeBg: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
          hoverBorder: 'hover:border-violet-500/40',
        };
      case 'Reel':
        return {
          icon: <Film className="w-4 h-4 text-pink-400" />,
          badgeBg: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
          hoverBorder: 'hover:border-pink-500/40',
        };
      case 'Document':
        return {
          icon: <FileText className="w-4 h-4 text-amber-400" />,
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          hoverBorder: 'hover:border-amber-500/40',
        };
      case 'Link':
      default:
        return {
          icon: <Globe className="w-4 h-4 text-blue-400" />,
          badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
          hoverBorder: 'hover:border-blue-500/40',
        };
    }
  };

  const categoryConfig = getCategoryConfig(item.category);

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
      const date = 'toDate' in item.createdAt && typeof item.createdAt.toDate === 'function'
        ? item.createdAt.toDate()
        : 'seconds' in item.createdAt
        ? new Date((item.createdAt as { seconds: number }).seconds * 1000)
        : null;
      if (!date) return '';
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    } catch {
      return '';
    }
  })();

  const descriptionNeedsExpansion = (item.description || '').length > 110;

  return (
    <article
      id={`resource-card-${item.id}`}
      className={`group relative bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col justify-between ${categoryConfig.hoverBorder}`}
    >
      <div>
        {/* Top bar: Favicon, Category Pill, Action Menu */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Favicon or fallback category icon */}
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden">
              {!faviconError && hostname ? (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
                  alt=""
                  className="w-4 h-4 object-contain"
                  onError={() => setFaviconError(true)}
                  loading="lazy"
                />
              ) : (
                categoryConfig.icon
              )}
            </div>

            <div className="min-w-0">
              <span
                className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md border ${categoryConfig.badgeBg}`}
              >
                {item.category}
              </span>
            </div>
          </div>

          {/* Action Menu button & dropdown */}
          <div className="relative shrink-0">
            <button
              id={`menu-trigger-${item.id}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Actions"
              aria-label="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div
                  id={`action-menu-${item.id}`}
                  className="absolute right-0 top-8 z-30 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 text-xs text-slate-200"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/60 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open in new tab</span>
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700/60 transition-colors text-left cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{copied ? 'Copied URL!' : 'Copy URL'}</span>
                  </button>

                  <button
                    id={`action-edit-${item.id}`}
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(item);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700/60 transition-colors text-left cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit item</span>
                  </button>

                  <div className="border-t border-slate-700/60 my-1" />

                  <button
                    id={`action-delete-${item.id}`}
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(item.id, item.title);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-500/20 text-rose-300 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
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
          className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug group-hover:text-white transition-colors"
        >
          {item.title}
        </h3>

        {/* Domain subline */}
        <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
          {hostname}
        </p>

        {/* Description (Expandable) */}
        {item.description && (
          <div className="mt-2.5">
            <p
              className={`text-xs text-slate-300 leading-relaxed ${
                !isExpanded && descriptionNeedsExpansion ? 'line-clamp-2' : ''
              }`}
            >
              {item.description}
            </p>
            {descriptionNeedsExpansion && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>Show more</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* AI Summary Preview if generated or Document */}
        {item.category === 'Document' && (
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <button
              onClick={handleGenerateSummary}
              disabled={isSummarizing}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300/90 hover:text-amber-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3 h-3 text-amber-400 ${isSummarizing ? 'animate-spin' : ''}`} />
              <span>{isSummarizing ? 'Analyzing document...' : showAiSummary ? 'Hide AI Summary' : 'AI Quick Summary'}</span>
            </button>

            {showAiSummary && aiSummary && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1.5">
                <p className="leading-relaxed font-normal">{aiSummary.summary}</p>
                <ul className="list-disc list-inside text-amber-300/80 space-y-0.5">
                  {aiSummary.keyPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Clickable Tags & Date / Open Link */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {item.tags.map((tag) => {
              const isSelected = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70 border border-slate-700/50'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{formattedDate}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <span>Visit</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
