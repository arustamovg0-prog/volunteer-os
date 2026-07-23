'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Database, 
  Server, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  TerminalSquare,
  Users,
  Bot,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Copy,
  Check,
  Wrench
} from 'lucide-react';
import { useApi } from '@/lib/useApi';

interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  details?: any;
  source: string;
  createdAt: string;
}

interface MonitorApiResponse {
  logs: SystemLog[];
  stats: {
    dbLatency: number;
    totalErrors: number;
    totalWarns: number;
    botRegistrationsCount: number;
    platformUsersCount: number;
    status: 'HEALTHY' | 'DEGRADED';
  };
}

export default function MonitorPage() {
  const [role, setRole] = useState('manager');
  const [isChecking, setIsChecking] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);
  const [fixReportText, setFixReportText] = useState('');
  const [reportCopied, setReportCopied] = useState(false);

  // Construct API endpoint with query parameters
  const apiEndpoint = `/api/logs?limit=100&level=${levelFilter}&section=${sectionFilter}&query=${encodeURIComponent(searchQuery)}`;

  const { data: monitorData, mutate, error } = useApi<MonitorApiResponse>(
    apiEndpoint, 
    { refreshInterval: autoRefresh ? 5000 : 0 }
  );

  const logs = monitorData?.logs || [];
  const stats = monitorData?.stats || {
    dbLatency: 0,
    totalErrors: 0,
    totalWarns: 0,
    botRegistrationsCount: 0,
    platformUsersCount: 0,
    status: 'HEALTHY'
  };

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
      mutate();
    } catch (e) {
      alert('Критическая ошибка соединения.');
    } finally {
      setIsChecking(false);
    }
  }

  async function handleAutoFixRequest() {
    setIsFixing(true);
    try {
      const res = await fetch('/api/logs?limit=50&level=ERROR');
      const data = await res.json();
      const errorLogs: SystemLog[] = data.logs || [];

      let report = `🚨 [ОТЧЕТ ОБ ОШИБКАХ ПЛАТФОРМЫ VOLUNTEER OS ДЛЯ ИИ-РАЗРАБОТЧИКА]\n`;
      report += `Всего найденных критических ошибок: ${errorLogs.length}\n`;
      report += `Время выгрузки: ${new Date().toLocaleString('ru-RU')}\n\n`;

      if (errorLogs.length === 0) {
        report += `✅ Критических ошибок в логах платформы не обнаружено! Все системы работают штатно.`;
      } else {
        report += `Пожалуйста, проанализируй приведенные ниже ошибки, определи их причины и внеси необходимые исправления в исходный код платформы:\n\n`;
        errorLogs.forEach((err, idx) => {
          report += `--- ОШИБКА #${idx + 1} [${err.source}] (${new Date(err.createdAt).toLocaleTimeString('ru-RU')}) ---\n`;
          report += `Сообщение: ${err.message}\n`;
          if (err.details) {
            report += `Детали JSON:\n${JSON.stringify(err.details, null, 2)}\n`;
          }
          report += `--------------------------------------------------\n\n`;
        });
      }

      setFixReportText(report);
      navigator.clipboard.writeText(report);
      setReportCopied(true);
      setShowFixModal(true);
    } catch (e) {
      alert('Не удалось собрать отчет об ошибках.');
    } finally {
      setIsFixing(false);
    }
  }

  function handleCopyDetails(details: any) {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (role !== 'developer') {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 py-24">
        <ShieldAlert className="w-16 h-16 text-purple-600 opacity-50 animate-pulse" />
        <h2 className="text-xl font-bold text-slate-900">Автономный доступ Разработчика</h2>
        <p className="text-slate-500 text-xs text-center max-w-md">
          Панель Монитора 24/7 удалена из профиля Администратора и перенесена в независимый профиль Разработчика. Пожалуйста, войдите в систему под аккаунтом Разработчика.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Developer Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-extrabold tracking-tight">Developer System Monitor 24/7</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
              LIVE BROADCAST
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Автоматический мониторинг здоровья платформы, ошибок и регистраций в реальном времени
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              autoRefresh 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {autoRefresh ? 'Автообновление (5 сек)' : 'Пауза'}
          </button>

          <button
            onClick={handleManualHealthCheck}
            disabled={isChecking}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Пинг...' : 'Запустить Health Check'}
          </button>

          <button
            onClick={handleAutoFixRequest}
            disabled={isFixing}
            className="px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all border border-red-400/30 disabled:opacity-50 cursor-pointer"
          >
            <Wrench className={`w-4 h-4 ${isFixing ? 'animate-spin' : ''}`} />
            {isFixing ? 'Сбор отчета...' : '⚡️ Устранить Ошибки (ИИ)'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DB Status */}
        <div className="glass-panel bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">База данных Neon SQL</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-slate-900">{stats.dbLatency} мс</p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Online
              </span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Total Registrations */}
        <div className="glass-panel bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Регистрации в Боте</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-slate-900">{stats.botRegistrationsCount}</p>
              <span className="text-[10px] text-slate-500 font-medium">
                (всего {stats.platformUsersCount} в CRM)
              </span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
        </div>

        {/* Errors Count */}
        <div className="glass-panel bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Ошибок в логах (ERROR)</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-slate-900">{stats.totalErrors}</p>
              {stats.totalErrors === 0 ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Чисто
                </span>
              ) : (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  Требует внимания
                </span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-xl ${stats.totalErrors > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* System Server */}
        <div className="glass-panel bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Сервер Vercel Next.js</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-slate-900">200 OK</p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                100% Uptime
              </span>
            </div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Server className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Level Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'ERROR', 'WARN', 'INFO'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  levelFilter === lvl 
                    ? 'bg-white text-slate-900 shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {lvl === 'ALL' ? 'Все уровни' : lvl}
              </button>
            ))}
          </div>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">Все разделы</option>
            <option value="bot">🤖 Telegram Bot</option>
            <option value="crm">🏢 CRM Платформа</option>
            <option value="auth">🔐 Авторизация</option>
            <option value="projects">📌 Проекты</option>
            <option value="checkins">📍 Гео-Чекины</option>
            <option value="volunteers">👥 Волонтеры</option>
            <option value="server">⚙️ Server Core</option>
          </select>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по тексту логов..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Logs Table / Stream */}
      <div className="glass-panel bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col h-[550px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wider">
            <TerminalSquare className="w-4 h-4 text-slate-600" />
            Живой Лог Операций ({logs.length})
          </h3>
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Обновляется автоматически каждые 5 сек
          </span>
        </div>
        
        <div className="overflow-y-auto flex-1 p-0">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
              <CheckCircle2 className="w-10 h-10 text-slate-250 mb-2" />
              <span>Записей по выбранному фильтру не найдено</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-100 shadow-xs z-10">
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4">Время</th>
                  <th className="py-2.5 px-4">Уровень</th>
                  <th className="py-2.5 px-4">Раздел / Источник</th>
                  <th className="py-2.5 px-4">Сообщение операции</th>
                  <th className="py-2.5 px-4 text-right">Детали JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="text-[9px] text-slate-350 block">
                        {new Date(log.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border flex items-center gap-1 w-fit font-sans ${
                        log.level === 'ERROR' ? 'bg-red-50 text-red-700 border-red-200' :
                        log.level === 'WARN' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {log.level === 'ERROR' ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                        {log.level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 font-sans">
                        {log.details?.section || log.source || 'server'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900 max-w-lg truncate">
                      {log.message}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <TerminalSquare className="w-3 h-3 text-slate-500" />
                          Просмотр
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-2xl space-y-4 animate-fade-in font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Детали лога операции</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 font-sans text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Сообщение:</span>
                <span className="text-white font-bold">{selectedLog.message}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Время события:</span>
                <span className="text-slate-300">{new Date(selectedLog.createdAt).toLocaleString('ru-RU')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Источник:</span>
                <span className="text-emerald-400 font-bold">{selectedLog.source}</span>
              </div>
            </div>

            <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-[300px]">
              <button
                onClick={() => handleCopyDetails(selectedLog.details)}
                className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-sans flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Скопировано!' : 'Копировать'}
              </button>
              <pre className="text-emerald-300 leading-relaxed text-[11px]">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-sans font-semibold text-xs transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Auto-Fix Report Modal */}
      {showFixModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 text-white shadow-2xl animate-fade-in font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/20 text-red-400 rounded-2xl ring-1 ring-red-500/30">
                  <Wrench className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight">Устранение Ошибок Платформы (ИИ)</h3>
                  <p className="text-slate-400 text-xs">Автоматически сформированный отчет диагностических данных</p>
                </div>
              </div>
              <button
                onClick={() => setShowFixModal(false)}
                className="text-slate-400 hover:text-white p-2 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>
                <strong>Отчет об ошибках скопирован в буфер обмена!</strong> Отправьте этот отчет в наш чат ИИ-разработчику. Я моментально проанализирую логи и автоматизирую исправление ошибок в коде.
              </span>
            </div>

            <div className="relative bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-300">
              <pre className="whitespace-pre-wrap">{fixReportText}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fixReportText);
                  setReportCopied(true);
                  setTimeout(() => setReportCopied(false), 2000);
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
              >
                {reportCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {reportCopied ? 'Скопировано в буфер!' : 'Скопировать отчет повторно'}
              </button>

              <button
                onClick={() => setShowFixModal(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
