'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, CalendarDays, Filter, MessageSquare, RefreshCw, Search, Send, ShieldAlert, Sparkles, Users2 } from 'lucide-react';

type Priority = 'high' | 'medium' | 'low';

interface AgendaItem {
  id: string;
  source: 'internal_chat' | 'telegram';
  source_label: string;
  chat_title: string;
  author: string;
  role: string;
  text: string;
  created_at: string;
  priority: Priority;
  categories: string[];
  mentions: string[];
  reason: string;
  action: string;
}

interface AgendaResponse {
  generated_at: string;
  summary: {
    total: number;
    high: number;
    medium: number;
    internal: number;
    telegram: number;
    auto_replies: number;
    top_categories: { name: string; count: number }[];
    digest: string[];
    latest_replies: string[];
    recommended_actions: string[];
  };
  items: AgendaItem[];
}

const priorityLabel: Record<Priority, string> = {
  high: 'Срочно',
  medium: 'Важно',
  low: 'Мониторинг',
};

const priorityClass: Record<Priority, string> = {
  high: 'border-red-200 bg-red-50 text-red-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-slate-200 bg-slate-50 text-slate-600',
};

export default function AgendaAssistantPage() {
  const [data, setData] = useState<AgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [source, setSource] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const fromData = data?.summary.top_categories.map((item) => item.name) || [];
    return Array.from(new Set(['Риски', 'Срочно', 'Волонтеры', 'Партнеры', 'Финансы', 'Медиа', 'Логистика', ...fromData]));
  }, [data]);

  async function loadAgenda() {
    setLoading(true);
    const params = new URLSearchParams({
      period,
      source,
      priority,
      category,
      q: query,
    });

    try {
      const res = await fetch(`/api/agenda-assistant?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Failed to load agenda assistant', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgenda();
  }, [period, source, priority, category]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    loadAgenda();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <Bot className="w-3.5 h-3.5 text-slate-700" />
            ИИ Агенда
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">Агенда Ассистент руководителя</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Сводка упоминаний из внутренних чатов, Telegram-бота и Telegram-групп с приоритетами для управления.
            </p>
          </div>
        </div>

        <button
          onClick={loadAgenda}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            Всего сигналов
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{data?.summary.total ?? 0}</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-700 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            Срочно
          </div>
          <div className="mt-3 text-3xl font-extrabold text-red-700">{data?.summary.high ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <Send className="w-4 h-4" />
            Telegram
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{data?.summary.telegram ?? 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <Users2 className="w-4 h-4" />
            Внутренние чаты
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-950">{data?.summary.internal ?? 0}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            Автоответы
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-700">{data?.summary.auto_replies ?? 0}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4" />
          Фильтры
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none">
            <option value="today">Сегодня</option>
            <option value="7d">7 дней</option>
            <option value="30d">30 дней</option>
            <option value="all">Все</option>
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none">
            <option value="all">Все источники</option>
            <option value="internal_chat">Внутренние чаты</option>
            <option value="telegram">Telegram</option>
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none">
            <option value="all">Любой приоритет</option>
            <option value="high">Срочно</option>
            <option value="medium">Важно</option>
            <option value="low">Мониторинг</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none">
            <option value="all">Все категории</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск"
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-700 outline-none"
            />
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-500">
              Анализирую сообщения...
            </div>
          ) : data && data.items.length > 0 ? (
            data.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${priorityClass[item.priority]}`}>
                    {priorityLabel[item.priority]}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.source_label}
                  </span>
                  {item.categories.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-sm leading-relaxed text-slate-800">{item.text}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="font-bold text-slate-900">{item.author}</div>
                    <div className="text-slate-500 mt-0.5">{item.chat_title}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="font-bold text-slate-900">{item.reason}</div>
                    <div className="text-slate-500 mt-0.5">{item.action}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleString('ru-RU')}
                  </span>
                  {item.mentions.length > 0 && <span>{item.mentions.join(' ')}</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-500">
              По выбранным фильтрам сигналов нет.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Сводка для руководителя
            </div>
            <div className="space-y-2">
              {(data?.summary.recommended_actions || []).map((action) => (
                <div key={action} className="rounded-lg bg-slate-50 p-3 text-xs font-medium leading-relaxed text-slate-700">
                  {action}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Bot className="w-4 h-4" />
              Ответы руководителя
            </div>
            <div className="space-y-2">
              {(data?.summary.latest_replies || []).length > 0 ? data?.summary.latest_replies.map((item) => (
                <div key={item} className="rounded-lg bg-white/70 p-3 text-xs font-medium leading-relaxed text-emerald-900">
                  {item}
                </div>
              )) : (
                <div className="rounded-lg bg-white/70 p-3 text-xs font-medium text-emerald-700">Автоответов пока нет.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Главное
            </div>
            <div className="space-y-2">
              {(data?.summary.digest || []).length > 0 ? data?.summary.digest.map((item) => (
                <div key={item} className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-medium leading-relaxed text-red-800">
                  {item}
                </div>
              )) : (
                <div className="rounded-lg bg-slate-50 p-3 text-xs font-medium text-slate-500">Критичных сигналов не найдено.</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Категории</div>
            {(data?.summary.top_categories || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">{item.name}</span>
                <span className="font-extrabold text-slate-950">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
