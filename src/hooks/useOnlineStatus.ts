// File: src/hooks/useOnlineStatus.ts
import { useEffect, useState } from 'react';
import { onSnapshotsInSync } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SyncStatus {
  isOnline: boolean;
  isSynced: boolean;
  hasPendingWrites: boolean;
  statusLabel: string;
}

/**
 * Hook providing standard online/offline boolean connectivity status.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook surfacing real-time Firestore sync and persistence states.
 */
export function useSyncStatus(): SyncStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSynced, setIsSynced] = useState<boolean>(true);
  const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let unsubscribeSync: (() => void) | null = null;
    try {
      unsubscribeSync = onSnapshotsInSync(db, () => {
        setIsSynced(true);
      });
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (unsubscribeSync) unsubscribeSync();
    };
  }, []);

  let statusLabel = 'Synced';
  if (!isOnline) {
    statusLabel = 'Offline (Cached)';
  } else if (!isSynced || hasPendingWrites) {
    statusLabel = 'Syncing...';
  }

  return {
    isOnline,
    isSynced,
    hasPendingWrites,
    statusLabel,
  };
}
