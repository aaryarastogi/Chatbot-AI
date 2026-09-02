'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Square, Sparkles, Code2, HelpCircle, Briefcase } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onStop?: () => void;
}

const SUGGESTIONS = [
  { icon: Code2, label: 'Write Next.js code', prompt: 'Write a clean Next.js 14 server action for user registration with TypeScript.' },
  { icon: Briefcase, label: 'Resume interview tips', prompt: 'What are top technical interview questions for a Full-Stack Next.js AI developer role?' },
  { icon: Sparkles, label: 'Explain Quantum Computing', prompt: 'Explain Quantum Computing in simple terms with real-world analogies.' },
  { icon: HelpCircle, label: 'Debug React state', prompt: 'How do I prevent unnecessary re-renders in React 19 using useMemo and React.memo?' },
];

export default function ChatInput({ input, setInput, onSubmit, isLoading, onStop }: ChatInputProps) {
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      {/* Quick Prompt Pills (Only show if input is empty) */}
      {!input && !isLoading && (
        <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
          {SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(item.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-indigo-200 transition-all shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Box Container */}
      <form onSubmit={onSubmit} className="relative flex items-center">
        <div className="relative w-full rounded-2xl glass-input border border-slate-700/60 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-2xl overflow-hidden flex items-end bg-[#0f172a]/90">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything... (Shift + Enter for new line)"
            className="w-full py-3.5 pl-4 pr-14 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none resize-none text-sm md:text-base max-h-44 min-h-[48px]"
          />

          {/* Action Button */}
          <div className="absolute right-2 bottom-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-9 h-9 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 flex items-center justify-center transition-all"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-amber-400" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  input.trim()
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
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
