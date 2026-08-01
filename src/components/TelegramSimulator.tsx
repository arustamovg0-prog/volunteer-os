'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  X, 
  Send, 
  RotateCcw, 
  UserPlus, 
  UserCheck,
  Mic,
  MicOff,
  Paperclip
} from 'lucide-react';

interface MockMessage {
  id: string;
  telegram_id: number;
  sender: 'user' | 'bot';
  text: string;
  keyboard?: any;
  created_at: string;
}

interface VolunteerOption {
  id: string;
  telegram_id: number;
  full_name: string;
  phone: string;
}

export default function TelegramSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerOption | null>(null);
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isSimulatorEnabled, setIsSimulatorEnabled] = useState(true);

  const loadBotConfig = async () => {
    try {
      const res = await fetch('/api/telegram/config');
      if (res.ok) {
        const config = await res.json();
        setIsSimulatorEnabled(config.is_simulator_enabled);
      }
    } catch (e) {
      console.error('Failed to load bot config in simulator:', e);
    }
  };

  useEffect(() => {
    loadBotConfig();
    window.addEventListener('bot-config-change', loadBotConfig);
    return () => {
      window.removeEventListener('bot-config-change', loadBotConfig);
    };
  }, []);

  // Fetch volunteers list for simulation dropdown
  useEffect(() => {
    async function loadVolunteers() {
      try {
        const res = await fetch('/api/users?role=volunteer');
        const data = await res.json();
        // Filter those who have a telegram_id for simulation
        if (Array.isArray(data)) {
          setVolunteers(data.filter((u: any) => u.telegram_id));
        } else {
          setVolunteers([]);
        }
      } catch (err) {
        console.error('Failed to load volunteers for simulator', err);
      }
    }
    loadVolunteers();
  }, [isOpen]);

  // Load chat history when selected volunteer changes
  useEffect(() => {
    if (selectedVolunteer) {
      loadHistory();
    } else {
      setMessages([]);
    }
  }, [selectedVolunteer]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 3 seconds when open
  useEffect(() => {
    if (!isOpen || !selectedVolunteer) return;
    
    const timer = setInterval(() => {
      loadHistory(true); // silent load
    }, 3000);

    return () => clearInterval(timer);
  }, [isOpen, selectedVolunteer]);

  async function loadHistory(silent = false) {
    if (!selectedVolunteer) return;
    try {
      const res = await fetch(`/api/telegram/simulate?telegramId=${selectedVolunteer.telegram_id}`);
      const data = await res.json();
      if (data.history) {
        setMessages(data.history);
      }
    } catch (err) {
      if (!silent) console.error('Failed to load simulator history', err);
    }
  }

  async function sendMessage(text: string, phone?: string) {
    if (!selectedVolunteer || (!text.trim() && !phone)) return;
    setIsLoading(true);
    setInputText('');

    try {
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: selectedVolunteer.telegram_id,
          text: text,
          phone: phone || null,
          username: selectedVolunteer.full_name.toLowerCase().replace(/\s+/g, '_')
        })
      });
      const data = await res.json();
      if (data.history) {
        setMessages(data.history);
      }
    } catch (err) {
      console.error('Failed to send simulated message', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Simulate sending a voice message (prefixing text with [Голосовое сообщение])
  async function sendVoiceMessage() {
    if (!selectedVolunteer) return;
    
    const voiceText = inputText.trim() 
      ? `[Голосовое сообщение] ${inputText.trim()}`
      : `[Голосовое сообщение] Успешно завершили доставку медикаментов для пожилых людей по 3 адресам в Октябрьском районе. Отработали ровно 3 часа, сложностей не возникло.`;
      
    await sendMessage(voiceText);
  }

  async function resetSimulator() {
    if (!selectedVolunteer) return;
    if (!confirm('Вы уверены, что хотите сбросить сессию и очистить историю сообщений бота?')) return;
    
    try {
      await fetch(`/api/telegram/simulate?telegramId=${selectedVolunteer.telegram_id}`, {
        method: 'DELETE'
      });
      setMessages([]);
    } catch (err) {
      console.error('Failed to reset simulator', err);
    }
  }

  const pathname = usePathname();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage(inputText);
    }
  };

  if (!isSimulatorEnabled && pathname?.startsWith('/volunteer-dashboard')) {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-2.5 shadow-2xl transition-all hover:scale-105 active:scale-95 border border-slate-800"
        aria-label="Открыть тест Telegram бота"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-semibold">Тест Telegram бота</span>
      </button>

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          {/* Backdrop Closer */}
          <div className="flex-1" onClick={() => setIsOpen(false)} />
          
          {/* Main Simulator Window */}
          <div className="w-full sm:w-[430px] h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider truncate">Симулятор Telegram</h3>
                  <p className="text-[10px] text-slate-500 truncate">Тестирование сценариев бота волонтера</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Volunteer Selection */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Симулируемый волонтер:
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedVolunteer?.id || ''}
                  onChange={(e) => {
                    const selected = volunteers.find(v => v.id === e.target.value);
                    setSelectedVolunteer(selected || null);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="">-- Выберите волонтера --</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.full_name} ({v.phone})
                    </option>
                  ))}
                </select>
                
                {selectedVolunteer && (
                  <button
                    onClick={resetSimulator}
                    title="Сбросить историю сообщений"
                    className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-50/60">
              {selectedVolunteer ? (
                messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Сообщения отсутствуют. Напишите /start для инициализации.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isBot = msg.sender === 'bot';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}>
                        <div className="text-[9px] text-slate-400 font-semibold px-1">
                          {isBot ? 'Бот ассистент' : selectedVolunteer.full_name}
                        </div>
                        
                        {/* Audio or text tag */}
                        <div className={`max-w-[88%] sm:max-w-[85%] rounded-xl px-3.5 sm:px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                          isBot 
                            ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm' 
                            : msg.text.startsWith('[Голосовое сообщение]')
                              ? 'bg-slate-800 text-white rounded-tr-none flex items-center gap-2'
                              : 'bg-slate-900 text-white rounded-tr-none'
                        }`}>
                          {(() => {
                            if (msg.text.startsWith('[Голосовое сообщение]')) {
                              return (
                                <>
                                  <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <div className="italic">
                                    {msg.text.replace('[Голосовое сообщение]', '').trim()}
                                  </div>
                                </>
                              );
                            }

                            const fileMatch = msg.text.match(/^📎 \[Файл: (.*?)\]\n\n([\s\S]*)$/);
                            if (fileMatch) {
                              const [, fileName, bodyText] = fileMatch;
                              return (
                                <div>
                                  <div className="flex items-center gap-2 px-2.5 py-1.5 mb-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 font-medium text-[11px] shadow-2xs">
                                    <Paperclip className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span className="truncate font-semibold">{fileName}</span>
                                  </div>
                                  <div>{bodyText}</div>
                                </div>
                              );
                            }

                            return msg.text;
                          })()}
                        </div>

                        {/* Interactive Buttons */}
                        {isBot && msg.keyboard && msg.keyboard.length > 0 && (
                          <div className="flex flex-col gap-1.5 mt-1.5 w-[85%]">
                            {msg.keyboard.map((row: any[], rowIdx: number) => (
                              <div key={rowIdx} className="flex gap-1.5 flex-wrap">
                                {row.map((btn: any, btnIdx: number) => {
                                  if (btn.request_contact) {
                                    return (
                                      <button
                                        key={btnIdx}
                                        onClick={() => sendMessage('', selectedVolunteer.phone)}
                                        className="flex-1 py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold text-center flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                      >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        Отправить телефон
                                      </button>
                                    );
                                  }
                                  return (
                                    <button
                                      key={btnIdx}
                                      onClick={() => sendMessage(btn.callback_data || btn.text)}
                                      className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold text-center transition-all shadow-sm"
                                    >
                                      {btn.text}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 py-24">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-800 font-semibold text-xs uppercase tracking-wider">Сессия не выбрана</h4>
                    <p className="text-slate-500 text-xs mt-1">Выберите волонтера в выпадающем списке сверху, чтобы протестировать бота от его имени</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input & Voice Simulation */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex flex-col gap-2.5 pb-[calc(12px+env(safe-area-inset-bottom))] sm:pb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={selectedVolunteer ? "Напишите сообщение..." : "Выберите волонтера..."}
                  disabled={!selectedVolunteer || isLoading}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 disabled:opacity-50"
                />
                
                {selectedVolunteer && (
                  <button
                    onClick={sendVoiceMessage}
                    disabled={isLoading}
                    title="Симулировать отправку голосового сообщения"
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => sendMessage(inputText)}
                  disabled={!selectedVolunteer || !inputText.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Helper Commands */}
              {selectedVolunteer && (
                <div className="flex gap-1.5 overflow-x-auto text-[10px] pt-1.5 border-t border-slate-100 select-none items-center scrollbar-none">
                  <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-1">Быстрые:</span>
                  {['/start', '/tasks', '/status', '/help'].map(cmd => (
                    <button
                      key={cmd}
                      onClick={() => sendMessage(cmd)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-semibold transition-all shrink-0"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
