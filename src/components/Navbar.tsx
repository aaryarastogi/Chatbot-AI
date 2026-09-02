'use client';

import React from 'react';
import { Menu, Key, Sparkles, SlidersHorizontal } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onOpenSettings: () => void;
}

export default function Navbar({
  onToggleSidebar,
  selectedModel,
  setSelectedModel,
  onOpenSettings,
}: NavbarProps) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0a0e1a]/80 backdrop-blur-md px-4 flex items-center justify-between z-30 sticky top-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
          <span className="text-xs font-medium text-slate-300 hidden sm:inline-block">
            Gemini AI Live
          </span>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Model Selector */}
        <div className="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 mr-1.5 hidden sm:inline" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium text-xs pr-1"
          >
            <option value="gemini-1.5-flash" className="bg-slate-900 text-slate-200">Gemini 1.5 Flash (Fast)</option>
            <option value="gemini-1.5-pro" className="bg-slate-900 text-slate-200">Gemini 1.5 Pro (Reasoning)</option>
            <option value="gemini-2.0-flash" className="bg-slate-900 text-slate-200">Gemini 2.0 Flash</option>
          </select>
        </div>

        {/* API Key Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all"
          title="Configure API Key"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">API Key</span>
        </button>
      </div>
    </header>
  );
}
