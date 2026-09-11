import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Clipboard, 
  HelpCircle, 
  Loader2, 
  Check, 
  ExternalLink,
  Globe,
  FileText,
  Github,
  Film,
  Zap
} from 'lucide-react';
import { parseQuickSendInput } from '../lib/quickSendParser';
import { ResourceCategory } from '../types/resource';

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

  // Live parse preview as the user types or pastes
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
      setTimeout(() => setJustSaved(false), 2500);
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
      console.warn('Clipboard read permission was denied or unavailable:', err);
    }
  };

  const getCategoryBadge = (category: ResourceCategory) => {
    switch (category) {
      case 'GitHub':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
            <Github className="w-3 h-3" /> GitHub
          </span>
        );
      case 'Reel':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
            <Film className="w-3 h-3" /> Reel
          </span>
        );
      case 'Document':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <FileText className="w-3 h-3" /> Document
          </span>
        );
      case 'Link':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Globe className="w-3 h-3" /> Web Link
          </span>
        );
    }
  };

  return (
    <div className="w-full mb-6">
      <form
        onSubmit={handleSubmit}
        className="relative group bg-slate-900/90 border border-slate-800 focus-within:border-indigo-500/60 rounded-2xl p-2 sm:p-2.5 shadow-md transition-all backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          {/* Left Icon */}
          <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>

          {/* Quick Input Field */}
          <div className="flex-1 min-w-0 relative">
            <input
              ref={inputRef}
              id="quick-send-input"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Send anything to save: paste a URL, drop a link, or send a note..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none pr-2 py-1"
              disabled={isSaving}
            />
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Category Detection Badge */}
            {livePreview && (
              <div className="hidden sm:flex items-center">
                {getCategoryBadge(livePreview.formData.category)}
              </div>
            )}

            {/* Paste from Clipboard Button */}
            {!inputVal && (
              <button
                type="button"
                id="btn-quick-paste"
                onClick={handlePasteFromClipboard}
                title="Paste from clipboard"
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              >
                <Clipboard className="w-3 h-3" />
                <span>Paste</span>
              </button>
            )}

            {/* Ways to send help button */}
            <button
              type="button"
              id="btn-quick-send-help"
              onClick={onOpenHelp}
              title="Learn all ways to send anything to your vault"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Send / Save Button */}
            <button
              type="submit"
              id="btn-quick-send-submit"
              disabled={!inputVal.trim() || isSaving}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
                justSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Saved!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send & Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Preview Sub-row when input is populated */}
        {livePreview && (
          <div className="mt-2 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="text-slate-400">Saving as:</span>
              <span className="font-semibold text-white truncate max-w-[220px] sm:max-w-xs">
                {livePreview.formData.title}
              </span>
              {livePreview.formData.tags.length > 0 && (
                <div className="hidden md:flex items-center gap-1">
                  {livePreview.formData.tags.map((t) => (
                    <span key={t} className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-slate-400">Press Enter to save</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
