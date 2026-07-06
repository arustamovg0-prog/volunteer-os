'use client';

import { useState } from 'react';
import { Send, Users, ShieldCheck, AlertCircle, Megaphone, Info } from 'lucide-react';
import { getPrivilegedHeaders } from '@/lib/client-security';

export default function BroadcastPage() {
  const [message, setMessage] = useState('');
  const [targets, setTargets] = useState({
    volunteer: true,
    manager: false,
    admin: false
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resultMsg, setResultMsg] = useState('');

  const handleTargetChange = (role: 'volunteer' | 'manager' | 'admin') => {
    setTargets(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const handleBroadcast = async () => {
    if (!message.trim()) {
      setStatus('error');
      setResultMsg('Сообщение не может быть пустым.');
      return;
    }
    
    const selectedRoles = Object.entries(targets)
      .filter(([_, isSelected]) => isSelected)
      .map(([role]) => role);

    if (selectedRoles.length === 0) {
      setStatus('error');
      setResultMsg('Выберите хотя бы одну группу для рассылки.');
      return;
    }

    setStatus('loading');
    setResultMsg('');

    try {
      const res = await fetch('/api/telegram/broadcast', {
        method: 'POST',
        headers: getPrivilegedHeaders(),
        body: JSON.stringify({ message, roles: selectedRoles })
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setResultMsg(data.error || 'Произошла ошибка при отправке.');
        return;
      }

      setStatus('success');
      setResultMsg(`Рассылка успешно завершена! Доставлено ${data.count} пользователям.`);
      setMessage('');
    } catch (e) {
      console.error(e);
      setStatus('error');
      setResultMsg('Ошибка сети. Попробуйте еще раз.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Массовая рассылка</h2>
          <p className="text-xs text-slate-500 mt-1">
            Отправка уведомлений через Telegram-бота выбранным группам пользователей
          </p>
        </div>
      </div>

      <div className="glass-panel bg-white p-6 md:p-8 space-y-8">
        
        {/* Audience Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            Кому отправляем?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className={`cursor-pointer p-4 rounded-xl border transition-all ${targets.volunteer ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Волонтеры</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-emerald-600 rounded" 
                  checked={targets.volunteer} 
                  onChange={() => handleTargetChange('volunteer')} 
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Основной состав на проектах</p>
            </label>

            <label className={`cursor-pointer p-4 rounded-xl border transition-all ${targets.manager ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Координаторы</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-blue-600 rounded" 
                  checked={targets.manager} 
                  onChange={() => handleTargetChange('manager')} 
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Лидеры направлений</p>
            </label>

            <label className={`cursor-pointer p-4 rounded-xl border transition-all ${targets.admin ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Сотрудники</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-purple-600 rounded" 
                  checked={targets.admin} 
                  onChange={() => handleTargetChange('admin')} 
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Директора и админы</p>
            </label>
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-slate-400" />
              Текст сообщения
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Поддерживается Markdown</span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите текст рассылки... (например: **Важное объявление!** Завтра сбор в 10:00)"
            className="w-full h-40 p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none text-sm"
          />
        </div>

        {/* Status Messages */}
        {status === 'error' && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-red-800">Ошибка отправки</h4>
              <p className="text-[11px] text-red-600 mt-0.5">{resultMsg}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-3 animate-fade-in">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-800">Успешно!</h4>
              <p className="text-[11px] text-emerald-600 mt-0.5">{resultMsg}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={handleBroadcast}
            disabled={status === 'loading'}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-slate-900/10"
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Отправка...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Начать рассылку
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
