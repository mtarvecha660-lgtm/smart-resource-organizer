// File: src/components/SendToVaultModal.tsx
import React, { useState } from 'react';
import {
  X,
  Send,
  Clipboard,
  DownloadCloud,
  Bookmark,
  Check,
  Copy,
  Share2,
} from 'lucide-react';

interface SendToVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  appOrigin: string;
}

export const SendToVaultModal: React.FC<SendToVaultModalProps> = ({
  isOpen,
  onClose,
  appOrigin,
}) => {
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  if (!isOpen) return null;

  const bookmarkletCode = `javascript:(function(){var u=encodeURIComponent(window.location.href);var t=encodeURIComponent(document.title);window.open('${appOrigin}/?saveUrl='+u+'&title='+t,'_blank');})();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const sampleUrlParam = `${appOrigin}/?saveUrl=https://github.com/facebook/react&title=React`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(sampleUrlParam);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div
        id="send-to-vault-modal"
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden my-8 text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">
              Capture Protocols
            </h2>
            <p className="font-mono text-[11px] text-zinc-500 mt-0.5">
              Available intake interfaces for storing resources
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 font-mono text-xs">
          {/* Method 0: Mobile Share Target */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">
                Web Share Target (PWA)
              </span>
            </div>
            <p className="font-sans text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              When installed on mobile, tap "Share" in any browser or app, then choose "Smart Resource Organizer". The capture dialog will open pre-filled with the resource parameters.
            </p>
          </div>

          {/* Method 1: Quick Send */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">
                Quick Send Input Bar
              </span>
            </div>
            <p className="font-sans text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              Enter any URL, repository link, document address, or text note in the top bar and press Enter to save to the collection.
            </p>
          </div>

          {/* Method 2: Global Clipboard Paste */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center gap-2">
              <Clipboard className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">
                Global Clipboard Paste
              </span>
            </div>
            <p className="font-sans text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              Press Ctrl+V or Cmd+V anywhere on the dashboard without an active text field to capture your clipboard contents.
            </p>
          </div>

          {/* Method 3: Drag & Drop */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center gap-2">
              <DownloadCloud className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">
                Drag & Drop
              </span>
            </div>
            <p className="font-sans text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              Drag links from another browser tab or your desktop directly over the dashboard window to trigger instant ingestion.
            </p>
          </div>

          {/* Method 4: Browser Bookmarklet */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">
                Browser Bookmarklet
              </span>
            </div>
            <p className="font-sans text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              Copy the JavaScript snippet below and save it as a browser bookmark URL:
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyBookmarklet}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer"
              >
                {copiedBookmarklet ? <Check className="w-3 h-3 text-zinc-900 dark:text-zinc-100" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                <span>{copiedBookmarklet ? 'Copied' : 'Copy Bookmarklet Code'}</span>
              </button>
            </div>
          </div>

          {/* Method 5: URL Parameter Ingestion */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">
                Query Parameter Interface
              </span>
              <button
                onClick={copyWebhookUrl}
                className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                {copiedWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-[10px] bg-white dark:bg-zinc-900 p-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 break-all select-all">
              {sampleUrlParam}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
