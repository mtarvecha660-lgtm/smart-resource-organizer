// File: src/components/QuickSendBar.tsx
import React, { useState, useMemo, useRef } from 'react';
import {
  Send,
  Clipboard,
  HelpCircle,
  Loader2,
  Check,
  Zap,
} from 'lucide-react';
import { parseQuickSendInput } from '../lib/quickSendParser';

interface QuickSendBarProps {
  onQuickSave: (text: string) => Promise<boolean>;
  onOpenHelp: () => void;
  isSaving?: boolean;
}

export const QuickSendBar: React.FC<QuickSendBarProps> = ({
  onQuickSave,
  onOpenHelp,
  isSaving = false,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live parse preview as user inputs text
  const livePreview = useMemo(() => {
    if (!inputVal.trim()) return null;
    try {
      return parseQuickSendInput(inputVal);
    } catch {
      return null;
    }
  }, [inputVal]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed || isSaving) return;

    const success = await onQuickSave(trimmed);
    if (success) {
      setInputVal('');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setInputVal(text.trim());
          if (inputRef.current) inputRef.current.focus();
        }
      }
    } catch (err) {
      console.warn('Clipboard read access note:', err);
    }
  };

  return (
    <div className="w-full mb-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 transition-colors focus-within:border-zinc-400 dark:focus-within:border-zinc-600"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>

          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              id="quick-send-input"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Paste URL, drop link, or enter quick note..."
              className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {livePreview && (
              <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {livePreview.formData.category}
              </span>
            )}

            {!inputVal && (
              <button
                type="button"
                id="btn-quick-paste"
                onClick={handlePasteFromClipboard}
                title="Paste from clipboard"
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <Clipboard className="w-3 h-3" />
                <span className="font-mono text-[11px]">Paste</span>
              </button>
            )}

            <button
              type="button"
              id="btn-quick-send-help"
              onClick={onOpenHelp}
              title="Quick send instructions"
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            <button
              type="submit"
              id="btn-quick-send-submit"
              disabled={!inputVal.trim() || isSaving}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                justSaved
                  ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : justSaved ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span className="hidden sm:inline">Capture</span>
                </>
              )}
            </button>
          </div>
        </div>

        {livePreview && (
          <div className="mt-1.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <div className="flex items-center gap-2 truncate pr-2">
              <span>Target:</span>
              <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-xs font-sans font-medium">
                {livePreview.formData.title}
              </span>
            </div>
            <span className="hidden sm:inline text-zinc-400">Press Enter</span>
          </div>
        )}
      </form>
    </div>
  );
};
