import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Search, 
  Plus, 
  Menu, 
  Compass, 
  Grid3X3, 
  Columns, 
  Globe, 
  FileText, 
  Github, 
  Film, 
  X, 
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  FolderOpen,
  BarChart2,
  Sun,
  Moon,
  Send,
  Zap
} from 'lucide-react';
import { auth, signOut } from './lib/firebase';
import { 
  ResourceItem, 
  ResourceCategory, 
  ResourceFormData, 
  CategoryFilter 
} from './types/resource';
import { 
  subscribeToUserResources, 
  createResource, 
  updateResource, 
  deleteResource,
  seedInitialResourcesIfEmpty
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

export default function App() {
  return (
    <ErrorBoundary>
      <SmartResourceDashboard />
    </ErrorBoundary>
  );
}

function SmartResourceDashboard() {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Resources State (with optimistic updates)
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Filters & Search
  const [currentFilter, setCurrentFilter] = useState<CategoryFilter>('All');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput.trim().toLowerCase(), 250);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // View Mode: 4-Column Section Board or Unified Responsive Card Grid
  const [viewMode, setViewMode] = useState<'board' | 'grid'>('board');
  const [showStatsPanel, setShowStatsPanel] = useState(true);

  // Theme Mode: 'dark' | 'light' with persistence and root/body conditional CSS classes
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('sro_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
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

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickSaving, setIsQuickSaving] = useState(false);
  const [isSendHelpModalOpen, setIsSendHelpModalOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Seed helpful starter items if database is freshly initialized
        try {
          await seedInitialResourcesIfEmpty(currentUser.uid);
        } catch (e) {
          console.warn('Initial seeding note:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore Resources for current user
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
        setFirestoreError('Failed to synchronize with Firestore. Changes may be stored locally.');
        setDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Derived category counts
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

  // Filtered resources based on debounced search, category filter, and tag filter
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      // Category filter check
      if (currentFilter !== 'All' && item.category !== currentFilter) {
        return false;
      }

      // Tag filter check
      if (selectedTag && !item.tags.includes(selectedTag)) {
        return false;
      }

      // Debounced search query check (title, description, tags, url)
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

  // Categorized sets for 4-column section board view
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

  // 1. Optimistic Add Resource
  const handleCreateResource = async (formData: ResourceFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticItem: ResourceItem = {
      id: tempId,
      uid: user.uid,
      title: formData.title,
      url: formData.url,
      category: formData.category,
      description: formData.description,
      tags: formData.tags,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    };

    // Optimistic state update
    setResources((prev) => [optimisticItem, ...prev]);
    setIsAddModalOpen(false);

    try {
      await createResource(user.uid, formData, tempId);
      showToast('Resource added successfully!', 'success');
    } catch (err: unknown) {
      console.error('Create error:', err);
      // Revert optimistic update on failure
      setResources((prev) => prev.filter((item) => item.id !== tempId));
      const msg = err instanceof Error ? err.message : 'Failed to save to Firestore';
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Send & Save Anything (URL, text note, dropped link, or clipboard)
  const handleQuickSend = useCallback(async (rawText: string): Promise<boolean> => {
    if (!user) {
      showToast('Please sign in to save resources', 'error');
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
      title: parsed.formData.title,
      url: parsed.formData.url,
      category: parsed.formData.category,
      description: parsed.formData.description,
      tags: parsed.formData.tags,
      createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    };

    // Optimistic UI state update
    setResources((prev) => [optimisticItem, ...prev]);

    try {
      await createResource(user.uid, parsed.formData, tempId);
      showToast(`⚡ Saved "${parsed.formData.title}" to ${parsed.formData.category}!`, 'success');
      return true;
    } catch (err: unknown) {
      console.error('Quick save error:', err);
      // Revert optimistic update on failure
      setResources((prev) => prev.filter((item) => item.id !== tempId));
      const msg = err instanceof Error ? err.message : 'Failed to save to Firestore';
      showToast(`Error saving: ${msg}`, 'error');
      return false;
    } finally {
      setIsQuickSaving(false);
    }
  }, [user, showToast]);

  // Global Ctrl+V / Cmd+V paste-to-save listener
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Do not intercept if user is typing inside an input, textarea, or contentEditable element
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

  // Detect incoming ?saveUrl=... or ?send=... from bookmarklet or external share
  useEffect(() => {
    if (!user) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const saveUrl = params.get('saveUrl') || params.get('send') || params.get('url');
      const saveTitle = params.get('title');
      if (saveUrl) {
        const fullText = saveTitle ? `${saveTitle}: ${saveUrl}` : saveUrl;
        handleQuickSend(fullText);
        // Clean query parameters from URL without reloading the page
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }
  }, [user, handleQuickSend]);

  // 2. Optimistic Update Resource
  const handleUpdateResource = async (formData: ResourceFormData) => {
    if (!user || !editingItem) return;
    setIsSubmitting(true);

    const targetId = editingItem.id;
    const previousItem = editingItem;

    // Optimistic UI state update
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
      showToast('Resource updated successfully!', 'success');
    } catch (err: unknown) {
      console.error('Update error:', err);
      // Revert on failure
      setResources((prev) =>
        prev.map((item) => (item.id === targetId ? previousItem : item))
      );
      const msg = err instanceof Error ? err.message : 'Failed to update resource';
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Optimistic Delete Resource
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const { id, title } = deleteTarget;
    const itemToDelete = resources.find((r) => r.id === id);
    const itemIndex = resources.findIndex((r) => r.id === id);

    // Optimistic removal from UI state
    setResources((prev) => prev.filter((item) => item.id !== id));
    setDeleteTarget(null);

    try {
      await deleteResource(id);
      showToast(`"${title.slice(0, 24)}" deleted`, 'success');
    } catch (err: unknown) {
      console.error('Delete error:', err);
      // Revert deletion on failure
      if (itemToDelete && itemIndex !== -1) {
        setResources((prev) => {
          const restored = [...prev];
          restored.splice(itemIndex, 0, itemToDelete);
          return restored;
        });
      }
      const msg = err instanceof Error ? err.message : 'Failed to delete resource';
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out safely', 'success');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Initial Authentication check state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">Loading Smart Resource Vault...</p>
      </div>
    );
  }

  // Strictly restrict dashboard view to logged-in users; redirect to landing page
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
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

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top App Header */}
        <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Mobile menu toggle & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Dashboard</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400 font-normal">
                {currentFilter === 'All' ? 'All Resources' : currentFilter}
              </span>
            </div>
          </div>

          {/* Search Bar & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md justify-end sm:justify-start">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="global-search-input"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, description, or #tag..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center bg-slate-950/60 p-0.5 rounded-xl border border-slate-800">
              <button
                id="btn-view-board"
                onClick={() => setViewMode('board')}
                title="4-Column Section Board"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                title="Unified Card Grid"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            {/* Trends Analytics Toggle Button */}
            <button
              id="header-toggle-stats-btn"
              onClick={() => setShowStatsPanel(!showStatsPanel)}
              title={showStatsPanel ? 'Hide 30-Day Trends' : 'Show 30-Day Trends'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                showStatsPanel
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trends</span>
            </button>

            {/* Quick Theme Toggle in Header */}
            <button
              id="header-theme-toggle-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* Quick Send to Vault Button */}
            <button
              id="header-send-to-vault-btn"
              onClick={() => setIsSendHelpModalOpen(true)}
              title="Ways to send anything to your vault (Drag & drop, paste, bookmarklet)"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-colors cursor-pointer text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Send to Vault</span>
            </button>

            {/* Install PWA / Add to Home Screen Button */}
            <PWAInstallButton variant="header" />

            {/* Quick Add Button */}
            <button
              id="header-add-btn"
              onClick={() => {
                setEditingItem(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </header>

        {/* Firestore error banner if applicable */}
        {firestoreError && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{firestoreError}</span>
            </div>
            <button
              onClick={() => setFirestoreError(null)}
              className="text-amber-400 hover:text-white text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Filters Bar (if search or tag is active) */}
        {(debouncedSearch || selectedTag) && (
          <div className="px-4 sm:px-6 pt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Active filters:</span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                <span>Query: "{debouncedSearch}"</span>
                <button onClick={() => setSearchInput('')} className="hover:text-white cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                <span>#{selectedTag}</span>
                <button onClick={() => setSelectedTag(null)} className="hover:text-white cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchInput('');
                setSelectedTag(null);
              }}
              className="text-slate-400 hover:text-white underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main Panel Content */}
        <main className="flex-1 p-4 sm:p-6">
          {/* Quick Send & Save Bar (Auto-extracts URLs, tags, categorizes & saves) */}
          <QuickSendBar
            onQuickSave={handleQuickSend}
            onOpenHelp={() => setIsSendHelpModalOpen(true)}
            isSaving={isQuickSaving}
          />

          {/* 30-Day Resource Creation Trends Stats Panel */}
          {!dataLoading && showStatsPanel && (
            <StatsPanel
              resources={resources}
              onClose={() => setShowStatsPanel(false)}
            />
          )}

          {dataLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-400">Syncing with Firestore...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            // Search / filter empty state
            <div className="max-w-xl mx-auto py-12">
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
                onAddClick={(cat) => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
              />
            </div>
          ) : currentFilter === 'All' && viewMode === 'board' ? (
            /* 4-COLUMN RESPONSIVE SECTION GRID */
            <div
              id="sections-board-grid"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start"
            >
              {categorizedSections.map(({ category, items }) => {
                const getSectionHeader = (cat: ResourceCategory) => {
                  switch (cat) {
                    case 'Link':
                      return {
                        title: 'Web Links',
                        icon: <Globe className="w-4 h-4 text-blue-400" />,
                        badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                      };
                    case 'Document':
                      return {
                        title: 'Documents',
                        icon: <FileText className="w-4 h-4 text-amber-400" />,
                        badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      };
                    case 'GitHub':
                      return {
                        title: 'GitHub Repos',
                        icon: <Github className="w-4 h-4 text-violet-400" />,
                        badge: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
                      };
                    case 'Reel':
                      return {
                        title: 'Reels & Media',
                        icon: <Film className="w-4 h-4 text-pink-400" />,
                        badge: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
                      };
                  }
                };

                const header = getSectionHeader(category);

                return (
                  <section
                    key={category}
                    id={`section-column-${category.toLowerCase()}`}
                    className="flex flex-col gap-3 min-w-0 bg-slate-900/30 rounded-2xl p-3 border border-slate-800/60"
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between px-1 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          {header.icon}
                        </div>
                        <h2 className="text-sm font-semibold text-white truncate">
                          {header.title}
                        </h2>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium border ${header.badge}`}
                      >
                        {items.length}
                      </span>
                    </div>

                    {/* Section Items or Category Empty State */}
                    {items.length === 0 ? (
                      <div className="py-4">
                        <EmptyState
                          category={category}
                          onAddClick={() => {
                            setEditingItem(null);
                            setIsAddModalOpen(true);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
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
            /* UNIFIED 4-COLUMN RESPONSIVE CARD GRID VIEW */
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white">
                    {currentFilter === 'All' ? 'All Items' : `${currentFilter} Resources`}
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">
                    ({filteredResources.length} items)
                  </span>
                </div>
              </div>

              <div
                id="unified-resource-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
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
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Resource Modal */}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.title || ''}
        loading={isDeleting}
      />

      {/* Global Drag-and-Drop Vault Target */}
      <GlobalDropZone onDropSave={handleQuickSend} />

      {/* Send to Vault Ways Modal */}
      <SendToVaultModal
        isOpen={isSendHelpModalOpen}
        onClose={() => setIsSendHelpModalOpen(false)}
        appOrigin={window.location.origin}
      />

      {/* Offline Status Warning Indicator */}
      <OfflineIndicator />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
