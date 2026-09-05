'use client';

import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, LogOut, X, Sparkles, User, FileCode2, Search } from 'lucide-react';
import { ChatSession } from '@/types/chat';
import { signOut, useSession } from 'next-auth/react';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenResumeModal?: () => void;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose,
  onOpenResumeModal,
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) =>
    (s.title || 'New Conversation').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0d121f] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 dark:from-white dark:via-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">
                Chatbot AI
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Google Gemini Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Search Input Filter */}
          {sessions.length > 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full py-1.5 pl-8 pr-3 rounded-lg bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          )}
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          <div className="px-2 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Recent Chats</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-mono font-semibold border border-slate-200 dark:border-slate-700/60">
              {sessions.length}
            </span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
              {searchQuery ? 'No matching chats found' : 'No chats yet. Click "New Chat" to begin!'}
            </div>
          ) : (
            filteredSessions.map((item) => {
              const isActive = item.id === activeSessionId;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectSession(item.id);
                    onClose();
                  }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 via-indigo-50/90 to-purple-50/70 dark:from-indigo-950/90 dark:via-indigo-900/70 dark:to-purple-950/80 border border-indigo-200/90 dark:border-indigo-500/50 text-indigo-950 dark:text-indigo-100 font-bold shadow-xs'
                      : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate text-xs md:text-sm">{item.title}</span>
                  </div>
                  <button
                    onClick={(e) => onDeleteSession(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Resume Info Guide Button */}
        {onOpenResumeModal && (
          <div className="px-3 py-2">
            <button
              onClick={onOpenResumeModal}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50/90 dark:bg-slate-900/80 hover:bg-indigo-100/90 dark:hover:bg-slate-800 border border-indigo-200/90 dark:border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300 font-semibold transition-all shadow-xs"
            >
              <FileCode2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Resume Project Guide</span>
            </button>
          </div>
        )}

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/60 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="User" className="w-full h-full rounded-full object-cover" />
                ) : (
                  session?.user?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {session?.user?.email || 'Authenticated'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem('chatbot_ai_logged_in');
                signOut({ callbackUrl: '/login' });
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
