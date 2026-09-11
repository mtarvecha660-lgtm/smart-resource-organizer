import React from 'react';
import { 
  Globe, 
  FileText, 
  Github, 
  Film, 
  Search, 
  Plus, 
  Sparkles,
  Inbox
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
          icon: <Globe className="w-8 h-8 text-blue-400" />,
          title: 'No Web Links Saved',
          description:
            'Bookmark blogs, design systems, articles, or tools to keep them at your fingertips.',
          tip: 'Tip: Any standard website URL defaults to the Web Links category.',
          actionText: 'Add First Link',
          catParam: 'Link' as ResourceCategory,
        };
      case 'Document':
        return {
          icon: <FileText className="w-8 h-8 text-amber-400" />,
          title: 'No Documents Found',
          description:
            'Store technical specifications, academic papers, books, or documentation.',
          tip: 'Tip: Links ending in .pdf, .docx, or .md are automatically routed here.',
          actionText: 'Add Document',
          catParam: 'Document' as ResourceCategory,
        };
      case 'GitHub':
        return {
          icon: <Github className="w-8 h-8 text-violet-400" />,
          title: 'No GitHub Repositories',
          description:
            'Track open-source libraries, boilerplates, and developer tools you discover.',
          tip: 'Tip: Paste any github.com repository URL and it will be auto-categorized.',
          actionText: 'Add GitHub Repo',
          catParam: 'GitHub' as ResourceCategory,
        };
      case 'Reel':
        return {
          icon: <Film className="w-8 h-8 text-pink-400" />,
          title: 'No Reels or Media',
          description:
            'Save inspiring video tutorials, tech breakdowns, short-form reels, or clips.',
          tip: 'Tip: URLs from Instagram, TikTok, or YouTube are automatically placed here.',
          actionText: 'Add Video or Reel',
          catParam: 'Reel' as ResourceCategory,
        };
      case 'Search':
        return {
          icon: <Search className="w-8 h-8 text-indigo-400" />,
          title: 'No Matching Resources',
          description: searchQuery
            ? `We couldn't find anything matching "${searchQuery}".`
            : 'No resources match your active search filters or tags.',
          tip: 'Tip: Try searching by partial title, domain, description, or tag names.',
          actionText: 'Clear Search',
          isClearSearch: true,
        };
      case 'All':
      default:
        return {
          icon: <Inbox className="w-8 h-8 text-indigo-400" />,
          title: 'Your Resource Vault is Empty',
          description:
            'Start organizing your digital library. Add your first link, paper, repository, or video.',
          tip: 'Tip: Paste any URL into Add Resource and let Auto-Categorize do the work.',
          actionText: 'Add Your First Resource',
          catParam: undefined,
        };
    }
  };

  const details = getEmptyDetails();

  return (
    <div
      id={`empty-state-${category.toLowerCase()}`}
      className="w-full flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 shadow-inner">
        {details.icon}
      </div>

      <h3 className="text-base font-semibold text-white tracking-tight mb-1.5">
        {details.title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
        {details.description}
      </p>

      {/* Helpful Tip */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-900/50 text-[11px] text-indigo-300 mb-6 max-w-md">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span className="leading-snug text-left">{details.tip}</span>
      </div>

      {/* Action Button */}
      {details.isClearSearch ? (
        <button
          onClick={onClearSearch}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
        >
          Clear Filters
        </button>
      ) : (
        onAddClick && (
          <button
            onClick={() => onAddClick(details.catParam)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{details.actionText}</span>
          </button>
        )
      )}
    </div>
  );
};
