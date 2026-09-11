import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Clipboard, 
  DownloadCloud, 
  Bookmark, 
  Link as LinkIcon, 
  Check, 
  Copy, 
  ExternalLink,
  Share2,
  Smartphone
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="send-to-vault-modal"
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Send Anything to Your Vault
              </h2>
              <p className="text-xs text-slate-400">
                Multiple ways to instantly capture resources, notes, and links
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Method 0: Mobile Share Target (NEW) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/60 border border-indigo-500/40 space-y-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                <Share2 className="w-4 h-4" />
              </span>
              <span className="font-bold text-white text-sm">
                📱 Native Mobile Share Sheet (One-Tap Share)
              </span>
              <span className="ml-auto text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-semibold border border-indigo-400/30">
                PWA Feature
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-8">
              When browsing any website, YouTube video, document, or tweet on your phone, tap <strong className="text-white">Share</strong> in your browser or app, then choose <strong className="text-indigo-300">"Smart Resource Organizer"</strong>.
            </p>
            <p className="text-indigo-300/90 leading-relaxed pl-8 text-[11px] font-medium">
              ✨ An edit window immediately pops up pre-filled with the identified link, letting you enter your custom title, personal notes/description, tags, or switch categories before saving to your vault!
            </p>
          </div>

          {/* Method 1: The Quick Send Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/15 text-indigo-400 shrink-0 mt-0.5">
              <Send className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-sm">1. Quick Send Bar</h3>
              <p className="text-slate-400 leading-relaxed">
                Paste any URL, GitHub repository, doc link, or type a note into the bar at the top and hit <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">Enter</kbd>. It automatically categorizes and saves it immediately into Firestore.
              </p>
            </div>
          </div>

          {/* Method 2: Global Paste Anywhere */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
              <Clipboard className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-sm">2. Paste Anywhere (Ctrl+V / Cmd+V)</h3>
              <p className="text-slate-400 leading-relaxed">
                Copy any URL or text to your clipboard, click anywhere on this dashboard, and press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">Ctrl+V</kbd>. The app detects the link and saves it straight to your collection.
              </p>
            </div>
          </div>

          {/* Method 3: Drag and Drop Anywhere */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-white text-sm">3. Drag & Drop</h3>
              <p className="text-slate-400 leading-relaxed">
                Drag any link from your browser address bar or another window directly onto this dashboard window to trigger the instant save dropzone.
              </p>
            </div>
          </div>

          {/* Method 4: Browser Bookmarklet */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-500/15 text-violet-400 shrink-0 mt-0.5">
                <Bookmark className="w-4 h-4" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-white text-sm">4. Browser 1-Click Bookmarklet</h3>
                <p className="text-slate-400 leading-relaxed">
                  Drag the button below to your browser's Bookmarks Bar. When you're on ANY website, click it to instantly send that page into your Smart Resource Organizer!
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  e.preventDefault();
                  alert('Drag this button to your bookmarks bar, or click "Copy Code" below!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-sm cursor-grab active:cursor-grabbing transition-colors"
                title="Drag to your browser bookmarks bar"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Drag me to Bookmarks: 🔖 Save to SRO</span>
              </a>

              <button
                type="button"
                onClick={copyBookmarklet}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedBookmarklet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBookmarklet ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Method 5: URL Parameter Integration */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">5. Direct Link / Webhook Parameter</span>
              <button
                onClick={copyWebhookUrl}
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                {copiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWebhook ? 'Copied' : 'Copy Sample'}</span>
              </button>
            </div>
            <p className="text-slate-400 font-mono text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800 break-all select-all">
              {sampleUrlParam}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
};
