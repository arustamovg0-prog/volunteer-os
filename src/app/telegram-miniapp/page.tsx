'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MoreVertical, 
  X, 
  Wifi, 
  Battery, 
  Info,
  RefreshCw,
  Smartphone,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function TelegramMiniAppPage() {
  const [activeVolunteerName, setActiveVolunteerName] = useState('Мария Сидорова');
  const [iframeSrc, setIframeSrc] = useState('/volunteer-dashboard');
  const [iframeKey, setIframeKey] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Read session to display active profile
    const cachedName = localStorage.getItem('volunteerName');
    if (cachedName) {
      setActiveVolunteerName(cachedName);
    }

    const handleSessionChange = () => {
      const updatedName = localStorage.getItem('volunteerName');
      if (updatedName) setActiveVolunteerName(updatedName);
      // Reload iframe to update user session inside it
      setIframeKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleSessionChange);
    window.addEventListener('volunteer-session-change', handleSessionChange);

    return () => {
      window.removeEventListener('storage', handleSessionChange);
      window.removeEventListener('volunteer-session-change', handleSessionChange);
    };
  }, []);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row items-center justify-center p-4 md:p-8 gap-8 animate-fade-in font-sans">
      
      {/* Left Column: Quick Manual / Control panel */}
      <div className="max-w-xs space-y-4 text-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <MessageSquare className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Mini App Simulator</h2>
            <p className="text-[9px] text-slate-400">Симулятор Telegram-интерфейса</p>
          </div>
        </div>
        
        <p className="leading-relaxed text-slate-500 text-[10px]">
          В Telegram Mini App волонтерам доступна вся функциональность личного кабинета прямо внутри мессенджера: сдача чек-инов, просмотр проектов, CRM, чаты и регламенты.
        </p>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[9px] tracking-wider">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Инструкция по тесту
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-slate-500 leading-normal text-[9px]">
            <li>Авторизуйтесь волонтером (или бот выдаст сессию автоматически).</li>
            <li>Откройте симулятор Mini App (текущее окно).</li>
            <li>Экран телефона справа отобразит кабинет волонтера с адаптивной мобильной версткой.</li>
            <li>Все действия в телефоне мгновенно обновляют общую базу данных.</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Перезагрузить
          </button>
          <a
            href="/volunteer-dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            На весь экран
          </a>
        </div>
      </div>

      {/* Right Column: Phone Mockup Frame */}
      <div className="relative">
        {/* Phone Case Frame */}
        <div className="w-[360px] h-[720px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden">
          
          {/* Speaker Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-50 flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
          </div>

          {/* Status Bar */}
          <div className="h-7 bg-slate-950 text-white flex items-center justify-between px-6 text-[10px] select-none shrink-0 font-medium">
            <span>22:00</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[9px]">LTE</span>
              <Battery className="w-4 h-4 text-slate-300" />
            </div>
          </div>

          {/* Telegram Header App bar */}
          <div className="h-11 bg-[#1c2438] text-white flex items-center justify-between px-4 select-none shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIframeSrc('/volunteer-dashboard')}
                className="p-1 hover:bg-slate-800/40 rounded-full transition-all text-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <img src="/logo.png" alt="Bot avatar" className="w-8 h-8 rounded-full object-contain bg-white" />
              <div>
                <h4 className="font-bold text-[11px] leading-tight">Volunteer OS</h4>
                <p className="text-[8px] text-slate-400">bot @Volunteer_OS_bot</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 relative">
              <button
                onClick={() => setIsMenuOpen((value) => !value)}
                className="p-1 hover:bg-slate-800/40 rounded-full transition-all text-slate-300"
                aria-expanded={isMenuOpen}
                aria-label="Открыть меню Mini App"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-8 top-7 w-44 rounded-xl bg-white text-slate-800 border border-slate-200 shadow-xl z-50 p-1.5 text-[10px] font-semibold">
                  <button
                    onClick={handleRefresh}
                    className="w-full px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-left"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    Перезагрузить экран
                  </button>
                  <button
                    onClick={() => {
                      setIframeSrc('/volunteer-dashboard/profile');
                      setIframeKey(prev => prev + 1);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-left"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    Открыть профиль
                  </button>
                  <button
                    onClick={() => {
                      window.open('/volunteer-dashboard', '_blank', 'noreferrer');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-left"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    На весь экран
                  </button>
                </div>
              )}
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="p-1 hover:bg-slate-800/40 rounded-full transition-all text-slate-300"
                title="Закрыть Mini App и вернуться в CRM"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Webview Panel (iFrame inside Phone) */}
          <div className="flex-1 bg-slate-50 relative rounded-b-[28px] overflow-hidden">
            <iframe
              key={iframeKey}
              src={iframeSrc}
              className="w-full h-full border-none bg-slate-50"
              title="Telegram Mini App Viewport"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
