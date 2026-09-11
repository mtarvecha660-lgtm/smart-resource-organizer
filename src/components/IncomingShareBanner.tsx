import React from 'react';
import { Sparkles, ExternalLink, Edit3, X, CheckCircle2, Share2 } from 'lucide-react';
import { ResourceItem } from '../types/resource';

interface IncomingShareBannerProps {
  item: ResourceItem;
  onEdit: (item: ResourceItem) => void;
  onDismiss: () => void;
}

export const IncomingShareBanner: React.FC<IncomingShareBannerProps> = ({
  item,
  onEdit,
  onDismiss,
}) => {
  return (
    <div 
      id="incoming-mobile-share-banner"
      className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-500/40 shadow-xl shadow-indigo-950/40 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30 text-white mt-0.5">
            <Share2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 uppercase tracking-wider bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Shared from Mobile
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {item.category}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate mt-1">
              {item.title}
            </h4>
            <p className="text-xs text-slate-400 truncate mt-0.5 max-w-xl">
              {item.url}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0">
          <button
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit / Add Notes</span>
          </button>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Link</span>
          </a>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
