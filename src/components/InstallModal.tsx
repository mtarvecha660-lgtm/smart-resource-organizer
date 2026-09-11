import React from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Laptop, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install, isIOS, isStandalone } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="pwa-install-guide-modal"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-all"
      >
        {/* Header with App Icon preview */}
        <div className="p-6 bg-gradient-to-b from-indigo-950/50 to-slate-900 border-b border-slate-800/80 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 overflow-hidden shrink-0 border border-indigo-400/30">
              <img 
                src="/icon.svg" 
                alt="SmartOrg Logo" 
                className="w-9 h-9 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Add to Home Screen
              </h3>
              <p className="text-xs text-slate-400">
                Install Smart Resource Organizer as a standalone mobile & desktop app
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Direct Install Button if supported */}
          {isInstallable && !isStandalone && (
            <div className="p-4 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-center space-y-2.5">
              <p className="text-xs font-medium text-indigo-200">
                Your browser supports one-tap home screen installation!
              </p>
              <button
                id="btn-confirm-pwa-install"
                onClick={async () => {
                  const success = await install();
                  if (success) onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Install Now</span>
              </button>
            </div>
          )}

          {/* Already installed banner */}
          {isStandalone && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">
                App is currently running in standalone home screen mode!
              </p>
            </div>
          )}

          {/* iOS Safari Instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Smartphone className="w-4 h-4 text-pink-400" />
              <span>iPhone & iPad (Safari)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tap the <strong className="text-white inline-flex items-center gap-1 mx-1"><Share2 className="w-3 h-3 text-blue-400 inline" /> Share</strong> button in Safari's bottom toolbar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-white inline-flex items-center gap-1 mx-1"><PlusSquare className="w-3 h-3 text-emerald-400 inline" /> Add to Home Screen</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Tap <strong className="text-white">Add</strong> in the top right corner. The icon will appear directly on your home screen!
                </p>
              </div>
            </div>
          </div>

          {/* Android Chrome Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Android (Chrome / Edge / Firefox)</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                Supports Mobile Share Sheet
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs text-slate-300">
              <p className="leading-relaxed">
                Tap the <strong className="text-white">three dots (⋮)</strong> in the top right of Chrome, then select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
              </p>
              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-[11px] leading-relaxed">
                <strong className="text-white flex items-center gap-1 mb-0.5">
                  <Share2 className="w-3 h-3 text-indigo-400" /> Direct Mobile Sharing:
                </strong>
                Once installed from Chrome, Smart Resource Organizer appears directly in your Android phone's <strong>Share</strong> menu. Tap <em>Share &gt; SmartOrg</em> in Chrome, YouTube, or docs to pop up the window where you can customize title, description, tags, and category before saving into your vault!
              </div>
            </div>
          </div>

          {/* Desktop Instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Laptop className="w-4 h-4 text-indigo-400" />
              <span>Desktop (Chrome, Edge, Brave)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
              <p className="leading-relaxed">
                Click the <strong className="text-white">Install icon (⊕)</strong> on the right side of your browser's address bar to install to your computer dock or taskbar.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
