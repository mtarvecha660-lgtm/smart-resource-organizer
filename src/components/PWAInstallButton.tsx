import React, { useState } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
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
  const { isInstallable, isInstalled, isStandalone, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running standalone on the device, hide or display installed badge
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
          title="Add to Home Screen / Install Web App"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 hover:text-indigo-100 text-xs font-medium transition-all shadow-sm cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Install App</span>
        </button>
        <InstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <div className={`p-3 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/30 flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">Add to Home Screen</p>
              <p className="text-[11px] text-slate-400 truncate">Access directly from your mobile screen</p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
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
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-500/30 transition-all cursor-pointer group shadow-sm ${className}`}
      >
        <div className="flex items-center gap-2">
          <Download className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Add to Home Screen</span>
        </div>
        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
          PWA
        </span>
      </button>
      <InstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
