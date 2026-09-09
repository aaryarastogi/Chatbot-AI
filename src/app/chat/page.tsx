'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { ChatSession, Message } from '@/types/chat';
import { Sparkles, X, FileText, CheckCircle2, ShieldAlert, Code2, Cpu, Palette, Lightbulb, ArrowUpRight } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Code2,
    badge: 'Code & Debug',
    color: 'from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    title: 'Write Next.js 15 Server Action',
    prompt: 'Write a clean Next.js 15 server action for user registration with TypeScript and Zod validation.',
  },
  {
    icon: Cpu,
    badge: 'Architecture',
    color: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    title: 'Microservices vs Monolith',
    prompt: 'Explain Microservices vs Monolith Architecture with real-world trade-offs and diagram flow.',
  },
  {
    icon: Palette,
    badge: 'UI Component',
    color: 'from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
    title: 'Glassmorphic Card UI',
    prompt: 'Create a responsive glassmorphic dark theme card component using Tailwind CSS with hover effects.',
  },
  {
    icon: Lightbulb,
    badge: 'Interview Prep',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    title: 'AI Full-Stack Interview Qs',
    prompt: 'What are top technical interview questions for a Senior Full-Stack Next.js AI Engineer role?',
  },
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem('chatbot_ai_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('chatbot_ai_theme', nextTheme);

    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  // Authentication Guard: Check session or persistent local login state
  useEffect(() => {
    const isLocallyLoggedIn = typeof window !== 'undefined' && Boolean(localStorage.getItem('chatbot_ai_logged_in'));
    if (status === 'unauthenticated' && !isLocallyLoggedIn) {
      router.push('/login');
    }
  }, [status, router]);

  // Load Sessions from MongoDB Atlas on mount (with LocalStorage fallback)
  useEffect(() => {
    const loadUserChats = async () => {
      try {
        const res = await fetch('/api/chats');
        if (res.ok) {
          const data = await res.json();
          if (data.chats && Array.isArray(data.chats)) {
            setSessions(data.chats);
            localStorage.setItem('chatbot_ai_sessions', JSON.stringify(data.chats));
            if (data.chats.length > 0) {
              setActiveSessionId(data.chats[0].id);
            } else {
              createNewChat();
            }
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load chats from MongoDB:', e);
      }

      const savedSessions = localStorage.getItem('chatbot_ai_sessions');
      if (savedSessions) {
        try {
          const parsed: ChatSession[] = JSON.parse(savedSessions);
          setSessions(parsed);
          if (parsed.length > 0) {
            setActiveSessionId(parsed[0].id);
          } else {
            createNewChat();
          }
        } catch (e) {
          createNewChat();
        }
      } else {
        createNewChat();
      }
    };

    if (status === 'authenticated') {
      loadUserChats();
    } else {
      const savedSessions = localStorage.getItem('chatbot_ai_sessions');
      if (savedSessions) {
        try {
          const parsed: ChatSession[] = JSON.parse(savedSessions);
          setSessions(parsed);
          if (parsed.length > 0) setActiveSessionId(parsed[0].id);
          else createNewChat();
        } catch (e) {
          createNewChat();
        }
      } else {
        createNewChat();
      }
    }
  }, [status]);

  // Save Sessions to LocalStorage when changed
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chatbot_ai_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Sync specific Chat session to MongoDB Atlas
  const syncChatToMongoDB = async (sessionToSave: ChatSession) => {
    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionToSave.id,
          title: sessionToSave.title,
          messages: sessionToSave.messages,
        }),
      });
    } catch (e) {
      console.error('Failed to sync chat to MongoDB:', e);
    }
  };

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, isLoading]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem('chatbot_ai_sessions', JSON.stringify(updated));
      if (activeSessionId === id && updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else if (updated.length === 0) {
        setActiveSessionId(null);
      }
      return updated;
    });

    try {
      await fetch(`/api/chats?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Failed to delete chat from MongoDB:', e);
    }
  };

  const executePrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    let currentSessionId = activeSessionId;
    let currentSessions = [...sessions];

    if (!currentSessionId || !sessions.some((s) => s.id === currentSessionId)) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: promptText.slice(0, 30) + '...',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentSessions = [newSession, ...currentSessions];
      currentSessionId = newSession.id;
      setActiveSessionId(newSession.id);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText,
      createdAt: new Date().toISOString(),
    };

    const updatedSessionsWithUser = currentSessions.map((s) => {
      if (s.id === currentSessionId) {
        const title = s.messages.length === 0 ? promptText.slice(0, 30) : s.title;
        return {
          ...s,
          title,
          messages: [...s.messages, userMessage],
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    setSessions(updatedSessionsWithUser);
    setInput('');
    setIsLoading(true);

    const updatedSessionObj = updatedSessionsWithUser.find((s) => s.id === currentSessionId);
    if (updatedSessionObj) {
      syncChatToMongoDB(updatedSessionObj);
    }

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...s.messages, assistantPlaceholder] }
          : s
      )
    );

    try {
      abortControllerRef.current = new AbortController();

      const activeSessionObj = updatedSessionsWithUser.find((s) => s.id === currentSessionId);
      const apiMessages = (activeSessionObj?.messages || [])
        .filter((m) => m && m.content && m.content.trim() !== '')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          modelName: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || `API Request Failed with status ${res.status}`);
      }

      if (!res.body) throw new Error('No response stream available');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === currentSessionId) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
              );
              return { ...s, messages: msgs };
            }
            return s;
          })
        );
      }

      setSessions((latestSessions) => {
        const completedSession = latestSessions.find((s) => s.id === currentSessionId);
        if (completedSession) {
          syncChatToMongoDB(completedSession);
        }
        return latestSessions;
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        const rawErrMsg = err?.message || 'Unable to connect to AI server.';
        const formattedErr = rawErrMsg.startsWith('⚠️')
          ? rawErrMsg
          : `⚠️ **Error**: ${rawErrMsg}`;

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === currentSessionId) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: formattedErr,
                    }
                  : m
              );
              return { ...s, messages: msgs };
            }
            return s;
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executePrompt(input);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const isClientLoggedIn = typeof window !== 'undefined' && Boolean(localStorage.getItem('chatbot_ai_logged_in'));

  if (status === 'loading' && !isClientLoggedIn) {
    return (
      <div
        className="min-h-screen bg-[#080c17] text-slate-100 flex items-center justify-center"
        style={{ backgroundColor: '#080c17', color: '#f1f5f9', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium" style={{ color: '#94a3b8' }}>
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#080c17] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={createNewChat}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenResumeModal={() => setIsResumeModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl w-full mx-auto">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4 my-auto max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-5 shadow-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-500 animate-pulse" />
                <span>Powered by Google Gemini 3.5 & Next.js 15</span>
              </div>

              <h2 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-800 dark:from-white dark:via-indigo-100 dark:to-indigo-300 bg-clip-text text-transparent mb-3 text-center tracking-tight">
                What would you like to explore today?
              </h2>

              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 text-center max-w-md mb-8 leading-relaxed font-normal">
                Ask code questions, design system architecture, or get instant interview advice from your AI assistant.
              </p>

              {/* Interactive 4 Suggestion Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                {SUGGESTIONS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      onClick={() => executePrompt(item.prompt)}
                      className="suggestion-card glass-card p-4 rounded-2xl cursor-pointer bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 flex flex-col justify-between group shadow-xs hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl border bg-gradient-to-tr ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                          {item.badge}
                        </span>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            activeSession.messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                userImage={session?.user?.image}
                userName={session?.user?.name}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Box */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onStop={handleStopGeneration}
          onSelectSuggestion={(promptText) => executePrompt(promptText)}
        />
      </div>

      {/* Resume Project Guide Modal */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 md:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative bg-white dark:bg-[#0d1222]">
            <button
              onClick={() => setIsResumeModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Resume & Interview Cheat Sheet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Everything you need to showcase this project to recruiters</p>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-700 dark:text-slate-300">
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20">
                <h4 className="font-bold text-indigo-700 dark:text-indigo-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Resume Points to Copy:
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-700 dark:text-slate-300 text-xs">
                  <li>Engineered a full-stack AI Chatbot using <strong>Next.js 15 App Router</strong> and <strong>TypeScript</strong> with real-time SSE streaming.</li>
                  <li>Integrated <strong>MongoDB Atlas</strong> with Mongoose for persistent User Accounts and Chat History storage.</li>
                  <li>Integrated <strong>NextAuth.js</strong> supporting Google OAuth 2.0 and Credentials Auth with JWT session management.</li>
                  <li>Integrated <strong>Google Gemini API</strong> (`gemini-3.5-flash-lite`) for fast streaming LLM outputs.</li>
                  <li>Built a responsive glassmorphic theme supporting <strong>Light Mode & Dark Mode</strong> with Tailwind CSS and code syntax highlighting.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Key Tech Stack:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                  <div>• Framework: Next.js 15</div>
                  <div>• Database: MongoDB Atlas</div>
                  <div>• Language: TypeScript</div>
                  <div>• Auth: NextAuth.js</div>
                  <div>• AI: Google Gemini API</div>
                  <div>• Styling: Tailwind CSS</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsResumeModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20"
              >
                Close & Start Chatting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
