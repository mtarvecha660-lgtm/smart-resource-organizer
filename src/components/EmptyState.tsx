// File: src/components/EmptyState.tsx
import React from 'react';
import {
  Globe,
  FileText,
  Github,
  Film,
  Search,
  Plus,
  Inbox,
} from 'lucide-react';
import { ResourceCategory } from '../types/resource';

interface EmptyStateProps {
  category?: ResourceCategory | 'All' | 'Search';
  onAddClick?: (category?: ResourceCategory) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  category = 'All',
  onAddClick,
  searchQuery,
  onClearSearch,
}) => {
  const getEmptyDetails = () => {
    switch (category) {
      case 'Link':
        return {
          icon: <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
          title: 'No Web Links Saved',
          description: 'Store bookmarks, web applications, and documentation links.',
          tip: 'Standard URLs default to Web Links category.',
          actionText: 'Add Link',
          catParam: 'Link' as ResourceCategory,
        };
      case 'Document':
        return {
          icon: <FileText className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
          title: 'No Documents Found',
          description: 'Save PDF, DOCX, Markdown or specification documents.',
          tip: 'Files ending in .pdf, .docx, or .md are routed here automatically.',
          actionText: 'Add Document',
          catParam: 'Document' as ResourceCategory,
        };
      case 'GitHub':
        return {
          icon: <Github className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
          title: 'No Repositories',
          description: 'Track open-source libraries and code repositories.',
          tip: 'Any github.com link is auto-categorized as GitHub.',
          actionText: 'Add Repo',
          catParam: 'GitHub' as ResourceCategory,
        };
      case 'Reel':
        return {
          icon: <Film className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
          title: 'No Media or Reels',
          description: 'Store technical video breakdowns and tutorials.',
          tip: 'YouTube, TikTok, and media URLs are routed here.',
          actionText: 'Add Video',
          catParam: 'Reel' as ResourceCategory,
        };
      case 'Search':
        return {
          icon: <Search className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
          title: 'No Matching Resources',
          description: searchQuery
            ? `No records match "${searchQuery}".`
            : 'No resources match current filter criteria.',
          tip: 'Search checks titles, descriptions, tags, and hostnames.',
          actionText: 'Clear Filters',
          isClearSearch: true,
        };
      case 'All':
      default:
        return {
          icon: <Inbox className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
          title: 'Vault is Empty',
          description: 'Your collection has no resources saved yet.',
          tip: 'Paste a link into the Quick Send bar above or drag-and-drop.',
          actionText: 'Add First Item',
          catParam: undefined,
        };
    }
  };

  const details = getEmptyDetails();

  return (
    <div
      id={`empty-state-${category.toLowerCase()}`}
      className="w-full flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"
    >
      <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center mb-3">
        {details.icon}
      </div>

      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-1 font-mono">
        {details.title}
      </h3>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-3">
        {details.description}
      </p>

      <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 mb-4">
        {details.tip}
      </div>

      {details.isClearSearch ? (
        <button
          onClick={onClearSearch}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer"
        >
          Clear Filters
        </button>
      ) : (
        onAddClick && (
          <button
            onClick={() => onAddClick(details.catParam)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{details.actionText}</span>
          </button>
        )
      )}
    </div>
  );
};
