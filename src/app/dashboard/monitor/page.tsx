'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Database, Server, RefreshCw, AlertTriangle, Info, TerminalSquare } from 'lucide-react';
import { useApi } from '@/lib/useApi';

interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  details?: any;
  source: string;
  createdAt: string;
}

export default function MonitorPage() {
  const [role, setRole] = useState('manager');
  const [isChecking, setIsChecking] = useState(false);
  
  // Use SWR for logs, revalidate every 30 seconds
  const { data: logs = [], mutate, error } = useApi<SystemLog[]>('/api/logs?limit=50', { refreshInterval: 30000 });

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) setRole(savedRole);
  }, []);

  async function handleManualHealthCheck() {
    setIsChecking(true);
    try {
      const res = await fetch('/api/cron/monitor');
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Система стабильна. Задержка БД: ${data.duration}мс.`);
      } else {
        alert(`❌ Ошибка проверки системы: ${data.error}`);
      }
      mutate(); // Refresh logs
    } catch (e) {
      alert('Критическая ошибка соединения.');
    } finally {
      setIsChecking(false);
    }
  }

  if (role !== 'admin') {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-24">
        <ShieldAlert className="w-16 h-16 text-red-500 opacity-50" />
        <h2 className="text-xl font-bold text-slate-800">Доступ запрещен</h2>
        <p className="text-slate-500 text-sm">Эта панель доступна только администратору системы.</p>
      </div>
    );
  }

  const errorsCount = logs.filter(l => l.level === 'ERROR').length;
  const warnsCount = logs.filter(l => l.level === 'WARN').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            System Monitor 24/7
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Защищенная панель мониторинга стабильности и ошибок
          </p>
        </div>
        <button
          onClick={handleManualHealthCheck}
          disabled={isChecking}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Пинг...' : 'Запустить Health Check'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-semibold">База данных (Neon)</p>
              <p className="text-2xl font-bold text-slate-900">Online</p>
            </div>
          </div>
        </div>

        <div className="glass-panel bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-semibold">Критические Ошибки</p>
              <p className="text-2xl font-bold text-slate-900">{errorsCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-semibold">API Сервер (Vercel)</p>
              <p className="text-2xl font-bold text-slate-900">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col h-[600px]">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <TerminalSquare className="w-5 h-5 text-slate-500" />
            Системные Логи (Топ 50)
          </h3>
          {error && <span className="text-xs text-red-500 font-bold">Ошибка загрузки логов</span>}
        </div>
        
        <div className="overflow-y-auto flex-1 p-0">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Нет записей в логах
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Время</th>
                  <th className="py-3 px-4">Уровень</th>
                  <th className="py-3 px-4">Источник</th>
                  <th className="py-3 px-4">Сообщение</th>
                  <th className="py-3 px-4 text-right">Детали</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {new Date(log.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${
                        log.level === 'ERROR' ? 'bg-red-50 text-red-700 border-red-200' :
                        log.level === 'WARN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {log.level === 'ERROR' ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                        {log.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {log.source}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-md truncate">
                      {log.message}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <button 
                          className="text-slate-400 hover:text-slate-900"
                          onClick={() => alert(JSON.stringify(log.details, null, 2))}
                        >
                          <TerminalSquare className="w-4 h-4 inline-block" />
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
