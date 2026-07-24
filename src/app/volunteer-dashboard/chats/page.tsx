'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Building2, 
  FolderIcon, 
  ArrowLeft,
  Sparkles,
  Inbox,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import VolunteerBottomNav from '@/components/VolunteerBottomNav';

interface Chat {
  id: string;
  type: 'management' | 'organization' | 'project';
  title: string;
  project_id?: string | null;
  volunteer_id?: string | null;
  target_org_id?: string | null;
  created_at: string;
}

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'admin' | 'manager' | 'volunteer';
  text: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  phone?: string | null;
}

interface OrganizationOption {
  id: string;
  name: string;
}

export default function VolunteerChatsPage() {
  const [volunteerId, setVolunteerId] = useState<string | null>(null);
  const [volunteer, setVolunteer] = useState<UserProfile | null>(null);
  const [allVolunteers, setAllVolunteers] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal / Selector state for new chat
  const [showNewChatPanel, setShowNewChatPanel] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedVolId, setSelectedVolId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cachedId = localStorage.getItem('volunteerId');
    setVolunteerId(cachedId);
    loadInitialData(cachedId);
  }, []);

  // Poll for messages in active chat
  useEffect(() => {
    if (!selectedChat) return;

    loadMessages(selectedChat.id);
    const interval = setInterval(() => {
      loadMessages(selectedChat.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadInitialData(currentId: string | null) {
    setLoading(true);
    try {
      const usersRes = await fetch('/api/users');
      const usersData: UserProfile[] = await usersRes.json();
      const vols = usersData.filter(u => u.role === 'volunteer');
      setAllVolunteers(vols);

      if (currentId) {
        const found = vols.find(u => u.id === currentId);
        if (found) {
          setVolunteer(found);
          // Fetch chats
          const [chatsRes, orgsRes] = await Promise.all([
            fetch(`/api/chats?volunteerId=${currentId}`),
            fetch('/api/organizations')
          ]);
          setChats(chatsRes.ok ? await chatsRes.json() : []);
          setOrganizations(orgsRes.ok ? await orgsRes.json() : []);
        } else {
          localStorage.removeItem('volunteerId');
          setVolunteerId(null);
        }
      }
    } catch (e) {
      console.error('Failed to load volunteer chats initial data', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(chatId: string) {
    try {
      const res = await fetch(`/api/chats/messages?chatId=${chatId}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch messages', e);
    }
  }

  const handleLogin = () => {
    if (!selectedVolId) return;
    localStorage.setItem('volunteerId', selectedVolId);
    setVolunteerId(selectedVolId);
    loadInitialData(selectedVolId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !volunteer || !newMessageText.trim()) return;
    const textToSend = newMessageText.trim();
    setNewMessageText('');

    try {
      const res = await fetch('/api/chats/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.id,
          senderId: volunteer.id,
          senderName: volunteer.full_name,
          senderRole: 'volunteer',
          text: textToSend
        })
      });

      if (res.ok) {
        // Reload messages immediately
        loadMessages(selectedChat.id);
      } else {
        setErrorMessage('Не удалось отправить сообщение. Проверьте подключение и попробуйте снова.');
      }
    } catch (e) {
      console.error('Failed to send message', e);
      setErrorMessage('Ошибка соединения при отправке сообщения.');
    }
  };

  // Start chat with management
  const handleStartManagementChat = async () => {
    if (!volunteer) return;
    setActionLoading(true);
    setErrorMessage(null);
    
    // Check if management chat already exists
    const existing = chats.find(c => c.type === 'management');
    if (existing) {
      setSelectedChat(existing);
      setShowNewChatPanel(false);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'management',
          title: 'Руководство Ассоциации',
          volunteer_id: volunteer.id
        })
      });

      if (res.ok) {
        const newChat = await res.json();
        setChats(prev => [newChat, ...prev]);
        setSelectedChat(newChat);
        setShowNewChatPanel(false);
      } else {
        setErrorMessage('Не удалось создать чат с руководством.');
      }
    } catch (e) {
      console.error('Failed to create management chat', e);
      setErrorMessage('Ошибка соединения при создании чата.');
    } finally {
      setActionLoading(false);
    }
  };

  // Start chat with organization
  const handleStartOrgChat = async () => {
    if (!volunteer || !selectedOrgId) return;
    const org = organizations.find(o => o.id === selectedOrgId);
    if (!org) return;
    setActionLoading(true);
    setErrorMessage(null);

    // Check if chat already exists
    const existing = chats.find(c => c.type === 'organization' && c.target_org_id === selectedOrgId);
    if (existing) {
      setSelectedChat(existing);
      setShowNewChatPanel(false);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'organization',
          title: org.name,
          volunteer_id: volunteer.id,
          target_org_id: selectedOrgId
        })
      });

      if (res.ok) {
        const newChat = await res.json();
        setChats(prev => [newChat, ...prev]);
        setSelectedChat(newChat);
        setShowNewChatPanel(false);
      } else {
        setErrorMessage('Не удалось создать чат с организацией.');
      }
    } catch (e) {
      console.error('Failed to create organization chat', e);
      setErrorMessage('Ошибка соединения при создании чата.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  // --- SIGN-IN SCREEN ---
  if (!volunteerId || !volunteer) {
    return (
      <main className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-center animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Обратная связь и Чаты</h2>
            <p className="text-xs text-slate-500 mt-1">
              Выберите свой профиль для перехода в диалоги
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ваш профиль</label>
              <select
                value={selectedVolId}
                onChange={(e) => setSelectedVolId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              >
                <option value="">-- Выберите профиль --</option>
                {allVolunteers.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.full_name} ({v.phone || 'без телефона'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLogin}
              disabled={!selectedVolId}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:text-slate-400"
            >
              Войти в кабинет
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- ACTIVE CHAT PANEL VIEW ---
  if (selectedChat) {
    return (
      <div className="flex flex-col h-screen bg-[#F9FAFB] animate-fade-in">
        {/* Chat Room Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
          <button 
            onClick={() => setSelectedChat(null)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            {selectedChat.type === 'management' && <ShieldCheck className="w-4 h-4 text-slate-650" />}
            {selectedChat.type === 'organization' && <Building2 className="w-4 h-4 text-slate-650" />}
            {selectedChat.type === 'project' && <FolderIcon className="w-4 h-4 text-slate-650" />}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-slate-900 text-xs truncate leading-snug">{selectedChat.title}</h4>
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
              {selectedChat.type === 'management' && 'Чат с руководством'}
              {selectedChat.type === 'organization' && 'Чат с организацией'}
              {selectedChat.type === 'project' && 'Обсуждение проекта'}
            </span>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-400 text-xs">
              <MessageSquare className="w-6 h-6 text-slate-300" />
              <span>Напишите первое сообщение...</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === volunteer.id;
              
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] ${isMine ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  {/* Sender metadata (not needed if it's mine in standard chat bubbles) */}
                  {!isMine && (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                      {msg.sender_name} ({msg.sender_role === 'manager' || msg.sender_role === 'admin' ? 'Куратор' : 'Волонтер'})
                    </span>
                  )}
                  
                  {/* Text bubble */}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isMine 
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>

                  <span className="text-[8px] text-slate-400 font-semibold mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Footer */}
        <form 
          onSubmit={handleSendMessage}
          className="h-16 bg-white border-t border-slate-200 flex items-center px-4 gap-3 shrink-0 pb-1"
        >
          <input
            type="text"
            required
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // --- MAIN CHATS LIST VIEW ---
  return (
    <div className="space-y-5 pb-20 animate-fade-in px-1 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-900" />
          <h2 className="text-base font-bold text-slate-900 leading-tight">Диалоги и обратная связь</h2>
        </div>
        
        <button
          onClick={() => setShowNewChatPanel(prev => !prev)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 flex items-center gap-1 text-[10px] font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Новый чат
        </button>
      </div>

      {/* Volunteer Profile Info */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between shadow-sm">
        <span>Профиль: <span className="text-slate-800 font-bold">{volunteer.full_name}</span></span>
        <span>Диалогов: <span className="text-slate-900 font-bold">{chats.length}</span></span>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl border border-red-100 bg-red-50 text-red-700 text-[10px] font-semibold">
          {errorMessage}
        </div>
      )}

      {/* NEW CHAT PANEL POP-DOWN */}
      {showNewChatPanel && (
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 shadow-sm animate-fade-in">
          <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Создать диалог</h4>
          
          <div className="space-y-4">
            {/* Start management chat */}
            <div className="flex items-center justify-between gap-4 p-2.5 rounded-lg border border-slate-150 bg-slate-50/50">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 block">Обратиться к руководству</span>
                <span className="text-[9px] text-slate-450 block">Задать вопрос напрямую кураторам ассоциации</span>
              </div>
              <button
                onClick={handleStartManagementChat}
                disabled={actionLoading}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded text-[10px] font-semibold transition-colors shrink-0"
              >
                {actionLoading ? 'Создаем...' : 'Начать чат'}
              </button>
            </div>

            {/* Start organization chat */}
            <div className="space-y-2 p-2.5 rounded-lg border border-slate-150 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-900 block">Написать другой волонтерской организации</span>
              <div className="flex gap-2 items-center">
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">-- Выберите организацию --</option>
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleStartOrgChat}
                  disabled={!selectedOrgId || actionLoading}
                  className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded text-[10px] font-semibold transition-colors shrink-0"
                >
                  {actionLoading ? 'Создаем...' : 'Начать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHATS LIST */}
      <div className="space-y-3">
        {chats.length === 0 ? (
          <div className="glass-panel bg-white p-12 text-center text-slate-400 text-xs border border-slate-200 shadow-sm rounded-xl py-12 flex flex-col items-center justify-center space-y-2">
            <Inbox className="w-6 h-6 text-slate-300" />
            <span>У вас пока нет активных переписок. Нажмите кнопку «Новый чат», чтобы начать диалог.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {chats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-350 transition-all shadow-sm flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-900 transition-colors">
                    {chat.type === 'management' && <ShieldCheck className="w-4.5 h-4.5 text-slate-650" />}
                    {chat.type === 'organization' && <Building2 className="w-4.5 h-4.5 text-slate-650" />}
                    {chat.type === 'project' && <FolderIcon className="w-4.5 h-4.5 text-slate-650" />}
                  </div>
                  
                  <div className="min-w-0 flex-1 pr-4">
                    <h4 className="font-bold text-slate-900 text-xs leading-snug group-hover:text-slate-900 truncate">{chat.title}</h4>
                    <span className="text-[9px] text-slate-450 font-semibold uppercase tracking-wider block mt-0.5">
                      {chat.type === 'management' && 'Обратная связь'}
                      {chat.type === 'organization' && 'Партнерская переписка'}
                      {chat.type === 'project' && 'Чат проекта'}
                    </span>
                  </div>
                </div>
                
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
