'use client';

import React from 'react';
import { Plus, MessageSquare, Trash2, LogOut, X, Sparkles, User, FileCode2 } from 'lucide-react';
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
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#0d121f] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-base bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Chatbot AI
            </h1>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recent Conversations
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No chats yet. Click &quot;New Chat&quot; to begin!
            </div>
          ) : (
            sessions.map((item) => {
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
                      ? 'bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate text-xs md:text-sm">{item.title}</span>
                  </div>
                  <button
                    onClick={(e) => onDeleteSession(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-opacity"
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
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-indigo-500/20 text-xs text-indigo-300 font-medium transition-all"
            >
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              <span>Resume Project Guide</span>
            </button>
          </div>
        )}

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="User" className="w-full h-full rounded-full object-cover" />
                ) : (
                  session?.user?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {session?.user?.email || 'Authenticated'}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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
