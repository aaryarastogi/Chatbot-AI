'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { ChatSession, Message } from '@/types/chat';
import { Key, Sparkles, X, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash-lite');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Authentication Guard: Check session or persistent local login state
  useEffect(() => {
    const isLocallyLoggedIn = localStorage.getItem('chatbot_ai_logged_in');
    if (status === 'unauthenticated' && !isLocallyLoggedIn) {
      router.push('/login');
    }
  }, [status, router]);

  // Load Sessions from LocalStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatbot_ai_sessions');
    const savedApiKey = localStorage.getItem('chatbot_ai_api_key');
    if (savedApiKey) setApiKey(savedApiKey);

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
  }, []);

  // Save Sessions to LocalStorage when changed
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chatbot_ai_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

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

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (activeSessionId === id && updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else if (updated.length === 0) {
        setActiveSessionId(null);
      }
      return updated;
    });
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('chatbot_ai_api_key', apiKey);
    setIsSettingsOpen(false);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('chatbot_ai_api_key');
    setApiKey('');
    setIsSettingsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let currentSessionId = activeSessionId;
    let currentSessions = [...sessions];

    // If no active session exists, create one
    if (!currentSessionId || !sessions.some((s) => s.id === currentSessionId)) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + '...',
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
      content: input,
      createdAt: new Date().toISOString(),
    };

    // Update Session with User Message
    const updatedSessionsWithUser = currentSessions.map((s) => {
      if (s.id === currentSessionId) {
        const title = s.messages.length === 0 ? input.slice(0, 30) : s.title;
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
    const userPrompt = input;
    setInput('');
    setIsLoading(true);

    // Assistant placeholder message for streaming
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

    // Call API Route for Streaming
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
          apiKey,
          modelName: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error('API Request Failed');
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

        // Update assistant message state incrementally
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
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === currentSessionId) {
              const msgs = s.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content:
                        '⚠️ Error: Unable to fetch response. Please check your network connection or API Key in Settings.',
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
    <div className="flex h-screen bg-[#080c17] overflow-hidden">
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
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl w-full mx-auto">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-teal-500/20 border border-indigo-500/30 flex items-center justify-center mb-6 shadow-2xl">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-100 mb-2">
                How can I assist you today?
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                Powered by Next.js App Router, TypeScript, and Google Gemini API. Ask code questions, design architecture, or resume tips!
              </p>
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
        />
      </div>

      {/* Settings Modal (API Key) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Gemini API Key Settings</h3>
                <p className="text-xs text-slate-400">Optional: Paste custom Google Gemini API Key</p>
              </div>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Stored securely in your browser&apos;s LocalStorage. Get a free key at{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20"
                >
                  Clear Stored Key
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                  >
                    Save API Key
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume Project Guide Modal */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 md:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative">
            <button
              onClick={() => setIsResumeModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 text-lg">Resume & Interview Cheat Sheet</h3>
                <p className="text-xs text-slate-400">Everything you need to showcase this project to recruiters</p>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300">
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
                <h4 className="font-bold text-indigo-300 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Resume Points to Copy:
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-300 text-xs">
                  <li>Engineered a full-stack AI Chatbot using <strong>Next.js 14 App Router</strong> and <strong>TypeScript</strong> with real-time SSE streaming.</li>
                  <li>Integrated <strong>NextAuth.js</strong> supporting Google OAuth 2.0 and Credentials Auth with JWT session management.</li>
                  <li>Integrated <strong>Vercel AI SDK</strong> with <strong>Google Gemini API</strong> for streaming LLM outputs.</li>
                  <li>Built a responsive glassmorphic dark theme using <strong>Tailwind CSS</strong> with Markdown rendering & code copy buttons.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Key Tech Stack:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                  <div>• Framework: Next.js 15</div>
                  <div>• Language: TypeScript</div>
                  <div>• Auth: NextAuth.js</div>
                  <div>• AI: Google Gemini API</div>
                  <div>• Styling: Tailwind CSS</div>
                  <div>• Streaming: Vercel AI SDK</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsResumeModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
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
