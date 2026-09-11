// File: src/components/InstallModal.tsx
import React from 'react';
import {
  X,
  Download,
  Smartphone,
  Share2,
  CheckCircle2,
  Laptop,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install, isStandalone } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div
        id="pwa-install-guide-modal"
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden my-6 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider">
              Application Installation
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">
              Install as a standalone progressive web application
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Direct Install Button if supported */}
          {isInstallable && !isStandalone && (
            <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans">
                Native browser prompt supported.
              </p>
              <button
                id="btn-confirm-pwa-install"
                onClick={async () => {
                  const success = await install();
                  if (success) onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Trigger Installation</span>
              </button>
            </div>
          )}

          {/* Already installed banner */}
          {isStandalone && (
            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-500 shrink-0" />
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Application currently running in standalone display mode.
              </p>
            </div>
          )}

          {/* iOS Safari Instructions */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-zinc-700 dark:text-zinc-300">
              <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
              <span>iOS Safari Protocol</span>
            </div>
            <p className="font-sans text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Tap the Safari Share icon, scroll down, and select <strong>"Add to Home Screen"</strong>.
            </p>
          </div>

          {/* Android Chrome Instructions */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-zinc-700 dark:text-zinc-300">
              <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
              <span>Android Chrome Protocol</span>
            </div>
            <p className="font-sans text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Open Chrome menu (⋮) and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. Direct mobile share sheet targeting will be registered automatically.
            </p>
          </div>

          {/* Desktop Instructions */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-zinc-700 dark:text-zinc-300">
              <Laptop className="w-3.5 h-3.5 text-zinc-500" />
              <span>Desktop Browsers</span>
            </div>
            <p className="font-sans text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Click the install icon in the URL omnibox to pin to your system dock or application menu.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
