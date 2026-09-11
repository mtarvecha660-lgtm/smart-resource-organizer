// File: src/App.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Search,
  Plus,
  Menu,
  Grid3X3,
  Columns,
  Globe,
  FileText,
  Github,
  Film,
  X,
  AlertCircle,
  CheckCircle2,
  BarChart2,
  Sun,
  Moon,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { auth, signOut } from './lib/firebase';
import {
  ResourceItem,
  ResourceCategory,
  ResourceFormData,
  CategoryFilter,
} from './types/resource';
import {
  subscribeToUserResources,
  createResource,
  updateResource,
  deleteResource,
  seedInitialResourcesIfEmpty,
  getUserResourcesPaginated,
} from './services/resourceService';
import { useDebounce } from './hooks/useDebounce';
import { parseQuickSendInput } from './lib/quickSendParser';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { ResourceCard } from './components/ResourceCard';
import { ResourceModal } from './components/ResourceModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EmptyState } from './components/EmptyState';
import { StatsPanel } from './components/StatsPanel';
import { QuickSendBar } from './components/QuickSendBar';
import { GlobalDropZone } from './components/GlobalDropZone';
import { SendToVaultModal } from './components/SendToVaultModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { IncomingShareBanner } from './components/IncomingShareBanner';
import { IncomingShareModal } from './components/IncomingShareModal';
import {
  extractIncomingShareFromUrl,
  cleanShareUrlParams,
  storePendingShare,
  popPendingShare,
} from './lib/shareReceiver';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export default function App() {
  return (
    <ErrorBoundary>
      <SmartResourceDashboard />
    </ErrorBoundary>
  );
}

function SmartResourceDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Resources state
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Pagination state
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters & Search
  const [currentFilter, setCurrentFilter] = useState<CategoryFilter>('All');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim().toLowerCase(), 200);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // View Mode: 4-Column Section Board or Responsive Card Grid
  const [viewMode, setViewMode] = useState<'board' | 'grid'>('board');
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  // Theme Mode
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('sro_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      ) {
        return 'light';
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
    }
    try {
      localStorage.setItem('sro_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Modals & UI State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [isSendHelpModalOpen, setIsSendHelpModalOpen] = useState(false);
  const [incomingSharedItem, setIncomingSharedItem] = useState<ResourceItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [pendingShareModalData, setPendingShareModalData] = useState<{
    url: string;
    title: string;
    description: string;
    category: ResourceCategory;
    tags: string[];
  } | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3000);
  }, []);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        try {
          await seedInitialResourcesIfEmpty(currentUser.uid);
        } catch (e) {
          console.warn('Initial seeding note:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to bounded real-time window of resources
  useEffect(() => {
    if (!user) {
      setResources([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setFirestoreError(null);

    const unsubscribe = subscribeToUserResources(
      user.uid,
      (items) => {
        setResources(items);
        setDataLoading(false);
      },
      (err) => {
        setFirestoreError('Firestore sync warning: serving from local cache.');
        setDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Load more resources using cursor pagination
  const handleLoadMore = async () => {
    if (!user || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const result = await getUserResourcesPaginated(user.uid, 20, lastVisibleDoc, currentFilter);
      setResources((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const newItems = result.items.filter((i) => !existingIds.has(i.id));
        return [...prev, ...newItems];
      });
      setLastVisibleDoc(result.lastVisible);
      setHasMorePages(result.hasMore);
    } catch (err) {
      console.error('Load more pagination error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      All: resources.length,
      Link: 0,
      Document: 0,
      GitHub: 0,
      Reel: 0,
    };
    resources.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category] += 1;
      }
    });
    return counts;
  }, [resources]);

  // Available unique tags
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    resources.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [resources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (currentFilter !== 'All' && item.category !== currentFilter) {
        return false;
      }

      if (selectedTag && !item.tags.includes(selectedTag)) {
        return false;
      }

      if (debouncedSearch) {
        const titleMatch = item.title.toLowerCase().includes(debouncedSearch);
        const descMatch = item.description.toLowerCase().includes(debouncedSearch);
        const urlMatch = item.url.toLowerCase().includes(debouncedSearch);
        const tagMatch = item.tags.some((t) => t.toLowerCase().includes(debouncedSearch));
        return titleMatch || descMatch || urlMatch || tagMatch;
      }

      return true;
    });
  }, [resources, currentFilter, selectedTag, debouncedSearch]);

  // 4-Column Board view grouping
  const categorizedSections = useMemo(() => {
    const categories: ResourceCategory[] = ['Link', 'Document', 'GitHub', 'Reel'];
    return categories.map((cat) => {
      const items = filteredResources.filter((item) => item.category === cat);
      return {
        category: cat,
        items,
      };
    });
  }, [filteredResources]);

  // Create Resource (Optimistic)
  const handleCreateResource = async (formData: ResourceFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticItem: ResourceItem = {
      id: tempId,
      uid: user.uid,
      userId: user.uid,
      title: formData.title,
      url: formData.url,
      category: formData.category,
      description: formData.description,
      tags: formData.tags,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    };

    setResources((prev) => [optimisticItem, ...prev]);
    setIsAddModalOpen(false);

    try {
      await createResource(user.uid, formData, tempId);
      showToast('Saved to vault', 'success');
    } catch (err: unknown) {
      console.error('Create error:', err);
      setResources((prev) => prev.filter((item) => item.id !== tempId));
      const msg = err instanceof Error ? err.message : 'Save failure';
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Send
  const handleQuickSend = useCallback(
    async (rawText: string, isFromShare = false): Promise<boolean> => {
      if (!user) {
        showToast('Please sign in to save items', 'error');
        return false;
      }
      const trimmed = rawText.trim();
      if (!trimmed) return false;

      setIsQuickSaving(true);
      const parsed = parseQuickSendInput(trimmed);
      const tempId = `temp-quick-${Date.now()}`;
      const optimisticItem: ResourceItem = {
        id: tempId,
        uid: user.uid,
        userId: user.uid,
        title: parsed.formData.title,
        url: parsed.formData.url,
        category: parsed.formData.category,
        description: parsed.formData.description,
        tags: parsed.formData.tags,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      };

      setResources((prev) => [optimisticItem, ...prev]);

      if (isFromShare) {
        setIncomingSharedItem(optimisticItem);
      }

      try {
        await createResource(user.uid, parsed.formData, tempId);
        showToast(
          isFromShare
            ? `Shared item saved as ${parsed.formData.category}`
            : `Captured "${parsed.formData.title.slice(0, 30)}"`,
          'success'
        );
        return true;
      } catch (err: unknown) {
        console.error('Quick save error:', err);
        setResources((prev) => prev.filter((item) => item.id !== tempId));
        if (isFromShare) {
          setIncomingSharedItem(null);
        }
        const msg = err instanceof Error ? err.message : 'Save failure';
        showToast(`Error: ${msg}`, 'error');
        return false;
      } finally {
        setIsQuickSaving(false);
      }
    },
    [user, showToast]
  );

  // Global Ctrl+V / Cmd+V paste listener
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && pastedText.trim() && user) {
        handleQuickSend(pastedText.trim());
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [user, handleQuickSend]);

  // Incoming Share Save Handler
  const handleSaveIncomingShare = useCallback(
    async (formData: ResourceFormData): Promise<boolean> => {
      if (!user) {
        showToast('Please sign in to save items', 'error');
        return false;
      }

      setIsSubmitting(true);
      const tempId = `temp-share-${Date.now()}`;
      const optimisticItem: ResourceItem = {
        id: tempId,
        uid: user.uid,
        userId: user.uid,
        title: formData.title,
        url: formData.url,
        category: formData.category,
        description: formData.description,
        tags: formData.tags,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      };

      setResources((prev) => [optimisticItem, ...prev]);

      try {
        await createResource(user.uid, formData, tempId);
        showToast(`Saved "${formData.title.slice(0, 24)}"`, 'success');
        return true;
      } catch (err: unknown) {
        console.error('Share save error:', err);
        setResources((prev) => prev.filter((item) => item.id !== tempId));
        const msg = err instanceof Error ? err.message : 'Failed to save';
        showToast(`Error: ${msg}`, 'error');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, showToast]
  );

  // Handle incoming mobile share targets
  useEffect(() => {
    if (authLoading) return;

    const incoming = extractIncomingShareFromUrl();
    if (incoming && incoming.rawString) {
      cleanShareUrlParams();
      const parsed = parseQuickSendInput(incoming.rawString);
      const url = incoming.url || parsed.formData.url;
      const title =
        incoming.title && incoming.title !== incoming.url
          ? incoming.title
          : parsed.formData.title;
      let description = parsed.formData.description;
      if (incoming.text && incoming.text !== incoming.url && incoming.text !== incoming.title) {
        description = incoming.text.replace(url, '').trim() || incoming.text;
      }

      const shareData = {
        url,
        title,
        description,
        category: parsed.formData.category,
        tags: parsed.formData.tags,
      };

      if (user) {
        setPendingShareModalData(shareData);
        setIsShareModalOpen(true);
      } else {
        storePendingShare(incoming);
      }
    } else if (user) {
      const pending = popPendingShare();
      if (pending && pending.rawString) {
        const parsed = parseQuickSendInput(pending.rawString);
        const url = pending.url || parsed.formData.url;
        const title =
          pending.title && pending.title !== pending.url
            ? pending.title
            : parsed.formData.title;
        let description = parsed.formData.description;
        if (pending.text && pending.text !== pending.url && pending.text !== pending.title) {
          description = pending.text.replace(url, '').trim() || pending.text;
        }

        setPendingShareModalData({
          url,
          title,
          description,
          category: parsed.formData.category,
          tags: parsed.formData.tags,
        });
        setIsShareModalOpen(true);
      }
    }
  }, [user, authLoading]);

  // Update Resource
  const handleUpdateResource = async (formData: ResourceFormData) => {
    if (!user || !editingItem) return;
    setIsSubmitting(true);

    const targetId = editingItem.id;
    const previousItem = editingItem;

    setResources((prev) =>
      prev.map((item) =>
        item.id === targetId
          ? {
              ...item,
              ...formData,
            }
          : item
      )
    );
    setEditingItem(null);
    setIsAddModalOpen(false);

    try {
      await updateResource(targetId, formData);
      showToast('Resource updated', 'success');
    } catch (err: unknown) {
      console.error('Update error:', err);
      setResources((prev) =>
        prev.map((item) => (item.id === targetId ? previousItem : item))
      );
      const msg = err instanceof Error ? err.message : 'Update failed';
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Resource
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const { id, title } = deleteTarget;
    const itemToDelete = resources.find((r) => r.id === id);
    const itemIndex = resources.findIndex((r) => r.id === id);

    setResources((prev) => prev.filter((item) => item.id !== id));
    setDeleteTarget(null);

    try {
      await deleteResource(id);
      showToast(`Deleted "${title.slice(0, 24)}"`, 'success');
    } catch (err: unknown) {
      console.error('Delete error:', err);
      if (itemToDelete && itemIndex !== -1) {
        setResources((prev) => {
          const restored = [...prev];
          restored.splice(itemIndex, 0, itemToDelete);
          return restored;
        });
      }
      const msg = err instanceof Error ? err.message : 'Delete failed';
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out', 'success');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 font-mono text-xs">
        <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mb-3" />
        <span>Authenticating session...</span>
      </div>
    );
  }

  // If unauthenticated, present clean Landing Page
  if (!user) {
    return (
      <LandingPage
        onSignInSuccess={() => {}}
        theme={theme}
        onToggleTheme={(t) => setTheme(t)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar */}
      <Sidebar
        currentFilter={currentFilter}
        onSelectFilter={(f) => {
          setCurrentFilter(f);
          setSelectedTag(null);
        }}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        categoryCounts={categoryCounts}
        user={user}
        onSignOut={handleSignOut}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        selectedTag={selectedTag}
        onClearTag={() => setSelectedTag(null)}
        availableTags={availableTags}
        onSelectTag={(tag) => setSelectedTag(tag)}
        showStatsPanel={showStatsPanel}
        onToggleStats={() => setShowStatsPanel(!showStatsPanel)}
        theme={theme}
        onToggleTheme={(t) => setTheme(t)}
        onOpenSendHelp={() => setIsSendHelpModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-zinc-950/95 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Vault</span>
              <span className="text-zinc-400">/</span>
              <span className="text-zinc-500">{currentFilter}</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="global-search-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search title, url, or #tag..."
                className="w-full pl-8 pr-7 py-1 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode */}
            <div className="hidden md:flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded border border-zinc-200 dark:border-zinc-800">
              <button
                id="btn-view-board"
                onClick={() => setViewMode('board')}
                title="Board View"
                className={`p-1 rounded text-xs cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1 rounded text-xs cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metrics Toggle */}
            <button
              id="header-toggle-stats-btn"
              onClick={() => setShowStatsPanel(!showStatsPanel)}
              title={showStatsPanel ? 'Hide Metrics' : 'Show Metrics'}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border transition-colors cursor-pointer ${
                showStatsPanel
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Metrics</span>
            </button>

            {/* Send to Vault guide */}
            <button
              id="header-send-to-vault-btn"
              onClick={() => setIsSendHelpModalOpen(true)}
              title="Quick send instructions"
              className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer font-mono text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Capture Guide</span>
            </button>

            <PWAInstallButton variant="header" />

            {/* Add Resource button */}
            <button
              id="header-add-btn"
              onClick={() => {
                setEditingItem(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </header>

        {/* Error notification banner */}
        {firestoreError && (
          <div className="mx-4 sm:mx-6 mt-3 p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{firestoreError}</span>
            </div>
            <button
              onClick={() => setFirestoreError(null)}
              className="text-zinc-900 dark:text-zinc-100 hover:underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Indicators */}
        {(debouncedSearch || selectedTag) && (
          <div className="px-4 sm:px-6 pt-3 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            <span className="text-zinc-400">Filters:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                <span>"{debouncedSearch}"</span>
                <button onClick={() => setSearchInput('')} className="cursor-pointer">
                  &times;
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                <span>#{selectedTag}</span>
                <button onClick={() => setSelectedTag(null)} className="cursor-pointer">
                  &times;
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchInput('');
                setSelectedTag(null);
              }}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline ml-1 cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6">
          {incomingSharedItem && (
            <IncomingShareBanner
              item={incomingSharedItem}
              onEdit={(item) => {
                setEditingItem(item);
                setIsAddModalOpen(true);
                setIncomingSharedItem(null);
              }}
              onDismiss={() => setIncomingSharedItem(null)}
            />
          )}

          {/* Quick Send Bar */}
          <QuickSendBar
            onQuickSave={handleQuickSend}
            onOpenHelp={() => setIsSendHelpModalOpen(true)}
            isSaving={isQuickSaving}
          />

          {/* Stats Panel */}
          {!dataLoading && showStatsPanel && (
            <StatsPanel
              resources={resources}
              onClose={() => setShowStatsPanel(false)}
            />
          )}

          {dataLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-400 font-mono text-xs">
              <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mb-2" />
              <span>Loading cache...</span>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="max-w-md mx-auto py-10">
              <EmptyState
                category={
                  debouncedSearch || selectedTag
                    ? 'Search'
                    : currentFilter !== 'All'
                    ? currentFilter
                    : 'All'
                }
                searchQuery={debouncedSearch || (selectedTag ? `#${selectedTag}` : '')}
                onClearSearch={() => {
                  setSearchInput('');
                  setSelectedTag(null);
                  setCurrentFilter('All');
                }}
                onAddClick={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
              />
            </div>
          ) : currentFilter === 'All' && viewMode === 'board' ? (
            /* 4-Column Board */
            <div
              id="sections-board-grid"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start"
            >
              {categorizedSections.map(({ category, items }) => {
                const getSectionHeader = (cat: ResourceCategory) => {
                  switch (cat) {
                    case 'Link':
                      return { title: 'Web Links', icon: <Globe className="w-3.5 h-3.5" /> };
                    case 'Document':
                      return { title: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> };
                    case 'GitHub':
                      return { title: 'GitHub Repos', icon: <Github className="w-3.5 h-3.5" /> };
                    case 'Reel':
                      return { title: 'Reels & Media', icon: <Film className="w-3.5 h-3.5" /> };
                  }
                };

                const header = getSectionHeader(category);

                return (
                  <section
                    key={category}
                    id={`section-column-${category.toLowerCase()}`}
                    className="flex flex-col gap-2.5 min-w-0 bg-zinc-50 dark:bg-zinc-950/40 rounded-lg p-2.5 border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between px-1 py-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-zinc-500">{header.icon}</span>
                        <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {header.title}
                        </h2>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                        {items.length}
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div className="py-2">
                        <EmptyState
                          category={category}
                          onAddClick={() => {
                            setEditingItem(null);
                            setIsAddModalOpen(true);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <ResourceCard
                            key={item.id}
                            item={item}
                            onEdit={(it) => {
                              setEditingItem(it);
                              setIsAddModalOpen(true);
                            }}
                            onDelete={(id, title) => setDeleteTarget({ id, title })}
                            onTagClick={(tag) => setSelectedTag(tag === selectedTag ? null : tag)}
                            activeTag={selectedTag}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            /* Responsive Grid View */
            <div>
              <div className="flex items-center justify-between mb-3 font-mono text-xs text-zinc-500">
                <span>
                  Showing {filteredResources.length} {currentFilter} items
                </span>
              </div>

              <div
                id="unified-resource-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
              >
                {filteredResources.map((item) => (
                  <ResourceCard
                    key={item.id}
                    item={item}
                    onEdit={(it) => {
                      setEditingItem(it);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={(id, title) => setDeleteTarget({ id, title })}
                    onTagClick={(tag) => setSelectedTag(tag === selectedTag ? null : tag)}
                    activeTag={selectedTag}
                  />
                ))}
              </div>

              {/* Cursor-based pagination trigger */}
              {hasMorePages && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 font-mono text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-bounce' : ''}`} />
                    <span>{isLoadingMore ? 'Fetching...' : 'Load Next Page'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <ResourceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleUpdateResource : handleCreateResource}
        initialData={editingItem}
        loading={isSubmitting}
      />

      <IncomingShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setPendingShareModalData(null);
        }}
        onSave={handleSaveIncomingShare}
        initialData={pendingShareModalData}
        loading={isSubmitting}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.title || ''}
        loading={isDeleting}
      />

      <GlobalDropZone onDropSave={handleQuickSend} />

      <SendToVaultModal
        isOpen={isSendHelpModalOpen}
        onClose={() => setIsSendHelpModalOpen(false)}
        appOrigin={window.location.origin}
      />

      <OfflineIndicator />

      {/* Toast */}
      {toast && (
        <div
          id="toast-notification"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono text-[11px] border border-zinc-700 dark:border-zinc-300 shadow-lg animate-in fade-in"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 dark:text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
