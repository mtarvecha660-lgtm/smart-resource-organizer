// File: src/components/IncomingShareBanner.tsx
import React from 'react';
import { ExternalLink, Edit3, X, Share2 } from 'lucide-react';
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
      className="mb-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs animate-in fade-in"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-400 mt-0.5">
            <Share2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Captured via Mobile Share
              </span>
              <span className="text-[10px] uppercase px-1 py-0.2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {item.category}
              </span>
            </div>
            <h4 className="font-sans text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
              {item.title}
            </h4>
            <p className="text-[11px] text-zinc-500 truncate mt-0.5 max-w-xl">
              {item.url}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
          <button
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open</span>
          </a>

          <button
            onClick={onDismiss}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
