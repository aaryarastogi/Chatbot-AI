'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { Sparkles, User, Copy, Check } from 'lucide-react';
import { Message } from '@/types/chat';

interface ChatMessageProps {
  message: Message;
  userImage?: string | null;
  userName?: string | null;
}

export default function ChatMessage({ message, userImage, userName }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 md:gap-4 p-4 md:p-5 rounded-2xl transition-all shadow-sm ${
        isUser
          ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white ml-auto max-w-[88%] md:max-w-[78%] shadow-indigo-500/10'
          : 'bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 mr-auto w-full backdrop-blur-md'
      }`}
    >
      {/* Avatar Icon */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-md font-bold text-sm">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="User" className="w-full h-full rounded-full object-cover" />
            ) : (
              userName?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
            )}
          </div>
        ) : (
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-extrabold ${isUser ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-400'}`}>
            {isUser ? userName || 'You' : 'Gemini AI'}
          </span>
          {!isUser && message.content && (
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60"
              title="Copy answer"
            >
              {copied ? (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </div>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {isUser ? (
          <p className="text-white whitespace-pre-wrap leading-relaxed text-sm md:text-base font-normal">
            {message.content}
          </p>
        ) : message.content ? (
          <div className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock
                      language={match[1]}
                      value={String(children).replace(/\n$/, '')}
                    />
                  ) : (
                    <code
                      className="bg-indigo-50/90 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-xs md:text-sm font-mono border border-indigo-200/70 dark:border-slate-700/60 font-semibold"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 leading-relaxed text-slate-800 dark:text-slate-200">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-800 dark:text-slate-300">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-800 dark:text-slate-300">{children}</ol>;
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold transition-colors"
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs py-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span className="font-semibold text-slate-500 dark:text-slate-400 animate-pulse">Gemini is writing response...</span>
          </div>
        )}
      </div>
    </div>
  );
}
