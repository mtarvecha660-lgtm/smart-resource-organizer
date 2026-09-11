// File: src/components/DeleteConfirmModal.tsx
import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  loading: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />
      <div
        id="delete-confirm-modal"
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-4 z-10 text-zinc-900 dark:text-zinc-100"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-xs uppercase tracking-wider">Confirm Delete</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="py-3 space-y-2">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Permanently remove this document from your Firestore collection?
          </p>
          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate">
            {title}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 rounded text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-confirm-delete"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-zinc-200 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
