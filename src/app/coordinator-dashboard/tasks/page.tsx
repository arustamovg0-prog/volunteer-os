'use client';

import { useEffect, useState } from 'react';
import { CheckSquare, Plus, FolderGit2, Clock, CheckCircle2, AlertCircle, Search, User } from 'lucide-react';

interface Task {
  id: string;
  project_id: string;
  assigned_to?: string | null;
  title: string;
  deadline: string;
  status: 'pending' | 'accepted' | 'completed';
  is_overdue: boolean;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
}

interface Volunteer {
  id: string;
  full_name: string;
  login?: string;
  is_senior?: boolean;
}

export default function CoordinatorTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [projRes, tasksRes, volsRes] = await Promise.all([
        fetch('/api/projects/coordinator', { credentials: 'include' }),
        fetch('/api/tasks', { credentials: 'include' }),
        fetch('/api/volunteers', { credentials: 'include' })
      ]);

      let loadedProjects: Project[] = [];
      if (projRes.ok) {
        const pData = await projRes.json();
        loadedProjects = pData.projects || [];
        setProjects(loadedProjects);
      }

      if (volsRes.ok) {
        const vData = await volsRes.json();
        setVolunteers(vData || []);
      }

      if (tasksRes.ok) {
        const tData: Task[] = await tasksRes.json();
        // Filter tasks for projects assigned to this coordinator
        const projectIds = new Set(loadedProjects.map(p => p.id));
        const filtered = tData.filter(t => projectIds.has(t.project_id));
        setTasks(filtered);
      }
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !projectId || !deadline) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          project_id: projectId,
          assigned_to: assignedTo || null,
          deadline,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setProjectId('');
        setAssignedTo('');
        setDeadline('');
        loadData();
      }
    } catch (e) {
      console.error('Failed to create task:', e);
    } finally {
      setSubmitting(false);
    }
  }

  const getProjectTitle = (pId: string) =>
    projects.find(p => p.id === pId)?.title || 'Неизвестный проект';

  const getVolunteerName = (vId?: string | null) => {
    if (!vId) return 'Не назначен';
    const vol = volunteers.find(v => v.id === vId);
    return vol ? `${vol.is_senior ? '⭐ ' : ''}${vol.full_name}` : 'Неизвестный волонтер';
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      getProjectTitle(t.project_id).toLowerCase().includes(search.toLowerCase()) ||
      getVolunteerName(t.assigned_to).toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'overdue' ? t.is_overdue :
      t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Задачи моих проектов</h1>
          <p className="text-sm text-slate-500">Управление задачами и контроль исполнения в ваших проектах</p>
        </div>
        <button
          onClick={() => {
            if (projects.length > 0) setProjectId(projects[0].id);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          Создать задачу
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск задач по названию, проекту или исполнителю..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'accepted', 'completed', 'overdue'].map((sf) => (
            <button
              key={sf}
              onClick={() => setStatusFilter(sf)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === sf
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sf === 'all' && 'Все'}
              {sf === 'pending' && 'В ожидании'}
              {sf === 'accepted' && 'В работе'}
              {sf === 'completed' && 'Завершены'}
              {sf === 'overdue' && '⚠️ Просрочены'}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-medium">Загружаем задачи...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Задачи не найдены</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Создайте первую задачу для ваших проектов, чтобы распределить нагрузки между волонтерами.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((t) => (
              <div key={t.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{t.title}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3 text-slate-400" />
                      {getProjectTitle(t.project_id)}
                    </span>
                    {t.is_overdue && (
                      <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 text-[10px] font-extrabold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Просрочено
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {getVolunteerName(t.assigned_to)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Срок: {new Date(t.deadline).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    t.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : t.status === 'accepted'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {t.status === 'completed' ? 'Завершена' : t.status === 'accepted' ? 'В работе' : 'В ожидании'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Create Task */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Новая задача</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Название задачи</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Разгрузить гуманитарный груз"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Проект</label>
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="" disabled>Выберите проект</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Назначить волонтера (необязательно)</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Все волонтеры (свободная задача)</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.is_senior ? '⭐ ' : ''}{v.full_name} ({v.login || 'no-login'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Срок сдачи (дедлайн)</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
