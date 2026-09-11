// File: src/components/PWAInstallButton.tsx
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallModal } from './InstallModal';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'header' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'sidebar',
  className = '',
}) => {
  const { isInstallable, isStandalone, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isStandalone) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  if (variant === 'header') {
    return (
      <>
        <button
          id="header-pwa-install-btn"
          onClick={handleClick}
          title="Install as PWA"
          className={`inline-flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-xs transition-colors cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install</span>
        </button>
        <InstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <div
          className={`p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 ${className}`}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              Install App
            </p>
            <p className="font-mono text-[10px] text-zinc-500 truncate">
              Offline-ready PWA bundle
            </p>
          </div>
          <button
            onClick={handleClick}
            className="shrink-0 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-mono transition-colors cursor-pointer"
          >
            Install
          </button>
        </div>
        <InstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  // Default: sidebar
  return (
    <>
      <button
        id="sidebar-pwa-install-btn"
        onClick={handleClick}
        title="Add to Home Screen"
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-2">
          <Download className="w-3.5 h-3.5 text-zinc-500" />
          <span>Install PWA</span>
        </div>
        <span className="text-[10px] uppercase text-zinc-400">PWA</span>
      </button>
      <InstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
