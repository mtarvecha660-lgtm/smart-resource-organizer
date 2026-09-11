import React from 'react';
import { 
  Folder, 
  Globe, 
  FileText, 
  Github, 
  Film, 
  Plus, 
  LogOut, 
  Compass, 
  X,
  Hash,
  BarChart2,
  Sun,
  Moon,
  Send,
  Zap
} from 'lucide-react';
import { CategoryFilter, ResourceCategory } from '../types/resource';
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
  const navItems: { label: string; filter: CategoryFilter; icon: React.ReactNode; color: string }[] = [
    { label: 'All Resources', filter: 'All', icon: <Folder className="w-4 h-4" />, color: 'text-indigo-400' },
    { label: 'Web Links', filter: 'Link', icon: <Globe className="w-4 h-4" />, color: 'text-blue-400' },
    { label: 'Documents', filter: 'Document', icon: <FileText className="w-4 h-4" />, color: 'text-amber-400' },
    { label: 'GitHub Repos', filter: 'GitHub', icon: <Github className="w-4 h-4" />, color: 'text-violet-400' },
    { label: 'Reels & Media', filter: 'Reel', icon: <Film className="w-4 h-4" />, color: 'text-pink-400' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <Compass className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold text-white tracking-tight">Smart Resource</h1>
              <p className="text-[11px] text-slate-400">Personal Hub</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="p-4 space-y-2">
          <button
            id="btn-add-resource-sidebar"
            onClick={() => {
              onOpenAddModal();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>

          <button
            id="btn-send-to-vault-sidebar"
            onClick={() => {
              onOpenSendHelp();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-indigo-300 border border-slate-700/60 transition-all cursor-pointer"
            title="Ways to send anything to your vault (Drag & drop, paste, bookmarklet)"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Send Anything to Vault</span>
          </button>

          <PWAInstallButton variant="sidebar" />
        </div>

        {/* Categories Navigation */}
        <div className="px-3 flex-1 overflow-y-auto space-y-6">
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Categories
            </p>
            <nav className="space-y-1">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-200 border border-indigo-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-indigo-400' : item.color}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                        isActive
                          ? 'bg-indigo-500/25 text-indigo-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Trends & Analytics Toggle Button */}
            <div className="pt-2 mt-2 border-t border-slate-800/60">
              <button
                id="sidebar-toggle-stats-btn"
                onClick={() => {
                  onToggleStats();
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  showStatsPanel
                    ? 'bg-indigo-600/15 text-indigo-200 border border-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>30-Day Trends</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                    showStatsPanel
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {showStatsPanel ? 'Active' : 'Chart'}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Tags Filter Section */}
          {availableTags.length > 0 && (
            <div>
              <div className="px-3 flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Popular Tags
                </span>
                {selectedTag && (
                  <button
                    onClick={onClearTag}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 px-3">
                {availableTags.slice(0, 10).map((tag) => {
                  const isTagActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        onSelectTag(isTagActive ? '' : tag);
                        if (isOpenMobile) onCloseMobile();
                      }}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        isTagActive
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <Hash className="w-3 h-3 text-slate-500" />
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Theme Mode Toggle */}
        <div className="px-3 pt-2 pb-1">
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 pl-2">Theme</span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                id="theme-toggle-light"
                onClick={() => onToggleTheme('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Light theme"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </button>

              <button
                id="theme-toggle-dark"
                onClick={() => onToggleTheme('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Dark theme"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User avatar'}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-medium text-xs shrink-0">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="overflow-hidden leading-tight">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.displayName || 'Personal Account'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user?.email || 'Logged in'}
                </p>
              </div>
            </div>
            <button
              id="btn-signout"
              onClick={onSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
