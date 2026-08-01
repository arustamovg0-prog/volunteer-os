'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Send, User, Search, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_role: string;
  text: string;
  created_at: string;
}

export default function CoordinatorChatsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    setLoading(true);
    try {
      const res = await fetch('/api/chats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      }
    } catch (e) {
      console.error('Failed to load chats:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        setText('');
        loadChats();
      }
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Чаты координатора</h1>
          <p className="text-sm text-slate-500">Прямое общение с волонтерами проектов</p>
        </div>
        <button
          onClick={loadChats}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Обновить
        </button>
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 gap-3">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-medium">Загружаем сообщения...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Нет сообщений</p>
            <p className="text-xs text-slate-400">Напишите первое сообщение волонтерам</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_role === 'coordinator' || m.sender_role === 'admin';
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-500">
                    {m.sender_name || (isMe ? 'Координатор' : 'Волонтер')}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSend} className="shrink-0 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напишите сообщение волонтерам..."
          className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </div>
  );
}
