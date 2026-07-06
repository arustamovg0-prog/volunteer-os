'use client';

import { useEffect, useState } from 'react';
import { FolderGit2, CheckSquare, Users2, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  taskCount?: number;
  completedTasks?: number;
  volunteerCount?: number;
}

export default function CoordinatorDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => {
    setName(localStorage.getItem('currentUserName') || 'Координатор');
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects/coordinator', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error('Failed to load coordinator projects:', e);
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = (s: string) =>
    s === 'active' ? 'Активен' : s === 'planning' ? 'Планирование' : 'Завершен';
  const statusColor = (s: string) =>
    s === 'active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : s === 'planning'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-500 border-slate-200';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Добро пожаловать, {name}
        </h1>
        <p className="text-sm text-slate-500">
          Здесь отображаются только проекты, назначенные вам руководителем.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{projects.length}</p>
          <p className="text-xs text-slate-500 font-medium">Назначенных проектов</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckSquare className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {projects.reduce((acc, p) => acc + (p.completedTasks || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 font-medium">Задач выполнено</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Users2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {projects.reduce((acc, p) => acc + (p.volunteerCount || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 font-medium">Волонтеров в проектах</p>
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Мои проекты</h2>

        {loading && (
          <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-sm">Загружаем проекты...</span>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-bold text-slate-700 text-sm">Проекты ещё не назначены</p>
            <p className="text-xs text-slate-500">Руководитель пока не назначил вам проекты. Пожалуйста, обратитесь к нему напрямую.</p>
          </div>
        )}

        {!loading && projects.map((project) => {
          const progress =
            project.taskCount && project.taskCount > 0
              ? Math.round(((project.completedTasks || 0) / project.taskCount) * 100)
              : 0;

          return (
            <div
              key={project.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-sm">{project.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${statusColor(project.status)}`}>
                      {statusLabel(project.status)}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {project.completedTasks || 0}/{project.taskCount || 0} задач
                    </span>
                    <span className="flex items-center gap-1">
                      <Users2 className="w-3.5 h-3.5" />
                      {project.volunteerCount || 0} волонтеров
                    </span>
                    {project.end_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        до {new Date(project.end_date).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Прогресс</span>
                      <span className="font-bold">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Link
                  href={`/coordinator-dashboard/projects/${project.id}`}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors shrink-0"
                >
                  Открыть
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
