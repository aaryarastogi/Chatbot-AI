'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { Sparkles, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';
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
      className={`flex gap-3 md:gap-4 p-4 md:p-6 rounded-2xl transition-all ${
        isUser
          ? 'bg-slate-900/40 border border-slate-800/60 ml-auto max-w-[85%] md:max-w-[75%]'
          : 'glass-card border border-indigo-500/10 mr-auto w-full'
      }`}
    >
      {/* Avatar Icon */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md font-semibold text-sm">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="User" className="w-full h-full rounded-full object-cover" />
            ) : (
              userName?.charAt(0).toUpperCase() || <User className="w-5 h-5" />
            )}
          </div>
        ) : (
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white animate-pulse" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-400">
            {isUser ? userName || 'You' : 'Gemini AI'}
          </span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-slate-800/50"
              title="Copy answer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {isUser ? (
          <p className="text-slate-100 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-invert max-w-none text-slate-200 text-sm md:text-base leading-relaxed">
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
                      className="bg-slate-800/80 text-indigo-300 px-1.5 py-0.5 rounded text-xs md:text-sm font-mono border border-slate-700/50"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-300">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-300">{children}</ol>;
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
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
        )}
      </div>
    </div>
  );
}
