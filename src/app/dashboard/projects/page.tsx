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
  Megaphone,
  Users,
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
  title: string;
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
  
  // Filter tab state
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'planning' | 'completed'>('all');

  async function handleUpdateProjectStatus(projectId: string, newStatus: 'planning' | 'active' | 'completed') {
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, status: newStatus })
      });
      if (res.ok) {
        mutate('/api/projects');
      } else {
        alert('Ошибка при обновлении статуса проекта');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при обновлении статуса проекта');
    }
  }

  // RSVP Modal state
  const [rsvpProject, setRsvpProject] = useState<Project | null>(null);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpIncludeButtons, setRsvpIncludeButtons] = useState(false);
  const [isSendingRsvp, setIsSendingRsvp] = useState(false);

  function openRsvpModal(proj: Project) {
    setRsvpProject(proj);
    setRsvpIncludeButtons(false);
    const dateFormatted = proj.end_date ? new Date(proj.end_date).toLocaleDateString('ru-RU') : '';
    setRsvpMessage(
`Assalomu alaykum, aziz volontyor! 🩺

🎉 Sizni "${proj.title}" loyihasida ko‘rishdan mamnun bo‘lamiz!

${proj.description || ''}
${dateFormatted ? `\n📅 Sana: ${dateFormatted}` : ''}

Iltimos, ushbu botdagi xabarlarni kuzatib boring.

───────────────────────────

Здравствуйте, дорогой волонтёр! 🩺

🎉 Будем рады видеть вас среди участников проекта "${proj.title}"!

${proj.description || ''}
${dateFormatted ? `\n📅 Дата: ${dateFormatted}` : ''}

Пожалуйста, следите за сообщениями в данном боте.`
    );
  }

  async function handleSendRSVPSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rsvpProject) return;
    setIsSendingRsvp(true);
    try {
      const res = await fetch(`/api/projects/${rsvpProject.id}/rsvp-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customText: rsvpMessage,
          includeButtons: rsvpIncludeButtons,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`🎉 Приглашения успешно отправлены! (Доставлено: ${data.count} из ${data.total})`);
        setRsvpProject(null);
        mutate('/api/tasks');
      } else {
        alert(data.error || 'Ошибка при отправке рассылки');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при отправке приглашений');
    } finally {
      setIsSendingRsvp(false);
    }
  }

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

      {/* Status Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit text-xs font-semibold">
        <button
          onClick={() => setSelectedStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg transition-all ${
            selectedStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Все ({projects.length})
        </button>
        <button
          onClick={() => setSelectedStatusFilter('active')}
          className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            selectedStatusFilter === 'active' ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          Активные ({projects.filter(p => p.status === 'active').length})
        </button>
        <button
          onClick={() => setSelectedStatusFilter('planning')}
          className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            selectedStatusFilter === 'planning' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          Подготовка ({projects.filter(p => p.status === 'planning').length})
        </button>
        <button
          onClick={() => setSelectedStatusFilter('completed')}
          className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            selectedStatusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          Завершенные ({projects.filter(p => p.status === 'completed').length})
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects
          .filter((proj) => selectedStatusFilter === 'all' || proj.status === selectedStatusFilter)
          .map((proj) => {
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
            <div key={proj.id} className="glass-panel p-6 bg-white flex flex-col justify-between min-h-[270px] h-full hover:border-slate-350 transition-all shadow-sm rounded-2xl">
              <div>
                {/* Header elements */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {proj.start_date ? new Date(proj.start_date).toLocaleDateString('ru-RU') : 'Начало не задано'}
                  </span>
                  
                  {['admin', 'manager'].includes(role) ? (
                    <select
                      value={proj.status}
                      onChange={(e) => handleUpdateProjectStatus(proj.id, e.target.value as any)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none transition-all ${statusColors[proj.status]}`}
                      title="Нажмите, чтобы изменить статус проекта"
                    >
                      <option value="active">🔵 Активен</option>
                      <option value="planning">⏳ Подготовка</option>
                      <option value="completed">✅ Завершен</option>
                    </select>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusColors[proj.status]}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                      {statusText[proj.status]}
                    </span>
                  )}
                </div>

                {/* Title and description */}
                <h4 className="font-bold text-slate-900 text-sm mt-3 line-clamp-1">{proj.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {proj.description || 'Описание проекта отсутствует.'}
                </p>
              </div>

              {/* Progress and footer */}
              <div className="space-y-3 mt-4">
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
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
                <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
                  {/* Footer Line 1: Dates & Coordinator / RSVP stats */}
                  <div className="flex items-center justify-between text-xs flex-wrap gap-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Срок до: {proj.end_date ? new Date(proj.end_date).toLocaleDateString('ru-RU') : 'отсутствует'}
                    </span>

                    <div className="flex items-center gap-2">
                      {(() => {
                        const rsvpTasks = projTasks.filter(t => t.title.startsWith('RSVP:'));
                        const yesCount = rsvpTasks.filter(t => t.status === 'accepted').length;
                        const noCount = rsvpTasks.filter(t => t.status === 'rejected').length;
                        return rsvpTasks.length > 0 ? (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                            👍 <span className="text-emerald-600 font-bold">{yesCount}</span> | 👎 <span className="text-red-500 font-bold">{noCount}</span>
                          </span>
                        ) : null;
                      })()}

                      {role === 'admin' && (
                        <button
                          onClick={() => {
                            setAssigningProjectId(proj.id);
                            setSelectedCoordinatorId(proj.coordinator_id || '');
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                          title="Назначить координатора"
                        >
                          <UserCheck className="w-3 h-3" />
                          {proj.coordinator_id
                            ? (coordinators.find(c => c.id === proj.coordinator_id)?.full_name?.split(' ')[0] || 'Координатор')
                            : 'Назначить'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer Line 2: RSVP Broadcast & Kanban Board Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => openRsvpModal(proj)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95 shadow-2xs cursor-pointer"
                      title="Настройка и отправка рассылки волонтерам"
                    >
                      <Megaphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Пригласить (RSVP)</span>
                    </button>

                    <Link 
                      href={`/dashboard/projects/${proj.id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap shadow-xs active:scale-95 cursor-pointer"
                    >
                      <span>Доска</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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

      {/* RSVP Customization Modal */}
      {rsvpProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">Рассылка приглашения (RSVP)</h2>
                  <p className="text-xs text-slate-500 font-medium">Проект: <span className="font-semibold text-slate-800">{rsvpProject.title}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setRsvpProject(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendRSVPSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Текст сообщения для рассылки в Telegram-бот
                </label>
                <textarea
                  value={rsvpMessage}
                  onChange={(e) => setRsvpMessage(e.target.value)}
                  rows={9}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-sans focus:ring-2 focus:ring-amber-500 focus:border-amber-500 leading-relaxed text-slate-800 bg-slate-50/50"
                  placeholder="Введите текст приглашения..."
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Вы можете свободно изменить текст перед отправкой.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="includeButtonsToggle"
                  checked={rsvpIncludeButtons}
                  onChange={(e) => setRsvpIncludeButtons(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="includeButtonsToggle" className="cursor-pointer space-y-0.5">
                  <span className="text-xs font-bold text-amber-950 block">
                    Добавить кнопки ответа (✅ Да, буду участвовать / ❌ Не смогу)
                  </span>
                  <span className="text-[11px] text-amber-800/80 block leading-normal">
                    Если галочка снята, волонтеры получат только текстовое приглашение без кнопок выбора.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRsvpProject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSendingRsvp || !rsvpMessage.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Megaphone className="w-4 h-4" />
                  {isSendingRsvp ? 'Отправка...' : 'Отправить рассылку волонтерам'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
