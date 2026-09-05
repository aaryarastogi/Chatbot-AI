'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles, Code2, HelpCircle, Briefcase } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onStop?: () => void;
  onSelectSuggestion?: (promptText: string) => void;
}

const SUGGESTIONS = [
  { icon: Code2, label: 'Write Next.js action', prompt: 'Write a clean Next.js 15 server action for user registration with TypeScript.' },
  { icon: Briefcase, label: 'Interview Questions', prompt: 'What are top technical interview questions for a Full-Stack Next.js AI developer role?' },
  { icon: Sparkles, label: 'Quantum Computing', prompt: 'Explain Quantum Computing in simple terms with real-world analogies.' },
  { icon: HelpCircle, label: 'React Performance', prompt: 'How do I prevent unnecessary re-renders in React 19 using useMemo and React.memo?' },
];

export default function ChatInput({ input, setInput, onSubmit, isLoading, onStop, onSelectSuggestion }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const handleSuggestionClick = (promptText: string) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(promptText);
    } else {
      setInput(promptText);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      {/* Quick Prompt Pills (Only show if input is empty & not loading) */}
      {!input && !isLoading && (
        <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
          {SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(item.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900/90 hover:bg-indigo-50/90 dark:hover:bg-indigo-950/60 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-200 font-medium transition-all shadow-xs"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Box Container */}
      <form onSubmit={onSubmit} className="relative flex items-center">
        <div className="relative w-full rounded-2xl bg-white dark:bg-[#0f172a]/95 border border-slate-200/90 dark:border-slate-700/60 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-lg shadow-slate-200/50 dark:shadow-xl overflow-hidden flex items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything... (Shift + Enter for new line)"
            className="w-full py-3.5 pl-4 pr-14 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none text-sm md:text-base max-h-44 min-h-[48px]"
          />

          {/* Action Button */}
          <div className="absolute right-2.5 bottom-2.5">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-9 h-9 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center transition-all"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-amber-600 dark:fill-amber-400" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  input.trim()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 hover:scale-105 active:scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-transparent'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
