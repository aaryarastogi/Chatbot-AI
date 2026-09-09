'use client';

import React from 'react';
import { Menu, Sparkles, Sun, Moon, Zap } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Navbar({
  onToggleSidebar,
  selectedModel,
  setSelectedModel,
  theme,
  onToggleTheme,
}: NavbarProps) {
  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0a0e1a]/80 backdrop-blur-xl px-4 flex items-center justify-between z-30 sticky top-0 transition-colors shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          title="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-500/20" />
            Gemini AI Live Engine
          </span>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Model Selector */}
        <div className="relative flex items-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 mr-2 hidden sm:inline" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-semibold text-xs pr-1"
          >
            <option value="gemini-3.5-flash" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              Gemini 3.5 Flash (Fast ⚡)
            </option>
            <option value="gemini-3.5-flash-lite" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              Gemini 3.5 Flash Lite (Ultra Fast)
            </option>
            <option value="gemini-3.6-flash" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              Gemini 3.6 Flash (Reasoning / Code)
            </option>
          </select>
        </div>

        {/* Light / Dark Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all shadow-xs flex items-center justify-center hover:border-indigo-300 dark:hover:border-indigo-500/50"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>
      </div>
    </header>
  );
}
