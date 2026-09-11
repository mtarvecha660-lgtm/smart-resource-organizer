// File: src/components/OfflineIndicator.tsx
import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus, useSyncStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const isSyncing = useSyncStatus();

  if (isOnline && !isSyncing) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 font-mono text-[11px] border border-zinc-700 dark:border-zinc-300 shadow-md"
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
          <span>Offline &bull; Serving from Local Cache</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400 dark:text-zinc-600" />
          <span>Syncing to Firestore...</span>
        </>
      ) : null}
    </div>
  );
};
