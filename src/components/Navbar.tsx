'use client';

import React, { useState } from 'react';
import { Menu, Sparkles, Sun, Moon, Zap, Key, X, Check } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  apiKey?: string;
  onSaveApiKey?: (key: string) => void;
}

export default function Navbar({
  onToggleSidebar,
  selectedModel,
  setSelectedModel,
  theme,
  onToggleTheme,
  apiKey = '',
  onSaveApiKey,
}: NavbarProps) {
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveApiKey) {
      onSaveApiKey(tempKey.trim());
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsKeyModalOpen(false);
    }, 1200);
  };

  return (
    <>
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

          {/* API Key Modal Toggle Button */}
          <button
            onClick={() => {
              setTempKey(apiKey);
              setIsKeyModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-xs ${
              apiKey
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 animate-pulse'
            }`}
            title="Set custom Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{apiKey ? 'API Key Set' : 'Set API Key'}</span>
          </button>

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

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0d1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Gemini API Key</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure your Google AI Studio key</p>
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter Key (starts with <code className="font-mono text-indigo-600 dark:text-indigo-400">AIzaSy...</code>):
                </label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Get a free key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  Google AI Studio ↗
                </a>
                . Keys are saved securely in your local browser storage.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save API Key</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
