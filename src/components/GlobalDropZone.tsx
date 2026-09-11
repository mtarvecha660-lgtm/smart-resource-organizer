import React, { useEffect, useState } from 'react';
import { DownloadCloud, Globe, FileText, Github, Film, Sparkles } from 'lucide-react';

interface GlobalDropZoneProps {
  onDropSave: (content: string) => void;
}

export const GlobalDropZone: React.FC<GlobalDropZoneProps> = ({ onDropSave }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter((prev) => prev + 1);
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsDragging(false);
          return 0;
        }
        return next;
      });
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setDragCounter(0);

      if (!e.dataTransfer) return;

      // 1. Try URI-list (dragged link from browser address bar or link in webpage)
      const uri = e.dataTransfer.getData('text/uri-list');
      if (uri && uri.trim()) {
        onDropSave(uri.trim());
        return;
      }

      // 2. Try text/plain (selected text, URL, or paragraph)
      const text = e.dataTransfer.getData('text/plain');
      if (text && text.trim()) {
        onDropSave(text.trim());
        return;
      }

      // 3. Try dropped files (names or URLs)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        onDropSave(`${file.name} - document dropped into vault`);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onDropSave]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md pointer-events-none transition-all">
      <div className="w-full max-w-xl p-8 rounded-3xl border-2 border-dashed border-indigo-500 bg-slate-900/90 shadow-2xl flex flex-col items-center text-center animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-600/20">
          <DownloadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight mb-2">
          Drop Anything to Save to Vault
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
          Release to automatically extract URLs, auto-categorize, generate tags, and store securely in your Firestore organizer.
        </p>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Globe className="w-3.5 h-3.5" /> Links
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <FileText className="w-3.5 h-3.5" /> Docs
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30">
            <Github className="w-3.5 h-3.5" /> GitHub
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/15 text-pink-300 border border-pink-500/30">
            <Film className="w-3.5 h-3.5" /> Reels
          </span>
        </div>
      </div>
    </div>
  );
};
