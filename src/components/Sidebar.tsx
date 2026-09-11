// File: src/components/Sidebar.tsx
import React from 'react';
import {
  Folder,
  Globe,
  FileText,
  Github,
  Film,
  Plus,
  LogOut,
  X,
  Hash,
  BarChart2,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { CategoryFilter } from '../types/resource';
import { User } from 'firebase/auth';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  currentFilter: CategoryFilter;
  onSelectFilter: (filter: CategoryFilter) => void;
  onOpenAddModal: () => void;
  categoryCounts: Record<CategoryFilter, number>;
  user: User | null;
  onSignOut: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  selectedTag: string | null;
  onClearTag: () => void;
  availableTags: string[];
  onSelectTag: (tag: string) => void;
  showStatsPanel: boolean;
  onToggleStats: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: (theme: 'dark' | 'light') => void;
  onOpenSendHelp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  onSelectFilter,
  onOpenAddModal,
  categoryCounts,
  user,
  onSignOut,
  isOpenMobile,
  onCloseMobile,
  selectedTag,
  onClearTag,
  availableTags,
  onSelectTag,
  showStatsPanel,
  onToggleStats,
  theme,
  onToggleTheme,
  onOpenSendHelp,
}) => {
  const navItems: { label: string; filter: CategoryFilter; icon: React.ReactNode }[] = [
    { label: 'All Resources', filter: 'All', icon: <Folder className="w-4 h-4" /> },
    { label: 'Web Links', filter: 'Link', icon: <Globe className="w-4 h-4" /> },
    { label: 'Documents', filter: 'Document', icon: <FileText className="w-4 h-4" /> },
    { label: 'GitHub Repos', filter: 'GitHub', icon: <Github className="w-4 h-4" /> },
    { label: 'Reels & Media', filter: 'Reel', icon: <Film className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-150 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 font-mono text-xs font-bold">
              S
            </div>
            <div className="leading-none">
              <h1 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Resource Organizer
              </h1>
              <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                v1.2.0 • secure
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="p-3 space-y-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
          <button
            id="btn-add-resource-sidebar"
            onClick={() => {
              onOpenAddModal();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Resource</span>
          </button>

          <button
            id="btn-send-to-vault-sidebar"
            onClick={() => {
              onOpenSendHelp();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
          >
            <Zap className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
            <span>Quick Send Guide</span>
          </button>

          <PWAInstallButton variant="sidebar" />
        </div>

        {/* Navigation & Filters */}
        <div className="px-2 py-3 flex-1 overflow-y-auto space-y-5">
          <div>
            <p className="px-2 font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
              Categories
            </p>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = currentFilter === item.filter;
                const count = categoryCounts[item.filter] || 0;
                return (
                  <button
                    key={item.filter}
                    id={`filter-btn-${item.filter.toLowerCase()}`}
                    onClick={() => {
                      onSelectFilter(item.filter);
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 dark:text-zinc-400">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <button
                id="sidebar-toggle-stats-btn"
                onClick={() => {
                  onToggleStats();
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  showStatsPanel
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Activity Metrics</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  {showStatsPanel ? 'Visible' : 'Hidden'}
                </span>
              </button>
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <div className="px-2 flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Tags
                </span>
                {selectedTag && (
                  <button
                    onClick={onClearTag}
                    className="font-mono text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 px-1">
                {availableTags.slice(0, 12).map((tag) => {
                  const isTagActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        onSelectTag(isTagActive ? '' : tag);
                        if (isOpenMobile) onCloseMobile();
                      }}
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        isTagActive
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                          : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Theme Mode Toggle */}
        <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Theme
            </span>
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded border border-zinc-200 dark:border-zinc-800">
              <button
                id="theme-toggle-light"
                onClick={() => onToggleTheme('light')}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
                title="Light theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                id="theme-toggle-dark"
                onClick={() => onToggleTheme('dark')}
                className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-700'
                }`}
                title="Dark theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* User Account Bar */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-6 h-6 rounded-full border border-zinc-300 dark:border-zinc-700 object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {user?.displayName || 'Personal Vault'}
                </p>
                <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                  {user?.email || 'authenticated'}
                </p>
              </div>
            </div>

            <button
              id="btn-signout"
              onClick={onSignOut}
              title="Sign Out"
              className="p-1 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
