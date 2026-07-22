'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderGit2, 
  Plus, 
  Activity, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  Calendar,
  UserCheck,
  X
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { useSWRConfig } from 'swr';

interface Project {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed';
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  coordinator_id?: string | null;
}

interface Coordinator {
  id: string;
  full_name: string;
  login?: string | null;
}

interface Task {
  id: string;
  project_id: string;
  status: string;
}

export default function ProjectsPage() {
  const { mutate } = useSWRConfig();
  
  const { data: projects = [] } = useApi<Project[]>('/api/projects');
  const { data: tasks = [] } = useApi<Task[]>('/api/tasks');
  const { data: coordinatorsData } = useApi<any>('/api/users?role=coordinator');
  const coordinators: Coordinator[] = (coordinatorsData?.users || coordinatorsData || []).filter((u: any) => u.role === 'coordinator');

  const loading = !projects.length && !tasks.length && !coordinatorsData;

  // Current authenticated role
  const [role, setRole] = useState('manager');

  // New Project Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'planning' | 'active' | 'completed'>('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [allowedRadiusKm, setAllowedRadiusKm] = useState<string>('0.5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coordinator assignment
  const [assigningProjectId, setAssigningProjectId] = useState<string | null>(null);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState('');

  useEffect(() => {
    const savedRole = localStorage.getItem('currentUserRole');
    if (savedRole) setRole(savedRole);

    const handleRoleChange = () => {
      const updated = localStorage.getItem('currentUserRole');
      if (updated) setRole(updated);
    };

    window.addEventListener('auth-session-change', handleRoleChange);
    return () => window.removeEventListener('auth-session-change', handleRoleChange);
  }, []);

  async function handleAssignCoordinator() {
    if (!assigningProjectId) return;
    try {
      await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId: assigningProjectId,
          coordinatorId: selectedCoordinatorId || null,
        }),
      });
      setAssigningProjectId(null);
      mutate('/api/projects');
    } catch (e) {
      console.error('Failed to assign coordinator', e);
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          status,
          start_date: startDate ? new Date(startDate).toISOString() : null,
          end_date: endDate ? new Date(endDate).toISOString() : null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          allowed_radius_km: parseFloat(allowedRadiusKm)
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setLatitude('');
        setLongitude('');
        setAllowedRadiusKm('0.5');
        mutate('/api/projects');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24 bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Реестр проектов</h2>
          <p className="text-xs text-slate-500 mt-1">
            Координация и мониторинг социальных инициатив
          </p>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all duration-150 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Новый проект
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const projTasks = tasks.filter(t => t.project_id === proj.id);
          const completedTasks = projTasks.filter(t => t.status === 'completed').length;
          const progressPercent = projTasks.length > 0 
            ? Math.round((completedTasks / projTasks.length) * 100) 
            : 0;

          const statusColors = {
            planning: 'bg-amber-50 text-amber-700 border-amber-200',
            active: 'bg-blue-50 text-blue-700 border-blue-200',
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
          };

          const statusText = {
            planning: 'Подготовка',
            active: 'Активен',
            completed: 'Завершен'
          };

          const statusIcon = {
            planning: Clock,
            active: Activity,
            completed: CheckCircle
          }[proj.status];

          const IconComponent = statusIcon;

          return (
            <div key={proj.id} className="glass-panel p-6 bg-white flex flex-col justify-between h-[250px] hover:border-slate-350 transition-all shadow-sm">
              <div>
                {/* Header elements */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {proj.start_date ? new Date(proj.start_date).toLocaleDateString('ru-RU') : 'Начало не задано'}
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${statusColors[proj.status]}`}>
                    <IconComponent className="w-3 h-3" />
                    {statusText[proj.status]}
                  </span>
                </div>

                {/* Title and description */}
                <h4 className="font-bold text-slate-900 text-sm mt-3 line-clamp-1">{proj.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {proj.description || 'Описание проекта отсутствует.'}
                </p>
              </div>

              {/* Progress and footer */}
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span className="font-medium">Выполнение задач</span>
                    <span className="font-bold text-slate-900">{completedTasks} / {projTasks.length} ({progressPercent}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        proj.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-900'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Card footer details */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    Срок до: {proj.end_date ? new Date(proj.end_date).toLocaleDateString('ru-RU') : 'отсутствует'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {role === 'admin' && (
                      <button
                        onClick={() => {
                          setAssigningProjectId(proj.id);
                          setSelectedCoordinatorId(proj.coordinator_id || '');
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 group"
                        title="Назначить координатора"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {proj.coordinator_id
                          ? (coordinators.find(c => c.id === proj.coordinator_id)?.full_name?.split(' ')[0] || 'Координатор')
                          : 'Назначить'}
                      </button>
                    )}
                    <Link 
                      href={`/dashboard/projects/${proj.id}`}
                      className="text-[10px] text-slate-900 hover:underline font-bold flex items-center gap-0.5 group"
                    >
                      Канбан доска
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-slate-900" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Coordinator Modal */}
      {assigningProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Назначить координатора</h3>
              <button onClick={() => setAssigningProjectId(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Проект: <strong>{projects.find(p => p.id === assigningProjectId)?.title}</strong>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-semibold block">Выберите координатора</label>
              <select
                value={selectedCoordinatorId}
                onChange={e => setSelectedCoordinatorId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs focus:outline-none focus:border-slate-900"
              >
                <option value="">— Без координатора —</option>
                {coordinators.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.login})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAssigningProjectId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Отмена
              </button>
              <button
                onClick={handleAssignCoordinator}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-900">Создать новый проект</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Название проекта</label>
                <input
                  type="text"
                  required
                  placeholder="Введите название инициативы"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Описание проекта</label>
                <textarea
                  placeholder="Опишите цели и задачи проекта"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Статус проекта</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs focus:outline-none focus:border-slate-900"
                >
                  <option value="planning">Подготовка</option>
                  <option value="active">Активен</option>
                  <option value="completed">Завершен</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-semibold block">Дата начала</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-semibold block">Дата завершения</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-2">
                <div className="space-y-1.5 col-span-3">
                  <label className="text-xs text-slate-900 font-bold block flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Гео-Чекин (Координаты)
                  </label>
                  <p className="text-[10px] text-slate-500">Укажите координаты места проведения для включения проверки локации.</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-semibold block">Широта (Lat)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="41.2995"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-semibold block">Долгота (Lng)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="69.2401"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-semibold block">Радиус (км)</label>
                  <select
                    value={allowedRadiusKm}
                    onChange={(e) => setAllowedRadiusKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-950 text-xs focus:outline-none focus:border-slate-900"
                  >
                    <option value="0.2">200 м</option>
                    <option value="0.5">500 м</option>
                    <option value="1">1 км</option>
                    <option value="2">2 км</option>
                    <option value="5">5 км</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Создание...' : 'Создать проект'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
