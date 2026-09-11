// File: src/components/GlobalDropZone.tsx
import React, { useEffect, useState } from 'react';
import { DownloadCloud, Globe, FileText, Github, Film } from 'lucide-react';

interface GlobalDropZoneProps {
  onDropSave: (content: string) => void;
}

export const GlobalDropZone: React.FC<GlobalDropZoneProps> = ({ onDropSave }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter += 1;
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter -= 1;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
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
      dragCounter = 0;

      if (!e.dataTransfer) return;

      const uri = e.dataTransfer.getData('text/uri-list');
      if (uri && uri.trim()) {
        onDropSave(uri.trim());
        return;
      }

      const text = e.dataTransfer.getData('text/plain');
      if (text && text.trim()) {
        onDropSave(text.trim());
        return;
      }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 pointer-events-none">
      <div className="w-full max-w-md p-6 rounded-lg border-2 border-dashed border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col items-center text-center font-mono">
        <DownloadCloud className="w-8 h-8 text-zinc-500 mb-2.5" />

        <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Drop Target Active
        </h3>
        <p className="font-sans text-xs text-zinc-500 max-w-xs mb-4 leading-relaxed">
          Release content to ingest URL, extract metadata, and persist to Firestore.
        </p>

        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <Globe className="w-3 h-3" /> Links
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <FileText className="w-3 h-3" /> Docs
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <Github className="w-3 h-3" /> Repos
          </span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <Film className="w-3 h-3" /> Media
          </span>
        </div>
      </div>
    </div>
  );
};
